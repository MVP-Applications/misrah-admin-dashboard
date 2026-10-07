import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { Search, Send, MessageSquare, Loader2, TriangleAlert, UserRound, Trash2, ChevronUp, ImagePlus, X, Paperclip } from 'lucide-react';
import { uploadFile } from '../../features/properties/api';
import { User } from '../../types';
import { deleteMessage, listConversations, listMessages, markConversationRead } from '../../features/chat/api';
import {
  disconnectChatSocket,
  joinConversation,
  leaveConversation,
  onConnectionChange,
  onSocketError,
  onNewMessage,
  onTyping,
  sendChatMessage,
  sendTyping,
} from '../../features/chat/socket';
import type { ChatConversation, ChatFile, ChatMessage } from '../../features/chat/types';

// Host Messages — REST for history (/chat/conversations, /chat/conversation/
// {id}/messages, read, delete) + Socket.IO for realtime (newMessage, typing)
// and sending (sendMessage). See features/chat/.

interface MessagesViewProps {
  user: User;
}

const MESSAGES_PAGE_SIZE = 30;
const TYPING_IDLE_MS = 2000;
// While the user keeps typing, re-send isTyping:true this often so the other
// side's indicator doesn't time out.
const TYPING_HEARTBEAT_MS = 1500;
// No server echo within this long → verify via REST, else mark undelivered.
const DELIVERY_TIMEOUT_MS = 10000;

const senderIdOf = (m: ChatMessage) => m.sender?._id ?? m.senderId ?? '';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_MB = 10;

// Normalized attachments of a message (fileIds holds Doc objects on read).
interface DisplayFile {
  key: string;
  url: string;
  isImage: boolean;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|bmp|svg)(\?|#|$)/i;

const messageFiles = (m: ChatMessage): DisplayFile[] =>
  (m.fileIds || [])
    .map((f, idx): DisplayFile | null => {
      if (!f || typeof f === 'string') return null; // bare id — no URL to show
      const file = f as ChatFile;
      if (!file.fullUrl) return null;
      const mime = (file.type || file.mimetype || '').toLowerCase();
      return {
        key: file.fileId || `${m._id}-${idx}`,
        url: file.fullUrl,
        isImage: mime.startsWith('image') || IMAGE_EXT.test(file.fullUrl) || m.type === 'image',
      };
    })
    .filter((f): f is DisplayFile => f !== null);

const fileCount = (m: ChatMessage) => (m.fileIds || []).length;

const safeDate = (value?: string | null) => {
  if (!value) return null;
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const listTime = (c: ChatConversation) => {
  if (c.lastMessageTime) return c.lastMessageTime;
  const d = safeDate(c.lastMessageAt ?? c.createdAt);
  if (!d) return '';
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};

const messageTime = (m: ChatMessage) => {
  const d = safeDate(m.createdAt);
  if (!d) return '';
  return isToday(d) ? format(d, 'h:mm a') : format(d, 'MMM d · h:mm a');
};

const Avatar = ({ url, name, size = 'w-12 h-12' }: { url?: string | null; name: string; size?: string }) => {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img src={url} alt={name} onError={() => setFailed(true)} className={`${size} rounded-2xl object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-2xl bg-surface border border-border-misrah flex items-center justify-center text-muted-text/60 shrink-0`}>
      <UserRound size={18} />
    </div>
  );
};

export const MessagesView = ({ user }: MessagesViewProps) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasOlder, setHasOlder] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Optimistic messages that never got confirmed (temp id → true).
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState<string | null>(null);
  // Images picked to send with the next message.
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Uploaded file ids per optimistic message — reused on Retry.
  const tempFilesRef = useRef<Record<string, string[]>>({});
  const deliveryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const activeIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSentRef = useRef(false);
  const lastTypingSentAtRef = useRef(0);
  const otherTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConversation = useMemo(() => conversations.find(c => c._id === activeId) ?? null, [conversations, activeId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  // ----- Conversations -----
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchConversations = useCallback(async () => {
    setConversationsError(null);
    try {
      const list = await listConversations({ page: 1, limit: 50, search: debouncedSearch || undefined });
      setConversations(list);
    } catch (err) {
      setConversationsError(err instanceof Error ? err.message : 'Failed to load conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setIsLoadingConversations(true);
    fetchConversations();
  }, [fetchConversations]);

  // ----- Socket lifecycle -----
  useEffect(() => {
    const offConnection = onConnectionChange(connected => {
      setIsConnected(connected);
      if (connected) setSocketError(null);
    });
    const offError = onSocketError(setSocketError);
    return () => {
      offConnection();
      offError();
      Object.values(deliveryTimersRef.current).forEach(clearTimeout);
      if (activeIdRef.current) leaveConversation(activeIdRef.current);
      disconnectChatSocket();
    };
  }, []);

  // Rejoin the open conversation after a reconnect (rooms don't survive it).
  useEffect(() => {
    if (isConnected && activeIdRef.current) joinConversation(activeIdRef.current);
  }, [isConnected]);

  // Incoming messages — active thread gets them appended; the list's
  // preview / unread / order are updated for every conversation.
  useEffect(() => {
    const off = onNewMessage(raw => {
      const message = raw as ChatMessage;
      if (!message?.conversationId) return;
      const fromMe = senderIdOf(message) === user.id;
      const isActive = message.conversationId === activeIdRef.current;

      if (isActive) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          // Replace my optimistic copy of the same text, if any.
          if (fromMe) {
            const tempIdx = prev.findIndex(
              m => m._id.startsWith('temp-') && (m.content || '') === (message.content || '') && fileCount(m) === fileCount(message),
            );
            if (tempIdx !== -1) {
              const tempId = prev[tempIdx]._id;
              clearTimeout(deliveryTimersRef.current[tempId]);
              delete deliveryTimersRef.current[tempId];
              const next = [...prev];
              next[tempIdx] = message;
              return next;
            }
          }
          return [...prev, message];
        });
        if (!fromMe) {
          setIsOtherTyping(false);
          markConversationRead(message.conversationId).catch(() => undefined);
        }
        scrollToBottom();
      }

      setConversations(prev => {
        const existing = prev.find(c => c._id === message.conversationId);
        if (!existing) {
          // New conversation started by someone else — reload the list.
          fetchConversations();
          return prev;
        }
        const updated: ChatConversation = {
          ...existing,
          lastMessage: {
            content: message.content,
            type: message.type,
            createdAt: message.createdAt,
            senderId: senderIdOf(message),
            senderName: message.sender?.name,
          },
          lastMessageAt: message.createdAt,
          lastMessageTime: undefined,
          unreadCount: isActive || fromMe ? 0 : (existing.unreadCount || 0) + 1,
        };
        return [updated, ...prev.filter(c => c._id !== message.conversationId)];
      });
    });
    return off;
  }, [user.id, fetchConversations]);

  // Typing indicator from the other participant.
  useEffect(() => {
    const off = onTyping(payload => {
      const convoId = (payload.convoId ?? payload.conversationId) as string | undefined;
      const fromId = (payload.userId ?? payload.senderId) as string | undefined;
      if (!convoId || convoId !== activeIdRef.current || fromId === user.id) return;
      const typing = payload.isTyping !== false;
      setIsOtherTyping(typing);
      if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
      if (typing) otherTypingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 5000);
    });
    return off;
  }, [user.id]);

  // ----- Open a conversation -----
  const stopTyping = (convoId: string | null) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (convoId && isTypingSentRef.current) sendTyping(convoId, false);
    isTypingSentRef.current = false;
  };

  const openConversation = async (conversationId: string) => {
    if (conversationId === activeIdRef.current) return;
    const previous = activeIdRef.current;
    stopTyping(previous);
    if (previous) leaveConversation(previous);

    activeIdRef.current = conversationId;
    setActiveId(conversationId);
    setMessages([]);
    setMessagesPage(1);
    setHasOlder(false);
    setMessagesError(null);
    setIsOtherTyping(false);
    setMessageText('');

    joinConversation(conversationId);
    setIsLoadingMessages(true);
    try {
      const list = await listMessages(conversationId, { page: 1, limit: MESSAGES_PAGE_SIZE });
      if (activeIdRef.current !== conversationId) return;
      setMessages(list);
      setHasOlder(list.length >= MESSAGES_PAGE_SIZE);
      scrollToBottom();
      await markConversationRead(conversationId).catch(() => undefined);
      setConversations(prev => prev.map(c => (c._id === conversationId ? { ...c, unreadCount: 0 } : c)));
    } catch (err) {
      if (activeIdRef.current === conversationId) {
        setMessagesError(err instanceof Error ? err.message : 'Failed to load messages.');
      }
    } finally {
      if (activeIdRef.current === conversationId) setIsLoadingMessages(false);
    }
  };

  const loadOlder = async () => {
    if (!activeId || isLoadingOlder) return;
    const nextPage = messagesPage + 1;
    setIsLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    try {
      const older = await listMessages(activeId, { page: nextPage, limit: MESSAGES_PAGE_SIZE });
      setMessages(prev => {
        const known = new Set(prev.map(m => m._id));
        return [...older.filter(m => !known.has(m._id)), ...prev];
      });
      setMessagesPage(nextPage);
      setHasOlder(older.length >= MESSAGES_PAGE_SIZE);
      // Keep the viewport on the same message after prepending.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Failed to load older messages.');
    } finally {
      setIsLoadingOlder(false);
    }
  };

  // ----- Compose -----
  const handleTextChange = (value: string) => {
    setMessageText(value);
    if (!activeId) return;
    if (value.trim()) {
      const now = Date.now();
      if (!isTypingSentRef.current || now - lastTypingSentAtRef.current >= TYPING_HEARTBEAT_MS) {
        sendTyping(activeId, true);
        isTypingSentRef.current = true;
        lastTypingSentAtRef.current = now;
      }
    } else if (isTypingSentRef.current) {
      // Cleared the box — stop typing right away.
      stopTyping(activeId);
      return;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => stopTyping(activeId), TYPING_IDLE_MS);
  };

  // If no echo arrived, the server may still have saved it (and just not
  // echoed to the sender) — check the latest page before calling it failed.
  const verifyDelivery = async (conversationId: string, tempId: string, content: string, filesSent: number, sentAt: string) => {
    delete deliveryTimersRef.current[tempId];
    try {
      const latest = await listMessages(conversationId, { page: 1, limit: MESSAGES_PAGE_SIZE });
      const saved = latest.find(
        m =>
          senderIdOf(m) === user.id &&
          (m.content || '') === content &&
          fileCount(m) === filesSent &&
          (m.createdAt ?? '') >= sentAt.slice(0, 16),
      );
      if (saved && activeIdRef.current === conversationId) {
        setMessages(prev => (prev.some(m => m._id === saved._id) ? prev.filter(m => m._id !== tempId) : prev.map(m => (m._id === tempId ? saved : m))));
        return;
      }
    } catch {
      // fall through to "failed"
    }
    setFailedIds(prev => ({ ...prev, [tempId]: true }));
  };

  const sendContent = (conversationId: string, content: string, tempId: string, fileIds: string[] = []) => {
    const sentAt = new Date().toISOString();
    tempFilesRef.current[tempId] = fileIds;
    sendChatMessage({ convoId: conversationId, content, type: fileIds.length > 0 ? 'image' : 'text', fileIds });
    clearTimeout(deliveryTimersRef.current[tempId]);
    deliveryTimersRef.current[tempId] = setTimeout(
      () => verifyDelivery(conversationId, tempId, content, fileIds.length, sentAt),
      DELIVERY_TIMEOUT_MS,
    );
  };

  const retrySend = (message: ChatMessage) => {
    setFailedIds(prev => {
      const next = { ...prev };
      delete next[message._id];
      return next;
    });
    sendContent(message.conversationId, message.content || '', message._id, tempFilesRef.current[message._id] || []);
  };

  // ----- Attachments -----
  const handlePickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from((e.target.files ?? []) as ArrayLike<File>) as File[];
    e.target.value = '';
    const errors: string[] = [];
    const accepted = picked.filter(f => {
      if (!f.type.startsWith('image/')) {
        errors.push(`${f.name} is not an image`);
        return false;
      }
      if (f.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
        errors.push(`${f.name} is over ${MAX_ATTACHMENT_MB}MB`);
        return false;
      }
      return true;
    });
    setAttachments(prev => {
      const room = MAX_ATTACHMENTS - prev.length;
      if (accepted.length > room) errors.push(`Up to ${MAX_ATTACHMENTS} images per message`);
      return [...prev, ...accepted.slice(0, Math.max(0, room)).map(file => ({ file, preview: URL.createObjectURL(file) }))];
    });
    setMessagesError(errors.length ? errors.join(' · ') : null);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Drop picked images when switching conversation / leaving the page.
  useEffect(() => () => attachments.forEach(a => URL.revokeObjectURL(a.preview)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setAttachments(prev => {
      prev.forEach(a => URL.revokeObjectURL(a.preview));
      return [];
    });
  }, [activeId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = messageText.trim();
    if ((!content && attachments.length === 0) || !activeId || isUploading) return;
    const conversationId = activeId;
    stopTyping(conversationId);

    // Upload images first (POST /files/upload), then send their ids.
    let uploaded: Array<{ id: string; url: string; mime: string }> = [];
    if (attachments.length > 0) {
      setIsUploading(true);
      setMessagesError(null);
      try {
        uploaded = await Promise.all(
          attachments.map(async a => {
            const res = await uploadFile(a.file);
            return { id: res.id, url: res.url, mime: a.file.type };
          }),
        );
      } catch (err) {
        setMessagesError(err instanceof Error ? `Image upload failed: ${err.message}` : 'Image upload failed.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
      setAttachments([]);
    }

    const tempId = `temp-${Date.now()}`;
    const fileIds = uploaded.map(u => u.id);
    const type = fileIds.length > 0 ? 'image' : 'text';
    sendContent(conversationId, content, tempId, fileIds);

    // Optimistic copy — replaced by the server's newMessage echo.
    const now = new Date().toISOString();
    if (activeIdRef.current === conversationId) {
      setMessages(prev => [
        ...prev,
        {
          _id: tempId,
          conversationId,
          content,
          type,
          readAt: null,
          createdAt: now,
          sender: { _id: user.id, name: user.name },
          fileIds: uploaded.map(u => ({ fileId: u.id, fullUrl: u.url, type: u.mime })),
        },
      ]);
    }
    setConversations(prev => {
      const existing = prev.find(c => c._id === conversationId);
      if (!existing) return prev;
      return [
        { ...existing, lastMessage: { content, type, createdAt: now, senderId: user.id }, lastMessageAt: now, lastMessageTime: undefined },
        ...prev.filter(c => c._id !== conversationId),
      ];
    });
    setMessageText('');
    scrollToBottom();
  };

  const handleDelete = async (message: ChatMessage) => {
    if (message._id.startsWith('temp-')) return;
    if (!window.confirm('Delete this message?')) return;
    setDeletingId(message._id);
    try {
      await deleteMessage(message._id);
      setMessages(prev => prev.filter(m => m._id !== message._id));
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : 'Failed to delete the message.');
    } finally {
      setDeletingId(null);
    }
  };

  const otherName = (c: ChatConversation | null) => c?.participant?.name || 'Guest';

  return (
    <div className="h-[calc(100vh-160px)] flex gap-6">
      {/* Conversation list */}
      <div className="w-1/3 min-w-[280px] flex flex-col bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black italic text-primary uppercase leading-none">Inquiries</h2>
            <span
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                isConnected ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-600'
              }`}
              title={isConnected ? 'Realtime connected' : 'Reconnecting to realtime chat…'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" size={16} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search thread..."
              className="w-full pl-12 pr-4 py-3.5 bg-surface border border-border-misrah rounded-2xl text-xs font-bold focus:border-accent outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
          {isLoadingConversations ? (
            <div className="flex justify-center py-16">
              <Loader2 size={28} className="animate-spin text-primary/30" />
            </div>
          ) : conversationsError ? (
            <div className="p-6 text-center space-y-3">
              <TriangleAlert size={24} className="mx-auto text-danger" />
              <p className="text-[10px] font-bold text-danger uppercase tracking-widest">{conversationsError}</p>
              <button onClick={fetchConversations} className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-8 text-center text-[10px] font-bold text-muted-text/60 uppercase tracking-widest">
              {debouncedSearch ? 'No conversations match your search' : 'No conversations yet'}
            </p>
          ) : (
            conversations.map(c => {
              const isActive = c._id === activeId;
              const preview = c.lastMessage
                ? `${c.lastMessage.senderId === user.id ? 'You: ' : ''}${
                    c.lastMessage.type === 'image'
                      ? `📷 Photo${c.lastMessage.content ? ` · ${c.lastMessage.content}` : ''}`
                      : c.lastMessage.type === 'text' || !c.lastMessage.type
                        ? c.lastMessage.content
                        : `📎 ${c.lastMessage.content || 'Attachment'}`
                  }`
                : 'No messages yet';
              return (
                <button
                  key={c._id}
                  onClick={() => openConversation(c._id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-[32px] transition-all group relative ${
                    isActive ? 'bg-[#1A1B2E] text-white shadow-xl shadow-primary/20' : 'hover:bg-surface'
                  }`}
                >
                  <Avatar url={c.participant?.profileImage} name={otherName(c)} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2 pointer-events-none">
                      <span className="text-[13px] font-black uppercase tracking-tight truncate">{otherName(c)}</span>
                      <span className={`text-[9px] font-bold shrink-0 ${isActive ? 'text-accent' : 'text-muted-text'}`}>{listTime(c)}</span>
                    </div>
                    <p className={`text-[11px] font-medium mt-0.5 truncate pr-6 ${isActive ? 'text-white/60' : 'text-muted-text group-hover:text-primary'}`}>
                      {preview}
                    </p>
                    {c.property?.title && (
                      <div className="mt-2 text-[8px] font-black uppercase tracking-[1px] opacity-40 truncate">{c.property.title}</div>
                    )}
                  </div>
                  {c.unreadCount > 0 && !isActive && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 min-w-5 h-5 px-1 bg-accent text-primary rounded-full flex items-center justify-center text-[9px] font-black italic shadow-lg shadow-accent/20">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col bg-white rounded-[40px] border border-border-misrah overflow-hidden shadow-sm relative">
        {activeConversation ? (
          <>
            <div className="p-6 border-b border-border-misrah flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar url={activeConversation.participant?.profileImage} name={otherName(activeConversation)} size="w-11 h-11" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-primary uppercase tracking-tight italic truncate">{otherName(activeConversation)}</h3>
                  <span className="text-[9px] font-black text-muted-text uppercase tracking-widest">
                    {isOtherTyping
                      ? 'Typing…'
                      : [activeConversation.participant?.userType === 'consumer' ? 'Guest' : activeConversation.participant?.userType, activeConversation.property?.title]
                          .filter(Boolean)
                          .join(' · ')}
                  </span>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6">
              {hasOlder && !isLoadingMessages && (
                <div className="flex justify-center">
                  <button
                    onClick={loadOlder}
                    disabled={isLoadingOlder}
                    className="px-4 py-2 rounded-xl bg-surface border border-border-misrah text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isLoadingOlder ? <Loader2 size={12} className="animate-spin" /> : <ChevronUp size={12} />}
                    Load older messages
                  </button>
                </div>
              )}

              {isLoadingMessages ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-primary/30" />
                </div>
              ) : messages.length === 0 && !messagesError ? (
                <p className="text-center text-[10px] font-bold text-muted-text/60 uppercase tracking-widest py-16">
                  No messages yet — say hello
                </p>
              ) : (
                messages.map(msg => {
                  const mine = senderIdOf(msg) === user.id;
                  const pending = msg._id.startsWith('temp-');
                  return (
                    <div key={msg._id} className={`flex group/msg ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] space-y-1.5 flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2">
                          {mine && !pending && (
                            <button
                              onClick={() => handleDelete(msg)}
                              disabled={deletingId === msg._id}
                              title="Delete message"
                              className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-lg text-muted-text hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-50"
                            >
                              {deletingId === msg._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          )}
                          <div
                            className={`p-5 rounded-[32px] text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${
                              mine
                                ? `bg-[#1A1B2E] text-white rounded-tr-none shadow-xl shadow-primary/10 ${pending ? 'opacity-60' : ''}`
                                : 'bg-surface text-primary rounded-tl-none border border-border-misrah/50'
                            }`}
                          >
                            {messageFiles(msg).length > 0 && (
                              <div className={`grid gap-2 ${messageFiles(msg).length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${msg.content ? 'mb-3' : ''}`}>
                                {messageFiles(msg).map(f =>
                                  f.isImage ? (
                                    <a key={f.key} href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                                      <img
                                        src={f.url}
                                        alt="Attachment"
                                        loading="lazy"
                                        className="max-h-64 w-full rounded-2xl object-cover bg-black/5"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      key={f.key}
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 underline underline-offset-2 text-xs"
                                    >
                                      <Paperclip size={14} /> Open attachment
                                    </a>
                                  ),
                                )}
                              </div>
                            )}
                            {msg.content}
                            {!msg.content && messageFiles(msg).length === 0 && fileCount(msg) > 0 && (
                              <span className="italic opacity-70">Attachment unavailable</span>
                            )}
                          </div>
                        </div>
                        {pending && failedIds[msg._id] ? (
                          <span className="text-[9px] font-black text-danger uppercase tracking-widest px-2 flex items-center gap-2">
                            Not delivered
                            <button type="button" onClick={() => retrySend(msg)} className="underline hover:text-primary">Retry</button>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest px-2">
                            {pending ? 'Sending…' : messageTime(msg)}
                            {mine && !pending && (msg.readAt ? ' · Read' : ' · Sent')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {messagesError && (
                <p className="text-center text-[10px] font-black text-danger uppercase tracking-widest">{messagesError}</p>
              )}
            </div>

            <form onSubmit={handleSend} className="p-8 pt-4">
              {socketError && (
                <p className="text-[9px] font-black text-danger uppercase tracking-widest px-2 pb-2">{socketError}</p>
              )}
              {!isConnected && !socketError && (
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-2 pb-2">
                  Reconnecting — messages will send once the connection is back
                </p>
              )}
              {attachments.length > 0 && (
                <div className="flex gap-3 px-2 pb-3 overflow-x-auto">
                  {attachments.map((a, idx) => (
                    <div key={a.preview} className="relative shrink-0">
                      <img src={a.preview} alt={a.file.name} className="w-16 h-16 rounded-xl object-cover border border-border-misrah" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        disabled={isUploading}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50"
                        title="Remove"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-surface rounded-[32px] border border-border-misrah p-3 px-6 flex items-center gap-4 focus-within:border-accent transition-all">
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePickImages} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || attachments.length >= MAX_ATTACHMENTS}
                  title="Attach images"
                  className="text-muted-text hover:text-primary transition-colors disabled:opacity-40"
                >
                  <ImagePlus size={20} />
                </button>
                <input
                  value={messageText}
                  onChange={e => handleTextChange(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 bg-transparent border-0 text-sm font-medium focus:ring-0 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={(!messageText.trim() && attachments.length === 0) || isUploading}
                  className="w-12 h-12 rounded-2xl bg-primary text-accent flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-20 h-20 rounded-[32px] bg-surface flex items-center justify-center text-[#D4C3B5] border border-border-misrah mb-4">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-xl font-black italic text-primary uppercase">No Active Thread</h3>
            <p className="text-[11px] font-bold text-muted-text uppercase tracking-[2px] max-w-xs leading-relaxed">
              Select a conversation from the left panel to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
