import { io, type Socket } from 'socket.io-client';
import { env } from '../../config/env';
import * as tokenStorage from '../auth/tokenStorage';
import type { ChatMessage, SendMessagePayload } from './types';

// Realtime chat over Socket.IO — same contract as the mobile app:
//   path '/socket.io' (default namespace), handshake auth { token }
//   emit  joinConversation / leaveConversation  { conversationId }
//   emit  sendMessage { convoId, content, type, isTyping, fileIds }
//   emit  typing      { convoId, isTyping }
//   on    newMessage  (message)
//   on    typing      (payload)
// One shared connection for the app. `auth` is a function so every
// (re)connect sends the CURRENT access token — the app refreshes tokens in
// the background and the stored one rotates.

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    socket = io(env.API_BASE_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: (cb) => cb({ token: tokenStorage.getAccessToken() ?? '' }),
      reconnection: true,
    });
  }
  if (socket.disconnected) socket.connect();
  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinConversation(conversationId: string): void {
  getChatSocket().emit('joinConversation', { conversationId });
}

export function leaveConversation(conversationId: string): void {
  socket?.emit('leaveConversation', { conversationId });
}

// The mobile model's field is `convoId`; its JSON key isn't confirmed, so
// both `convoId` and `conversationId` are sent — the gateway reads whichever
// it expects and ignores the other.
export function sendChatMessage(payload: SendMessagePayload): void {
  const s = getChatSocket();
  const body = { type: 'text', isTyping: false, fileIds: [], ...payload, conversationId: payload.convoId };
  if (import.meta.env.DEV) console.debug('[chat] emit sendMessage', body, 'connected:', s.connected);
  // Ack callback: a NestJS handler's return value comes back here (if it returns one).
  s.emit('sendMessage', body, (response: unknown) => {
    if (import.meta.env.DEV) console.debug('[chat] sendMessage ack', response);
  });
}

// Same body shape the mobile app sends for 'typing' (its SendMesgData with
// isTyping set), plus the conversationId alias — see sendChatMessage.
export function sendTyping(convoId: string, isTyping: boolean): void {
  const body = { convoId, conversationId: convoId, content: '', type: 'text', isTyping, fileIds: [] };
  if (import.meta.env.DEV) console.debug('[chat] emit typing', body);
  getChatSocket().emit('typing', body);
}

export function onNewMessage(handler: (message: ChatMessage) => void): () => void {
  const s = getChatSocket();
  s.on('newMessage', handler);
  return () => { s.off('newMessage', handler); };
}

export function onTyping(handler: (payload: Record<string, unknown>) => void): () => void {
  const s = getChatSocket();
  s.on('typing', handler);
  return () => { s.off('typing', handler); };
}

// Server-side rejections (NestJS WsException → 'exception') and handshake
// failures (bad/expired token → 'connect_error'), surfaced to the UI.
export function onSocketError(handler: (message: string) => void): () => void {
  const s = getChatSocket();
  const toMessage = (payload: unknown) => {
    if (!payload) return 'Chat server error.';
    if (typeof payload === 'string') return payload;
    const p = payload as { message?: unknown; error?: unknown };
    const message = Array.isArray(p.message) ? p.message.join(' ') : p.message ?? p.error;
    return typeof message === 'string' ? message : 'Chat server error.';
  };
  const onException = (payload: unknown) => {
    console.warn('[chat] socket exception', payload);
    handler(toMessage(payload));
  };
  const onConnectError = (err: Error) => {
    console.warn('[chat] connect_error', err?.message);
    handler(`Chat connection failed: ${err?.message || 'unknown error'}`);
  };
  s.on('exception', onException);
  s.on('error', onException);
  s.on('connect_error', onConnectError);
  return () => {
    s.off('exception', onException);
    s.off('error', onException);
    s.off('connect_error', onConnectError);
  };
}

export function onConnectionChange(handler: (connected: boolean) => void): () => void {
  const s = getChatSocket();
  const up = () => handler(true);
  const down = () => handler(false);
  s.on('connect', up);
  s.on('disconnect', down);
  s.on('connect_error', down);
  handler(s.connected);
  return () => {
    s.off('connect', up);
    s.off('disconnect', down);
    s.off('connect_error', down);
  };
}
