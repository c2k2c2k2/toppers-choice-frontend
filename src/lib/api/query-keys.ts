export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
    sessions: () => ["auth", "sessions"] as const,
  },
  publicBootstrap: (siteCode?: string | null) =>
    ["public-bootstrap", siteCode ?? "default"] as const,
  cms: {
    resolve: () => ["cms", "public", "resolve"] as const,
    page: (slug: string) => ["cms", "public", "page", slug] as const,
  },
} as const;
