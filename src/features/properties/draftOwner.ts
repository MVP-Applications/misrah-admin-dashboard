import type { HostAssignmentSelection } from './types';

// Admin drafts: the "Who owns this property?" choice, kept in this browser
// per draft id. The draft API may not echo the ownership fields back (and
// 'admin-managed' sends none at all), so this restores the choice on reopen
// when the response can't. Never holds a password. Best-effort: storage can
// be unavailable (private mode), so every access is guarded.

const key = (draftId: string) => `misrah:draft-owner:${draftId}`;

export function saveDraftOwner(draftId: string, selection: HostAssignmentSelection | undefined): void {
  try {
    if (!selection) {
      localStorage.removeItem(key(draftId));
      return;
    }
    const copy = { ...selection } as HostAssignmentSelection & { password?: string };
    delete copy.password;
    localStorage.setItem(key(draftId), JSON.stringify(copy));
  } catch {
    // storage unavailable — the API fields are the only source then
  }
}

export function loadDraftOwner(draftId: string): HostAssignmentSelection | undefined {
  try {
    const raw = localStorage.getItem(key(draftId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as HostAssignmentSelection;
    return parsed && typeof parsed === 'object' && 'mode' in parsed ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function clearDraftOwner(draftId: string): void {
  try {
    localStorage.removeItem(key(draftId));
  } catch {
    // ignore
  }
}
