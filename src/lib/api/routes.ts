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
  admin: {
    users: {
      students: "/admin/users/students",
      list: "/admin/users",
      admins: "/admin/users/admins",
      status: (userId: string) =>
        `/admin/users/${encodeURIComponent(userId)}/status`,
    },
    access: {
      permissions: "/admin/access/permissions",
      roles: "/admin/access/roles",
      role: (roleId: string) => `/admin/access/roles/${encodeURIComponent(roleId)}`,
      userAccess: (userId: string) =>
        `/admin/users/${encodeURIComponent(userId)}/access`,
    },
    audit: {
      logs: "/admin/audit-logs",
    },
    taxonomy: {
      examTracks: "/admin/taxonomy/exam-tracks",
      examTrack: (examTrackId: string) =>
        `/admin/taxonomy/exam-tracks/${encodeURIComponent(examTrackId)}`,
      reorderExamTracks: "/admin/taxonomy/exam-tracks/reorder",
      mediums: "/admin/taxonomy/mediums",
      medium: (mediumId: string) =>
        `/admin/taxonomy/mediums/${encodeURIComponent(mediumId)}`,
      reorderMediums: "/admin/taxonomy/mediums/reorder",
      subjects: "/admin/taxonomy/subjects",
      subject: (subjectId: string) =>
        `/admin/taxonomy/subjects/${encodeURIComponent(subjectId)}`,
      reorderSubjects: "/admin/taxonomy/subjects/reorder",
      topics: "/admin/taxonomy/topics",
      topic: (topicId: string) =>
        `/admin/taxonomy/topics/${encodeURIComponent(topicId)}`,
      reorderTopics: "/admin/taxonomy/topics/reorder",
      tags: "/admin/taxonomy/tags",
      tag: (tagId: string) => `/admin/taxonomy/tags/${encodeURIComponent(tagId)}`,
      reorderTags: "/admin/taxonomy/tags/reorder",
    },
    ops: {
      dashboard: "/admin/ops/dashboard",
      contentHealth: "/admin/ops/content-health",
      securitySignals: "/admin/ops/note-security-signals",
      exportUsers: "/admin/ops/export/users",
      exportSubscriptions: "/admin/ops/export/subscriptions",
      exportPayments: "/admin/ops/export/payments",
      revokeUserSessions: (userId: string) =>
        `/admin/ops/users/${encodeURIComponent(userId)}/revoke-sessions`,
      revokeNoteViewSession: (noteViewSessionId: string) =>
        `/admin/ops/note-view-sessions/${encodeURIComponent(noteViewSessionId)}/revoke`,
    },
    analytics: {
      overview: "/admin/analytics/overview",
    },
    search: {
      list: "/admin/search",
    },
    files: {
      list: "/admin/files",
      detail: (assetId: string) => `/admin/files/${encodeURIComponent(assetId)}`,
      initUpload: "/admin/files/init-upload",
      confirmUpload: (assetId: string) =>
        `/admin/files/${encodeURIComponent(assetId)}/confirm-upload`,
    },
    cms: {
      pages: "/admin/cms/pages",
      page: (pageId: string) => `/admin/cms/pages/${encodeURIComponent(pageId)}`,
      publishPage: (pageId: string) =>
        `/admin/cms/pages/${encodeURIComponent(pageId)}/publish`,
      unpublishPage: (pageId: string) =>
        `/admin/cms/pages/${encodeURIComponent(pageId)}/unpublish`,
      reorderPages: "/admin/cms/pages/reorder",
      banners: "/admin/cms/banners",
      banner: (bannerId: string) =>
        `/admin/cms/banners/${encodeURIComponent(bannerId)}`,
      publishBanner: (bannerId: string) =>
        `/admin/cms/banners/${encodeURIComponent(bannerId)}/publish`,
      unpublishBanner: (bannerId: string) =>
        `/admin/cms/banners/${encodeURIComponent(bannerId)}/unpublish`,
      reorderBanners: "/admin/cms/banners/reorder",
      announcements: "/admin/cms/announcements",
      announcement: (announcementId: string) =>
        `/admin/cms/announcements/${encodeURIComponent(announcementId)}`,
      publishAnnouncement: (announcementId: string) =>
        `/admin/cms/announcements/${encodeURIComponent(announcementId)}/publish`,
      unpublishAnnouncement: (announcementId: string) =>
        `/admin/cms/announcements/${encodeURIComponent(announcementId)}/unpublish`,
      reorderAnnouncements: "/admin/cms/announcements/reorder",
      sections: "/admin/cms/sections",
      section: (sectionId: string) =>
        `/admin/cms/sections/${encodeURIComponent(sectionId)}`,
      publishSection: (sectionId: string) =>
        `/admin/cms/sections/${encodeURIComponent(sectionId)}/publish`,
      unpublishSection: (sectionId: string) =>
        `/admin/cms/sections/${encodeURIComponent(sectionId)}/unpublish`,
      reorderSections: "/admin/cms/sections/reorder",
    },
    content: {
      list: "/admin/content",
      detail: (contentEntryId: string) =>
        `/admin/content/${encodeURIComponent(contentEntryId)}`,
      publish: (contentEntryId: string) =>
        `/admin/content/${encodeURIComponent(contentEntryId)}/publish`,
      unpublish: (contentEntryId: string) =>
        `/admin/content/${encodeURIComponent(contentEntryId)}/unpublish`,
      feature: (contentEntryId: string) =>
        `/admin/content/${encodeURIComponent(contentEntryId)}/feature`,
      unfeature: (contentEntryId: string) =>
        `/admin/content/${encodeURIComponent(contentEntryId)}/unfeature`,
      reorder: "/admin/content/reorder",
    },
    entitlements: {
      byUser: (userId: string) =>
        `/admin/users/${encodeURIComponent(userId)}/entitlements`,
      grant: "/admin/entitlements/grants",
      revoke: (entitlementId: string) =>
        `/admin/entitlements/${encodeURIComponent(entitlementId)}/revoke`,
    },
    plans: {
      list: "/admin/plans",
      detail: (planId: string) => `/admin/plans/${encodeURIComponent(planId)}`,
    },
    payments: {
      list: "/admin/payments/orders",
      detail: (orderId: string) =>
        `/admin/payments/orders/${encodeURIComponent(orderId)}`,
      reconcile: (orderId: string) =>
        `/admin/payments/orders/${encodeURIComponent(orderId)}/reconcile`,
    },
    notes: {
      list: "/admin/notes",
      detail: (noteId: string) => `/admin/notes/${encodeURIComponent(noteId)}`,
      publish: (noteId: string) =>
        `/admin/notes/${encodeURIComponent(noteId)}/publish`,
      unpublish: (noteId: string) =>
        `/admin/notes/${encodeURIComponent(noteId)}/unpublish`,
    },
    questions: {
      list: "/admin/questions",
      detail: (questionId: string) =>
        `/admin/questions/${encodeURIComponent(questionId)}`,
      publish: (questionId: string) =>
        `/admin/questions/${encodeURIComponent(questionId)}/publish`,
      unpublish: (questionId: string) =>
        `/admin/questions/${encodeURIComponent(questionId)}/unpublish`,
    },
    tests: {
      list: "/admin/tests",
      detail: (testId: string) => `/admin/tests/${encodeURIComponent(testId)}`,
      publish: (testId: string) =>
        `/admin/tests/${encodeURIComponent(testId)}/publish`,
      unpublish: (testId: string) =>
        `/admin/tests/${encodeURIComponent(testId)}/unpublish`,
    },
    notifications: {
      templates: "/admin/notifications/templates",
      template: (templateId: string) =>
        `/admin/notifications/templates/${encodeURIComponent(templateId)}`,
      broadcasts: "/admin/notifications/broadcasts",
      broadcast: (broadcastId: string) =>
        `/admin/notifications/broadcasts/${encodeURIComponent(broadcastId)}`,
      dispatch: (broadcastId: string) =>
        `/admin/notifications/broadcasts/${encodeURIComponent(broadcastId)}/dispatch`,
      cancel: (broadcastId: string) =>
        `/admin/notifications/broadcasts/${encodeURIComponent(broadcastId)}/cancel`,
      messages: "/admin/notifications/messages",
    },
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
