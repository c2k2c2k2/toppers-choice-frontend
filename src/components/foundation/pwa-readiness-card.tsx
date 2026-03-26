"use client";

import { useState } from "react";
import { usePwaInstallStore } from "@/stores";

type SurfaceType = "public" | "student" | "admin";

const installLabels = {
  checking: "Checking installability",
  available: "Ready to install",
  unavailable: "Prompt depends on browser support",
  installed: "Installed",
  unsupported: "Install prompt unavailable",
} as const;

const workerLabels = {
  checking: "Registering service worker",
  ready: "Static shell caching ready",
  error: "Registration needs attention",
  unsupported: "Service worker unsupported",
} as const;

const installButtonLabels: Record<SurfaceType, string> = {
  public: "Install foundation app",
  student: "Install student shell",
  admin: "Install shared shell",
};

export function PwaReadinessCard({
  surface,
}: Readonly<{
  surface: SurfaceType;
}>) {
  const [isPrompting, setIsPrompting] = useState(false);
  const installAvailability = usePwaInstallStore(
    (state) => state.installAvailability,
  );
  const lastPromptOutcome = usePwaInstallStore(
    (state) => state.lastPromptOutcome,
  );
  const promptInstall = usePwaInstallStore((state) => state.promptInstall);
  const serviceWorkerStatus = usePwaInstallStore(
    (state) => state.serviceWorkerStatus,
  );

  async function handleInstall() {
    setIsPrompting(true);
    await promptInstall();
    setIsPrompting(false);
  }

  return (
    <section className="tc-panel rounded-[32px] p-6 md:p-7">
      <p className="tc-kicker" style={{ color: "var(--brand)" }}>
        PWA baseline
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
        Installability without unsafe offline assumptions
      </h2>
      <p className="tc-muted mt-3 text-sm leading-6">
        The app now exposes a manifest, app icons, and service-worker
        registration, while keeping navigations, `/api`, and protected student
        or admin documents on the network path.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="tc-card rounded-[24px] p-4">
          <p className="tc-overline">Install state</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
            {installLabels[installAvailability]}
          </p>
          <p className="tc-muted mt-2 text-sm leading-6">
            Browser-driven install prompts can vary by platform, so this card
            reports capability rather than assuming universal support.
          </p>
        </div>
        <div className="tc-card rounded-[24px] p-4">
          <p className="tc-overline">Caching rule</p>
          <p className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
            {workerLabels[serviceWorkerStatus]}
          </p>
          <p className="tc-muted mt-2 text-sm leading-6">
            Cached: manifest, icons, bundled fonts, and `/_next/static`.
            Excluded: route documents, `/api`, and premium or permission-gated
            payloads.
          </p>
        </div>
      </div>

      <div className="tc-glass mt-5 flex flex-col gap-3 rounded-[24px] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[color:var(--brand)]">
            Current prompt outcome
          </p>
          <p className="tc-muted text-sm">
            {lastPromptOutcome
              ? `Last browser response: ${lastPromptOutcome}.`
              : "No install prompt interaction recorded yet."}
          </p>
        </div>
        {installAvailability === "available" ? (
          <button
            type="button"
            onClick={handleInstall}
            disabled={isPrompting}
            className="tc-button-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPrompting ? "Opening browser prompt..." : installButtonLabels[surface]}
          </button>
        ) : (
          <span className="tc-code-chip">scope: / | cache: static shell only</span>
        )}
      </div>
    </section>
  );
}
