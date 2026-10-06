import type { CreatePromoCodeRequest, ListPromoCodesParams, PromoCode, UpdatePromoCodeRequest } from './types';

// LOCAL STAND-IN FOR A PROMO CODE API.
// The backend has no promo-code endpoints yet (not in the live OpenAPI spec),
// so this persists to localStorage in this browser only — nothing reaches the
// server or the traveller app. Every function is async and shaped like the
// other feature api.ts modules, so wiring the real routes later only means
// replacing these bodies with apiClient calls (+ adding API_ENDPOINTS entries).

const STORAGE_KEY = 'misrah_admin_promo_codes';

function readAll(): PromoCode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(codes: PromoCode[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {
    throw new Error('Could not save promo codes in this browser (storage unavailable).');
  }
}

const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

function assertUniqueCode(codes: PromoCode[], code: string, ignoreId?: string) {
  if (codes.some(c => c.code === code && c._id !== ignoreId)) {
    throw new Error(`Promo code "${code}" already exists.`);
  }
}

export async function listPromoCodes(params: ListPromoCodesParams = {}): Promise<PromoCode[]> {
  const q = params.search?.trim().toLowerCase();
  return readAll()
    .filter(c => params.isActive === undefined || c.isActive === params.isActive)
    .filter(c => !q || c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPromoCode(payload: CreatePromoCodeRequest): Promise<PromoCode> {
  const codes = readAll();
  const code = normalizeCode(payload.code);
  assertUniqueCode(codes, code);
  const now = new Date().toISOString();
  const created: PromoCode = {
    ...payload,
    code,
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  writeAll([created, ...codes]);
  return created;
}

export async function updatePromoCode(id: string, payload: UpdatePromoCodeRequest): Promise<PromoCode> {
  const codes = readAll();
  const existing = codes.find(c => c._id === id);
  if (!existing) throw new Error('Promo code not found.');
  const code = payload.code !== undefined ? normalizeCode(payload.code) : existing.code;
  assertUniqueCode(codes, code, id);
  const updated: PromoCode = { ...existing, ...payload, code, updatedAt: new Date().toISOString() };
  writeAll(codes.map(c => (c._id === id ? updated : c)));
  return updated;
}

export async function deletePromoCode(id: string): Promise<void> {
  writeAll(readAll().filter(c => c._id !== id));
}
