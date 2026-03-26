"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/auth";
import { usePwaInstallStore, useStudentShellStore } from "@/stores";

type SurfaceType = "public" | "student" | "admin";

const surfaceLabels: Record<SurfaceType, string> = {
  public: "Public foundation",
  student: "Student foundation",
  admin: "Admin foundation",
};

export function FoundationStatusCard({
  surface,
}: Readonly<{
  surface: SurfaceType;
}>) {
  const queryClient = useQueryClient();
  const authSession = useAuthSession();
  const isSidebarOpen = useStudentShellStore((state) => state.isSidebarOpen);
  const bottomNavVisible = useStudentShellStore(
    (state) => state.bottomNavVisible,
  );
  const activeExamTrackCode = useStudentShellStore(
    (state) => state.activeExamTrackCode,
  );
  const toggleSidebar = useStudentShellStore((state) => state.toggleSidebar);
  const installAvailability = usePwaInstallStore(
    (state) => state.installAvailability,
  );
  const serviceWorkerStatus = usePwaInstallStore(
    (state) => state.serviceWorkerStatus,
  );

  const defaultStaleTime =
    queryClient.getDefaultOptions().queries?.staleTime ?? 0;

  return (
    <section className="tc-card rounded-[28px] p-6">
      <p className="tc-kicker" style={{ color: "var(--brand)" }}>
        Provider stack
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
        Foundation readiness
      </h2>
      <p className="tc-muted mt-3 max-w-2xl text-sm leading-6">
        {surfaceLabels[surface]} is rendering through the shared root providers.
        This card reads TanStack Query, auth session context, PWA readiness, and
        the starter Zustand store from the live app tree.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="tc-panel rounded-2xl p-4">
          <p className="tc-kicker" style={{ color: "var(--muted)" }}>
            Query client
          </p>
          <p className="mt-2 text-lg font-semibold">Connected</p>
          <p className="tc-muted mt-1 text-sm">
            Default stale time: {Math.round(Number(defaultStaleTime) / 1000)}s
          </p>
        </div>
        <div className="tc-panel rounded-2xl p-4">
          <p className="tc-kicker" style={{ color: "var(--muted)" }}>
            Auth provider
          </p>
          <p className="mt-2 text-lg font-semibold">{authSession.status}</p>
          <p className="tc-muted mt-1 text-sm">
            {authSession.isReady
              ? "Session bootstrap, route guards, and logout flow are active."
              : "Restoring the persisted session before protected routes render."}
          </p>
        </div>
        <div className="tc-panel rounded-2xl p-4">
          <p className="tc-kicker" style={{ color: "var(--muted)" }}>
            PWA provider
          </p>
          <p className="mt-2 text-lg font-semibold">{serviceWorkerStatus}</p>
          <p className="tc-muted mt-1 text-sm">
            Install state: {installAvailability}
          </p>
        </div>
        <div className="tc-panel rounded-2xl p-4">
          <p className="tc-kicker" style={{ color: "var(--muted)" }}>
            Zustand starter
          </p>
          <p className="mt-2 text-lg font-semibold">
            {isSidebarOpen ? "Sidebar open" : "Sidebar closed"}
          </p>
          <p className="tc-muted mt-1 text-sm">
            Bottom nav {bottomNavVisible ? "visible" : "hidden"}
          </p>
        </div>
      </div>

      <div className="tc-panel mt-5 flex flex-col gap-3 rounded-2xl p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">Starter store snapshot</p>
          <p className="tc-muted text-sm">
            Active exam track: {activeExamTrackCode ?? "not selected yet"}
          </p>
        </div>
        {surface === "student" ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="tc-button-primary"
          >
            Toggle starter store value
          </button>
        ) : (
          <p className="tc-muted text-sm">
            The same shared store is mounted for future student routes.
          </p>
        )}
      </div>
    </section>
  );
}
