import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { ApiSuccessEnvelope } from '../../api/types';
import type { UserRole } from '../../types';

// Authenticated sessions (Profile → Security). Admin → /admin/auth/sessions*,
// host → /host/auth/sessions*.
//   GET    …/sessions             → { activeFleetCount, sessions: AuthSession[] }
//   DELETE …/sessions/{id}        → revoke one session
//   POST   …/sessions/logout-all  → revoke every session (incl. this one)

export interface AuthSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null; // desktop | mobile | tablet
  location: string | null;
  ipAddress: string | null;
  browser: string | null;
  os: string | null;
  isCurrent: boolean;
  status: string | null; // e.g. "ACTIVE NODE"
  lastActiveAt: string | null;
  createdAt: string | null;
}

export interface SessionsResponse {
  activeFleetCount: number;
  sessions: AuthSession[];
}

const endpoints = (role: UserRole) => (role === 'manager' ? API_ENDPOINTS.host.auth : API_ENDPOINTS.admin.auth);

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

export async function listSessions(role: UserRole): Promise<SessionsResponse> {
  const { data } = await apiClient.get<ApiSuccessEnvelope<Record<string, unknown>>>(endpoints(role).sessions);
  const body = (data.data ?? {}) as Record<string, unknown>;
  const raw = (Array.isArray(body) ? body : Array.isArray(body.sessions) ? body.sessions : []) as Array<Record<string, unknown>>;
  const sessions: AuthSession[] = raw.map(s => ({
    id: String(s.id ?? s._id ?? ''),
    deviceName: str(s.deviceName),
    deviceType: str(s.deviceType),
    location: str(s.location),
    ipAddress: str(s.ipAddress),
    browser: str(s.browser),
    os: str(s.os),
    isCurrent: s.isCurrent === true,
    status: str(s.status),
    lastActiveAt: str(s.lastActiveAt),
    createdAt: str(s.createdAt),
  }));
  // Current device first, then most recently active.
  sessions.sort((a, b) =>
    Number(b.isCurrent) - Number(a.isCurrent) ||
    (Date.parse(b.lastActiveAt ?? '') || 0) - (Date.parse(a.lastActiveAt ?? '') || 0),
  );
  const count = typeof body.activeFleetCount === 'number' ? body.activeFleetCount : sessions.length;
  return { activeFleetCount: count, sessions };
}

export async function revokeSession(id: string, role: UserRole): Promise<void> {
  await apiClient.delete(endpoints(role).sessionById(id));
}

export async function logoutAllSessions(role: UserRole): Promise<void> {
  await apiClient.post(endpoints(role).logoutAllSessions);
}
