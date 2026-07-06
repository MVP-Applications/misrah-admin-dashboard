// Confirmed live against https://misra-test.mvp-apps.ae — a request without the
// required x-api-key header returns exactly this envelope, which matches the
// standard shape of a NestJS global exception filter. Success responses are NOT
// wrapped in this envelope — they're the raw JSON the controller returns.
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
