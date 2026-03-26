export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string | null;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  requestId: string | null;
  path?: string;
  url: string;

  constructor({
    status,
    url,
    payload,
  }: {
    status: number;
    url: string;
    payload: ApiErrorPayload;
  }) {
    super(payload.message ?? `Request failed with status ${status}.`);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code ?? "REQUEST_FAILED";
    this.details = payload.details;
    this.requestId = payload.requestId ?? null;
    this.path = payload.path;
    this.url = url;
  }
}

export async function createApiError(response: Response, url: string) {
  let payload: ApiErrorPayload = {};

  try {
    payload = (await response.clone().json()) as ApiErrorPayload;
  } catch {
    payload = {};
  }

  return new ApiError({
    status: response.status,
    url,
    payload: {
      code: payload.code,
      message:
        payload.message ??
        response.statusText ??
        "An unexpected API error occurred.",
      details: payload.details,
      requestId:
        payload.requestId ?? response.headers.get("x-request-id") ?? null,
      path: payload.path,
      timestamp: payload.timestamp,
    },
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
