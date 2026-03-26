import { create } from "zustand"
import type { BeforeInstallPromptEvent } from "@/lib/pwa"

export type PwaInstallAvailability =
  | "checking"
  | "available"
  | "unavailable"
  | "installed"
  | "unsupported"

export type PwaServiceWorkerStatus =
  | "checking"
  | "ready"
  | "error"
  | "unsupported"

interface PwaInstallSlice {
  deferredPrompt: BeforeInstallPromptEvent | null
  installAvailability: PwaInstallAvailability
  lastPromptOutcome: "accepted" | "dismissed" | null
  serviceWorkerStatus: PwaServiceWorkerStatus
}

interface PwaInstallActions {
  markInstalled: () => void
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void
  setInstallAvailability: (availability: PwaInstallAvailability) => void
  setServiceWorkerStatus: (status: PwaServiceWorkerStatus) => void
}

export type PwaInstallStore = PwaInstallSlice & PwaInstallActions

export const usePwaInstallStore = create<PwaInstallStore>()((set, get) => ({
  deferredPrompt: null,
  installAvailability: "checking",
  lastPromptOutcome: null,
  serviceWorkerStatus: "checking",
  markInstalled: () =>
    set({
      deferredPrompt: null,
      installAvailability: "installed",
      lastPromptOutcome: "accepted",
    }),
  promptInstall: async () => {
    const promptEvent = get().deferredPrompt

    if (!promptEvent) {
      return "unavailable"
    }

    await promptEvent.prompt()
    const choice = await promptEvent.userChoice

    if (choice.outcome === "accepted") {
      set({
        deferredPrompt: null,
        installAvailability: "installed",
        lastPromptOutcome: "accepted",
      })

      return "accepted"
    }

    set({
      deferredPrompt: null,
      installAvailability: "unavailable",
      lastPromptOutcome: "dismissed",
    })

    return "dismissed"
  },
  setDeferredPrompt: (event) =>
    set({
      deferredPrompt: event,
      installAvailability: event ? "available" : "unavailable",
    }),
  setInstallAvailability: (installAvailability) =>
    set({
      installAvailability,
    }),
  setServiceWorkerStatus: (serviceWorkerStatus) =>
    set({
      serviceWorkerStatus,
    }),
}))
