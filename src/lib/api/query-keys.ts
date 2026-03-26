export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
    sessions: () => ["auth", "sessions"] as const,
  },
  student: {
    dashboard: () => ["student", "dashboard"] as const,
    catalog: () => ["student", "catalog"] as const,
    cms: () => ["student", "cms"] as const,
    notifications: () => ["student", "notifications"] as const,
    analytics: () => ["student", "analytics"] as const,
    notesTree: () => ["student", "notes", "tree"] as const,
    notesList: (filters: {
      mediumId?: string | null;
      search?: string | null;
      subjectId?: string | null;
      topicId?: string | null;
    }) =>
      [
        "student",
        "notes",
        "list",
        {
          mediumId: filters.mediumId ?? null,
          search: filters.search ?? null,
          subjectId: filters.subjectId ?? null,
          topicId: filters.topicId ?? null,
        },
      ] as const,
    note: (noteId: string) => ["student", "notes", "detail", noteId] as const,
    contentList: (filters: {
      family?: string | null;
      featuredOnly?: boolean | null;
      format?: string | null;
      search?: string | null;
    }) =>
      [
        "student",
        "content",
        "list",
        {
          family: filters.family ?? null,
          featuredOnly: filters.featuredOnly ?? null,
          format: filters.format ?? null,
          search: filters.search ?? null,
        },
      ] as const,
    contentDetail: (slug: string) =>
      ["student", "content", "detail", slug] as const,
  },
  publicBootstrap: (siteCode?: string | null) =>
    ["public-bootstrap", siteCode ?? "default"] as const,
  cms: {
    resolve: () => ["cms", "public", "resolve"] as const,
    page: (slug: string) => ["cms", "public", "page", slug] as const,
  },
} as const;
