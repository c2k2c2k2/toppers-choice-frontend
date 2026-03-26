const DEFAULT_CLIENT_API_BASE_URL = "/api/v1";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export type QueryValue = string | number | boolean | null | undefined;

export function resolveApiBaseUrl() {
  if (typeof window !== "undefined") {
    return DEFAULT_CLIENT_API_BASE_URL;
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return trimTrailingSlash(configuredBaseUrl);
  }

  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is required for server-side API requests.",
  );
}

export function buildApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimTrailingSlash(resolveApiBaseUrl())}${normalizedPath}`;
}

export function withQuery(
  path: string,
  query: Record<string, QueryValue>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  if (!queryString) {
    return path;
  }

  return `${path}?${queryString}`;
}
