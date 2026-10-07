// Chat — shapes from captured GET /chat/conversations and
// GET /chat/conversation/{id}/messages responses, plus the socket payloads
// the mobile app uses (see ./socket.ts).

export interface ChatParticipant {
  _id: string;
  name: string;
  profileImage?: string | null;
  userType?: string;
}

export interface ChatLastMessage {
  content: string;
  type: string;
  createdAt: string;
  senderId: string;
  senderName?: string;
}

export interface ChatConversation {
  _id: string;
  participants: string[];
  lastMessageAt: string | null;
  createdAt: string;
  lastMessage?: ChatLastMessage | null;
  unreadCount: number;
  property?: { _id: string; title?: string } | null;
  // The other party in the one-to-one conversation.
  participant?: ChatParticipant | null;
  lastMessageTime?: string;
}

// An attachment as returned inside a message's `fileIds` (mobile app's Doc
// model: type | mimetype, fileId, fullUrl, size).
export interface ChatFile {
  type?: string;
  mimetype?: string;
  fileId?: string;
  fullUrl?: string;
  size?: number | string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  content: string;
  type: string; // 'text' | 'image' | ...
  readAt: string | null;
  fileId?: string | null;
  // Populated attachment objects on read; plain ids may appear on some payloads.
  fileIds?: Array<ChatFile | string>;
  createdAt: string;
  updatedAt?: string;
  sender?: { _id: string; name?: string; profileImage?: string | null } | null;
  // Some socket payloads may carry a bare senderId instead of `sender`.
  senderId?: string;
}

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListMessagesParams {
  page?: number;
  limit?: number;
}

// Socket: emit('sendMessage') / emit('typing') body — mirrors the mobile
// app's SendMesgData.toJson().
export interface SendMessagePayload {
  convoId: string;
  conversationId?: string;
  content?: string;
  type?: string;
  isTyping?: boolean;
  fileIds?: string[];
}
