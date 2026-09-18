// Confirmed live against https://misra-test.mvp-apps.ae — success responses ARE
// wrapped too (corrected from an earlier, wrong assumption that only errors
// were wrapped — a real login returned this exact shape).
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  responseTime: number;
}

// Confirmed live against https://misra-test.mvp-apps.ae — a request without the
// required x-api-key header returns exactly this envelope, which matches the
// standard shape of a NestJS global exception filter.
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  // class-validator returns an array of messages on 400s, a single string otherwise.
  message: string | string[];
  error: string;
}

// Normalized shape every apiClient call rejects with, regardless of whether the
// server returned ApiErrorResponse, a network error, or something unexpected.
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Shared shape for every `/enums/*` lookup endpoint (e.g. booking-statuses,
// experience-booking-statuses) — confirmed live. `key` is the enum name
// (e.g. "CONFIRMED"), `value` is the actual string sent/received on the wire
// (e.g. "confirmed") — use `value`, never `key`, when filtering or comparing
// against a record's status field.
export interface EnumOption {
  key: string;
  value: string;
}
