export const apiRoutes = {
  auth: {
    signup: "/auth/signup",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    sessions: "/auth/sessions",
    forgotPassword: "/auth/password/forgot",
    resetPassword: "/auth/password/reset",
  },
  public: {
    bootstrap: "/public/bootstrap",
    catalog: "/public/catalog",
    plans: "/public/plans",
    plan: (planId: string) => `/public/plans/${encodeURIComponent(planId)}`,
  },
  entitlements: {
    me: "/entitlements/me",
  },
  payments: {
    checkout: "/payments/checkout",
    orderStatus: (orderId: string) =>
      `/payments/orders/${encodeURIComponent(orderId)}/status`,
  },
  catalog: {
    authenticated: "/catalog",
  },
  notes: {
    list: "/notes",
    tree: "/notes/tree",
    detail: (noteId: string) => `/notes/${encodeURIComponent(noteId)}`,
    viewSession: (noteId: string) =>
      `/notes/${encodeURIComponent(noteId)}/view-session`,
    progress: (noteId: string) =>
      `/notes/${encodeURIComponent(noteId)}/progress`,
    watermark: (noteViewSessionId: string) =>
      `/notes/view-sessions/${encodeURIComponent(noteViewSessionId)}/watermark`,
    content: (noteViewSessionId: string) =>
      `/notes/view-sessions/${encodeURIComponent(noteViewSessionId)}/content`,
  },
  practice: {
    sessions: "/practice/sessions",
    session: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}`,
    next: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}/next`,
    save: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}/save`,
    answer: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}/answer`,
    reveal: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}/reveal`,
    end: (sessionId: string) =>
      `/practice/sessions/${encodeURIComponent(sessionId)}/end`,
    progress: {
      subjects: "/practice/progress/subjects",
      topics: "/practice/progress/topics",
      weakQuestions: "/practice/progress/weak-questions",
      trends: "/practice/progress/trends",
    },
  },
  tests: {
    list: "/tests",
    detail: (testId: string) => `/tests/${encodeURIComponent(testId)}`,
    startAttempt: (testId: string) =>
      `/tests/${encodeURIComponent(testId)}/attempts`,
    attemptHistory: "/tests/attempts/history",
    attempt: (attemptId: string) =>
      `/tests/attempts/${encodeURIComponent(attemptId)}`,
    save: (attemptId: string) =>
      `/tests/attempts/${encodeURIComponent(attemptId)}/save`,
    submit: (attemptId: string) =>
      `/tests/attempts/${encodeURIComponent(attemptId)}/submit`,
  },
  content: {
    list: "/content",
    detail: (slug: string) => `/content/${encodeURIComponent(slug)}`,
    publicList: "/public/content",
    publicDetail: (slug: string) =>
      `/public/content/${encodeURIComponent(slug)}`,
  },
  cms: {
    resolve: "/cms/public/resolve",
    page: (slug: string) => `/cms/public/pages/${encodeURIComponent(slug)}`,
    studentResolve: "/cms/student/resolve",
    studentPage: (slug: string) =>
      `/cms/student/pages/${encodeURIComponent(slug)}`,
  },
  analytics: {
    meSummary: "/analytics/me/summary",
  },
  notifications: {
    me: "/notifications/me",
    read: (messageId: string) =>
      `/notifications/${encodeURIComponent(messageId)}/read`,
    readAll: "/notifications/read-all",
    preferences: "/notifications/preferences",
  },
} as const;
