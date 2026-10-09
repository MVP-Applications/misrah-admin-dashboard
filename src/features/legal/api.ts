import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';

// Profile → Legal Framework, stored as a settings document:
//   type = "legal", key = "LEGAL_FRAMEWORK",
//   value = { title, protocolVersion, pdfUrl, sections: [{ order, title, body }] }
//
//   GET    /settings/one?type&key     read (admin + host)
//   POST   /settings                  upsert the whole document (admin)
//   POST   /settings/section          append a section (admin)
//   PATCH  /settings/section          update a section by order (admin)
//   DELETE /settings/section?key&order&type   remove a section (admin)

export const LEGAL_TYPE = 'legal';
export const LEGAL_KEY = 'LEGAL_FRAMEWORK';

export interface LegalSection {
  order: number;
  title: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  protocolVersion: string;
  pdfUrl: string;
  sections: LegalSection[];
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');

function toDocument(raw: unknown): LegalDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  // Accept { value: {...} } (setting record) or the value itself.
  const value = (obj.value && typeof obj.value === 'object' ? obj.value : obj) as Record<string, unknown>;
  const sections = (Array.isArray(value.sections) ? value.sections : []) as Array<Record<string, unknown>>;
  return {
    title: text(value.title),
    protocolVersion: text(value.protocolVersion),
    pdfUrl: text(value.pdfUrl),
    sections: sections
      .map((s, i) => ({ order: typeof s.order === 'number' ? s.order : Number(s.order) || i + 1, title: text(s.title), body: text(s.body) }))
      .sort((a, b) => a.order - b.order),
  };
}

// null when the document hasn't been created yet (404 / empty).
export async function getLegalFramework(): Promise<LegalDocument | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessEnvelope<unknown>>(API_ENDPOINTS.settings.one, {
      params: { type: LEGAL_TYPE, key: LEGAL_KEY },
    });
    return toDocument(data.data);
  } catch (err) {
    // apiClient rejects with a normalized { statusCode, message } object.
    if ((err as { statusCode?: number })?.statusCode === 404) return null;
    throw err;
  }
}

// Creates or replaces the whole document (header + sections).
export async function saveLegalFramework(doc: LegalDocument): Promise<void> {
  await apiClient.post(API_ENDPOINTS.settings.all, {
    type: LEGAL_TYPE,
    key: LEGAL_KEY,
    value: {
      title: doc.title,
      protocolVersion: doc.protocolVersion,
      ...(doc.pdfUrl ? { pdfUrl: doc.pdfUrl } : {}),
      sections: doc.sections.map(s => ({ order: s.order, title: s.title, body: s.body })),
    },
  });
}

export async function addLegalSection(section: { title: string; body: string; order?: number }): Promise<void> {
  await apiClient.post(API_ENDPOINTS.settings.section, { type: LEGAL_TYPE, key: LEGAL_KEY, section });
}

export async function updateLegalSection(order: number, patch: { title?: string; body?: string; newOrder?: number }): Promise<void> {
  await apiClient.patch(API_ENDPOINTS.settings.section, { type: LEGAL_TYPE, key: LEGAL_KEY, order, ...patch });
}

export async function deleteLegalSection(order: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.settings.section, { params: { type: LEGAL_TYPE, key: LEGAL_KEY, order } });
}

// Message from a normalized apiClient error (or a plain Error).
export const errorMessage = (err: unknown, fallback: string): string =>
  (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string' && (err as { message: string }).message) || fallback;
