"use client";

import { useEffect } from "react";
import {
  registerTopperChoiceServiceWorker,
  type BeforeInstallPromptEvent,
  type NavigatorWithStandalone,
} from "@/lib/pwa";
import { usePwaInstallStore } from "@/stores";

function isStandaloneDisplayMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

export function PwaProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const markInstalled = usePwaInstallStore((state) => state.markInstalled);
  const setDeferredPrompt = usePwaInstallStore(
    (state) => state.setDeferredPrompt,
  );
  const setInstallAvailability = usePwaInstallStore(
    (state) => state.setInstallAvailability,
  );
  const setServiceWorkerStatus = usePwaInstallStore(
    (state) => state.setServiceWorkerStatus,
  );

  useEffect(() => {
    let isActive = true;

    if (isStandaloneDisplayMode()) {
      markInstalled();
    } else {
      setInstallAvailability("unavailable");
    }

    if (!("serviceWorker" in navigator)) {
      setServiceWorkerStatus("unsupported");
    } else {
      setServiceWorkerStatus("checking");

      void registerTopperChoiceServiceWorker()
        .then(() => {
          if (!isActive) {
            return;
          }

          setServiceWorkerStatus("ready");
        })
        .catch(() => {
          if (!isActive) {
            return;
          }

          setServiceWorkerStatus("error");
        });
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;

      promptEvent.preventDefault();

      if (!isActive) {
        return;
      }

      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      if (!isActive) {
        return;
      }

      markInstalled();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      isActive = false;
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [
    markInstalled,
    setDeferredPrompt,
    setInstallAvailability,
    setServiceWorkerStatus,
  ]);

  return children;
}
