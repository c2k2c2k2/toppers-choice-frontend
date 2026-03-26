import { buildApiUrl } from "@/lib/api/config";
import { createApiError } from "@/lib/api/errors";

export interface ApiRequestOptions
  extends Omit<RequestInit, "body" | "headers"> {
  body?: BodyInit | object | null;
  headers?: HeadersInit;
  accessToken?: string | null;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

function isJsonBody(body: ApiRequestOptions["body"]): body is object {
  return (
    typeof body === "object" &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  );
}

function prepareBody(body: ApiRequestOptions["body"], headers: Headers) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isJsonBody(body)) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return JSON.stringify(body);
  }

  return body;
}

export async function apiRequest<ResponseType>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (options.accessToken) {
    headers.set("authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: prepareBody(options.body, headers),
  });

  if (!response.ok) {
    throw await createApiError(response, url);
  }

  if (response.status === 204) {
    return undefined as ResponseType;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return (await response.text()) as ResponseType;
  }

  return (await response.json()) as ResponseType;
}
