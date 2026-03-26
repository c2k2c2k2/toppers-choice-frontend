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
    entitlements: () => ["student", "entitlements"] as const,
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
    practiceSessions: (filters: {
      limit?: number | null;
      status?: string | null;
    }) =>
      [
        "student",
        "practice",
        "sessions",
        {
          limit: filters.limit ?? null,
          status: filters.status ?? null,
        },
      ] as const,
    practiceSession: (sessionId: string) =>
      ["student", "practice", "session", sessionId] as const,
    practiceSubjectProgress: (filters: {
      examTrackId?: string | null;
    }) =>
      [
        "student",
        "practice",
        "progress",
        "subjects",
        {
          examTrackId: filters.examTrackId ?? null,
        },
      ] as const,
    practiceTopicProgress: (filters: {
      examTrackId?: string | null;
      subjectId?: string | null;
    }) =>
      [
        "student",
        "practice",
        "progress",
        "topics",
        {
          examTrackId: filters.examTrackId ?? null,
          subjectId: filters.subjectId ?? null,
        },
      ] as const,
    practiceWeakQuestions: (filters: {
      limit?: number | null;
      subjectId?: string | null;
      topicId?: string | null;
    }) =>
      [
        "student",
        "practice",
        "progress",
        "weak-questions",
        {
          limit: filters.limit ?? null,
          subjectId: filters.subjectId ?? null,
          topicId: filters.topicId ?? null,
        },
      ] as const,
    practiceTrends: (filters: {
      days?: number | null;
    }) =>
      [
        "student",
        "practice",
        "progress",
        "trends",
        {
          days: filters.days ?? null,
        },
      ] as const,
    tests: (filters: {
      accessType?: string | null;
      examTrackId?: string | null;
      family?: string | null;
      mediumId?: string | null;
      subjectId?: string | null;
    }) =>
      [
        "student",
        "tests",
        "list",
        {
          accessType: filters.accessType ?? null,
          examTrackId: filters.examTrackId ?? null,
          family: filters.family ?? null,
          mediumId: filters.mediumId ?? null,
          subjectId: filters.subjectId ?? null,
        },
      ] as const,
    testDetail: (testId: string) => ["student", "tests", "detail", testId] as const,
    testAttempts: (filters: {
      limit?: number | null;
      status?: string | null;
      testId?: string | null;
    }) =>
      [
        "student",
        "tests",
        "attempts",
        {
          limit: filters.limit ?? null,
          status: filters.status ?? null,
          testId: filters.testId ?? null,
        },
      ] as const,
    testAttempt: (attemptId: string) =>
      ["student", "tests", "attempt", attemptId] as const,
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
    paymentOrder: (orderId: string) =>
      ["student", "payments", "order", orderId] as const,
  },
  publicPlans: () => ["public", "plans"] as const,
  publicPlan: (planId: string) => ["public", "plans", planId] as const,
  publicBootstrap: (siteCode?: string | null) =>
    ["public-bootstrap", siteCode ?? "default"] as const,
  cms: {
    resolve: () => ["cms", "public", "resolve"] as const,
    page: (slug: string) => ["cms", "public", "page", slug] as const,
  },
  admin: {
    dashboard: () => ["admin", "dashboard"] as const,
    permissions: () => ["admin", "permissions"] as const,
    roles: () => ["admin", "roles"] as const,
    assets: (filters: {
      accessLevel?: string | null;
      purpose?: string | null;
      status?: string | null;
    }) =>
      [
        "admin",
        "assets",
        {
          accessLevel: filters.accessLevel ?? null,
          purpose: filters.purpose ?? null,
          status: filters.status ?? null,
        },
      ] as const,
    cms: (collection: string, filters: {
      placement?: string | null;
      q?: string | null;
      status?: string | null;
      surface?: string | null;
      visibility?: string | null;
    }) =>
      [
        "admin",
        "cms",
        collection,
        {
          placement: filters.placement ?? null,
          q: filters.q ?? null,
          status: filters.status ?? null,
          surface: filters.surface ?? null,
          visibility: filters.visibility ?? null,
        },
      ] as const,
  },
} as const;
