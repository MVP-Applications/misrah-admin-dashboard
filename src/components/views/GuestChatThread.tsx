import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { ImagePlus, Loader2, MessageSquare, Paperclip, RotateCcw, Send, TriangleAlert, X } from 'lucide-react';
import { uploadFile } from '../../features/properties/api';
import { createConversation, listMessages, markConversationRead } from '../../features/chat/api';
import {
  disconnectChatSocket,
  joinConversation,
  leaveConversation,
  onConnectionChange,
  onNewMessage,
  onSocketError,
  sendChatMessage,
} from '../../features/chat/socket';
import type { ChatMessage } from '../../features/chat/types';
import { fileCount, MAX_ATTACHMENT_MB, MAX_ATTACHMENTS, messageFiles } from '../../features/chat/files';

// The booking page's Message popup body: the logged-in user's real chat
// thread with this guest, via the same chat API as the Messages page (REST
// for history, Socket.IO for sending + live messages — see features/chat/).
//
// Opening it calls POST /chat/conversation with the guest + the logged-in
// user (and the booking's property) — the same find-or-create the mobile
// app's host booking pages use — then joins that conversation's socket room,
// so the host can start a chat even if the guest never messaged.

const MESSAGES_PAGE_SIZE = 30;
// No server echo within this long → check via REST, else mark undelivered.
const DELIVERY_TIMEOUT_MS = 10000;

const senderIdOf = (m: ChatMessage) => m.sender?._id ?? m.senderId ?? '';

const messageTime = (m: ChatMessage) => {
  const d = m.createdAt ? parseISO(m.createdAt) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return isToday(d) ? format(d, 'h:mm a') : format(d, 'MMM d · h:mm a');
};

interface GuestChatThreadProps {
  guestUserId?: string;
  guestName: string;
  currentUserId: string;
  // Property (or experience's property) the booking is for — sent so the
  // conversation is tied to it, as the mobile app does.
  propertyId?: string;
}

export const GuestChatThread = ({ guestUserId, guestName, currentUserId, propertyId }: GuestChatThreadProps) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const [socketError, setSocketError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Images picked to send with the next message (uploaded on Send).
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Uploaded file ids per optimistic message — reused on Retry.
  const tempFilesRef = useRef<Record<string, string[]>>({});

  const conversationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const deliveryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const load = useCallback(async () => {
    if (!guestUserId) {
      setStatus('none');
      return;
    }
    setStatus('loading');
    setLoadError(null);
    try {
      const conversation = await createConversation({
        participantIds: [guestUserId, currentUserId],
        ...(propertyId ? { propertyId } : {}),
      });
      conversationIdRef.current = conversation._id;
      setConversationId(conversation._id);
      joinConversation(conversation._id);
      const list = await listMessages(conversation._id, { page: 1, limit: MESSAGES_PAGE_SIZE });
      setMessages(list);
      setStatus('ready');
      scrollToBottom();
      markConversationRead(conversation._id).catch(() => undefined);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load the conversation.');
      setStatus('error');
    }
  }, [guestUserId, currentUserId, propertyId]);

  useEffect(() => { load(); }, [load]);

  // Socket lifecycle — this popup only lives on the bookings page, so it
  // closes the shared connection on unmount like the Messages page does.
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
      if (conversationIdRef.current) leaveConversation(conversationIdRef.current);
      disconnectChatSocket();
    };
  }, []);

  // Free picked-image previews when the popup closes.
  const attachmentsRef = useRef(attachments);
  attachmentsRef.current = attachments;
  useEffect(() => () => attachmentsRef.current.forEach(a => URL.revokeObjectURL(a.preview)), []);

  // Rejoin after a reconnect (rooms don't survive it).
  useEffect(() => {
    if (isConnected && conversationIdRef.current) joinConversation(conversationIdRef.current);
  }, [isConnected]);

  // Live messages for this conversation; my echo replaces its optimistic copy.
  useEffect(() => {
    const off = onNewMessage(raw => {
      const message = raw as ChatMessage;
      if (!message?.conversationId || message.conversationId !== conversationIdRef.current) return;
      const fromMe = senderIdOf(message) === currentUserId;
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        if (fromMe) {
          const tempIdx = prev.findIndex(
            m => m._id.startsWith('temp-') && (m.content || '') === (message.content || '') && fileCount(m) === fileCount(message),
          );
          if (tempIdx !== -1) {
            clearTimeout(deliveryTimersRef.current[prev[tempIdx]._id]);
            delete deliveryTimersRef.current[prev[tempIdx]._id];
            const next = [...prev];
            next[tempIdx] = message;
            return next;
          }
        }
        return [...prev, message];
      });
      if (!fromMe) markConversationRead(message.conversationId).catch(() => undefined);
      // Live payloads may carry bare file ids (no URL) — fetch the saved copy,
      // whose fileIds are populated, so the image shows instead of nothing.
      if (fileCount(message) > 0 && messageFiles(message).length === 0) {
        listMessages(message.conversationId, { page: 1, limit: MESSAGES_PAGE_SIZE })
          .then(latest => {
            const saved = latest.find(m => m._id === message._id);
            if (saved) setMessages(prev => prev.map(m => (m._id === saved._id ? saved : m)));
          })
          .catch(() => undefined);
      }
      scrollToBottom();
    });
    return off;
  }, [currentUserId]);

  // No echo arrived — the server may have saved it anyway; check before
  // calling it failed.
  const verifyDelivery = async (convoId: string, tempId: string, content: string, filesSent: number, sentAt: string) => {
    delete deliveryTimersRef.current[tempId];
    try {
      const latest = await listMessages(convoId, { page: 1, limit: MESSAGES_PAGE_SIZE });
      const saved = latest.find(
        m =>
          senderIdOf(m) === currentUserId &&
          (m.content || '') === content &&
          fileCount(m) === filesSent &&
          (m.createdAt ?? '') >= sentAt.slice(0, 16),
      );
      if (saved) {
        setMessages(prev => (prev.some(m => m._id === saved._id) ? prev.filter(m => m._id !== tempId) : prev.map(m => (m._id === tempId ? saved : m))));
        return;
      }
    } catch {
      // fall through to "failed"
    }
    setFailedIds(prev => ({ ...prev, [tempId]: true }));
  };

  const sendContent = (convoId: string, content: string, tempId: string, fileIds: string[] = []) => {
    const sentAt = new Date().toISOString();
    tempFilesRef.current[tempId] = fileIds;
    sendChatMessage({ convoId, content, type: fileIds.length > 0 ? 'image' : 'text', fileIds });
    clearTimeout(deliveryTimersRef.current[tempId]);
    deliveryTimersRef.current[tempId] = setTimeout(
      () => verifyDelivery(convoId, tempId, content, fileIds.length, sentAt),
      DELIVERY_TIMEOUT_MS,
    );
  };

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
    setComposeError(errors.length ? errors.join(' · ') : null);
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = messageText.trim();
    if ((!content && attachments.length === 0) || !conversationId || isUploading) return;
    const convoId = conversationId;

    // Upload images first (POST /files/upload), then send their ids.
    let uploaded: Array<{ id: string; url: string; mime: string }> = [];
    if (attachments.length > 0) {
      setIsUploading(true);
      setComposeError(null);
      try {
        uploaded = await Promise.all(
          attachments.map(async a => {
            const res = await uploadFile(a.file);
            return { id: res.id, url: res.url, mime: a.file.type };
          }),
        );
      } catch (err) {
        setComposeError(err instanceof Error ? `Image upload failed: ${err.message}` : 'Image upload failed.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
      setAttachments([]);
    }

    const tempId = `temp-${Date.now()}`;
    const fileIds = uploaded.map(u => u.id);
    sendContent(convoId, content, tempId, fileIds);
    // Optimistic copy — replaced by the server's newMessage echo.
    setMessages(prev => [
      ...prev,
      {
        _id: tempId,
        conversationId: convoId,
        content,
        type: fileIds.length > 0 ? 'image' : 'text',
        readAt: null,
        createdAt: new Date().toISOString(),
        sender: { _id: currentUserId },
        fileIds: uploaded.map(u => ({ fileId: u.id, fullUrl: u.url, type: u.mime })),
      },
    ]);
    setMessageText('');
    scrollToBottom();
  };

  const retrySend = (message: ChatMessage) => {
    setFailedIds(prev => {
      const next = { ...prev };
      delete next[message._id];
      return next;
    });
    sendContent(message.conversationId, message.content || '', message._id, tempFilesRef.current[message._id] || []);
  };

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#F8F9FA] rounded-2xl border border-border-misrah/70 min-h-[220px] max-h-[340px]"
      >
        {status === 'loading' && (
          <div className="h-full min-h-[180px] flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted-text" />
          </div>
        )}

        {status === 'error' && (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center gap-3 text-center">
            <TriangleAlert size={22} className="text-danger" />
            <p className="text-[11px] font-bold text-danger">{loadError}</p>
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 rounded-xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        )}

        {status === 'none' && (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center gap-2 text-center px-6">
            <MessageSquare size={22} className="text-[#D4C3B5]" />
            <p className="text-xs font-black text-primary">Can't message {guestName}</p>
            <p className="text-[11px] text-muted-text font-medium leading-relaxed">
              This booking has no linked guest account. You can still reach them with Call.
            </p>
          </div>
        )}

        {status === 'ready' && messages.length === 0 && (
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-muted-text/60 py-10">
            No messages yet — say hello to {guestName.split(' ')[0]}
          </p>
        )}

        {status === 'ready' && messages.map(msg => {
          const mine = senderIdOf(msg) === currentUserId;
          const failed = failedIds[msg._id];
          const pending = msg._id.startsWith('temp-') && !failed;
          const files = messageFiles(msg);
          return (
            <div key={msg._id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap break-words ${
                  mine
                    ? `bg-[#0F1D33] text-white rounded-tr-xs shadow-xs ${pending ? 'opacity-70' : ''}`
                    : 'bg-white text-primary border border-border-misrah rounded-tl-xs shadow-xs'
                }`}
              >
                {files.length > 0 && (
                  <div className={`grid gap-2 ${files.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${msg.content ? 'mb-2' : ''}`}>
                    {files.map(f =>
                      f.isImage ? (
                        <a key={f.key} href={f.url} target="_blank" rel="noopener noreferrer" className="block">
                          <img
                            src={f.url}
                            alt="Attachment"
                            loading="lazy"
                            onLoad={scrollToBottom}
                            className="max-h-48 w-full rounded-xl object-cover bg-black/5"
                          />
                        </a>
                      ) : (
                        <a
                          key={f.key}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 underline underline-offset-2"
                        >
                          <Paperclip size={13} /> Open attachment
                        </a>
                      ),
                    )}
                  </div>
                )}
                {msg.content}
                {!msg.content && files.length === 0 && fileCount(msg) > 0 && (
                  <span className="italic opacity-70">Attachment unavailable</span>
                )}
              </div>
              {failed ? (
                <button
                  type="button"
                  onClick={() => retrySend(msg)}
                  className="text-[10px] text-danger mt-1 px-1 font-bold flex items-center gap-1 hover:underline"
                >
                  <RotateCcw size={10} /> Not delivered · Retry
                </button>
              ) : (
                <span className="text-[10px] text-muted-text mt-1 px-1 font-bold">
                  {pending ? 'Sending…' : messageTime(msg)}
                  {mine && !pending && msg.readAt && ' · Read'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {(socketError || composeError) && (
        <p className="text-[10px] font-bold text-danger px-1">{composeError ?? socketError}</p>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-3 px-1 pt-1 overflow-x-auto">
          {attachments.map((a, idx) => (
            <div key={a.preview} className="relative shrink-0">
              <img src={a.preview} alt={a.file.name} className="w-14 h-14 rounded-xl object-cover border border-border-misrah" />
              <button
                type="button"
                onClick={() => removeAttachment(idx)}
                disabled={isUploading}
                title="Remove"
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePickImages} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={status !== 'ready' || isUploading || attachments.length >= MAX_ATTACHMENTS}
          title="Attach images"
          className="h-11 w-11 shrink-0 rounded-2xl bg-surface border border-border-misrah text-muted-text hover:text-primary hover:border-accent flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <ImagePlus size={18} />
        </button>
        <input
          type="text"
          value={messageText}
          onChange={e => setMessageText(e.target.value)}
          disabled={status !== 'ready'}
          placeholder={status === 'ready' ? `Message ${guestName.split(' ')[0]}...` : 'Messaging unavailable'}
          className="flex-1 px-4 py-3 bg-surface border border-border-misrah rounded-2xl text-xs font-bold text-primary placeholder:text-muted-text focus:outline-hidden focus:border-accent transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status !== 'ready' || isUploading || (!messageText.trim() && attachments.length === 0)}
          className="h-11 px-5 bg-primary disabled:opacity-40 text-accent font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
        >
          <span>{isUploading ? 'Uploading…' : 'Send'}</span>
          {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
    </>
  );
};
