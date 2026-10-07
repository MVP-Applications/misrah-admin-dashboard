import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { ChatConversation, ChatMessage, ListConversationsParams, ListMessagesParams } from './types';

// REST side of chat. Sending messages has no REST route — it goes over the
// socket (./socket.ts).

// GET /chat/conversations — captured: { data: { conversations: [...] } }.
export async function listConversations(params: ListConversationsParams = {}): Promise<ChatConversation[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<{ conversations?: ChatConversation[] }>>(
    API_ENDPOINTS.chat.conversations,
    { params },
  );
  const list = data.data?.conversations;
  if (!Array.isArray(list)) throw new Error('[chat] conversations response has an unexpected shape.');
  return list;
}

// GET /chat/conversation/{id}/messages — captured: { data: { messages: [...] } }.
// Returned oldest → newest for display, regardless of the API's page order.
export async function listMessages(conversationId: string, params: ListMessagesParams = {}): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<{ messages?: ChatMessage[] }>>(
    API_ENDPOINTS.chat.messages(conversationId),
    { params },
  );
  const list = data.data?.messages;
  if (!Array.isArray(list)) throw new Error('[chat] messages response has an unexpected shape.');
  return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// POST /chat/conversation/{id}/read — marks all unread messages as read.
export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.chat.markRead(conversationId));
}

// DELETE /chat/message/{id} — own messages only.
export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.chat.message(messageId));
}
