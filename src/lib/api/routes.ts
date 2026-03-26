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
