import type { ChatFile, ChatMessage } from './types';

// Normalized attachments of a message — `fileIds` holds populated Doc objects
// ({ type | mimetype, fileId, fullUrl, size }) on read; a bare id string has
// no URL to show and is skipped. Shared by the Messages page and the booking
// page's message popup.
export interface DisplayFile {
  key: string;
  url: string;
  isImage: boolean;
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|bmp|svg)(\?|#|$)/i;

export const messageFiles = (m: ChatMessage): DisplayFile[] =>
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

export const fileCount = (m: ChatMessage) => (m.fileIds || []).length;

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_MB = 10;
