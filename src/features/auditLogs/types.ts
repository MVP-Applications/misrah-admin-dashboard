// Backed by an ALREADY-LIVE endpoint — misra-api-nest's AuditLogController
// (src/modules/audit-log/controllers/audit-log.controller.ts), which was
// never touched by this project. Verified from AuditLogService.findAll():
// returns { data, total, page, limit, totalPages } directly (not wrapped in
// ResponseDto), the same flat pagination convention as adminUsers — a
// DIFFERENT convention from bookings' (currentPage/totalCount/totalPages).
// See API_INTEGRATION.md → "Notifications".

export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogChangedBy {
  _id: string;
  name?: string;
  email?: string;
}

export interface AuditLogEntry {
  _id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, { old: unknown; new: unknown }>;
  changedBy?: AuditLogChangedBy;
  changedAt: string;
  metadata?: { ip?: string; userAgent?: string; [key: string]: unknown };
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: AuditAction;
}

export interface ListAuditLogsResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
