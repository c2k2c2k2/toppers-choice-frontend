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
    plans: "/public/plans",
    plan: (planId: string) => `/public/plans/${encodeURIComponent(planId)}`,
  },
  cms: {
    resolve: "/cms/public/resolve",
    page: (slug: string) => `/cms/public/pages/${encodeURIComponent(slug)}`,
  },
} as const;
