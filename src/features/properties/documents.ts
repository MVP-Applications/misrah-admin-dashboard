// Display helpers for property compliance documents (API `documents`).

// Display names for the document `type` values the create flow and API use;
// anything else is humanized from camelCase/snake_case.
const DOCUMENT_LABELS: Record<string, string> = {
  ownershipProof: 'Ownership Proof',
  propertyDoc: 'Title Deed / Ejari',
  emiratesId: 'Passport / Emirates ID',
  tradeLicense: 'Trade License',
};

export const documentLabel = (type: string): string =>
  DOCUMENT_LABELS[type] ??
  type.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());

// ISO timestamp → "20 Oct 2026".
export const formatDocumentDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
