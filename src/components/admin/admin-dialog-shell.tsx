"use client";

import { useEffect } from "react";

export function AdminDialogShell({
  actions,
  children,
  description,
  isOpen,
  onClose,
  title,
  widthClassName = "max-w-2xl",
}: Readonly<{
  actions?: React.ReactNode;
  children: React.ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  widthClassName?: string;
}>) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[rgba(0,30,64,0.42)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        aria-modal="true"
        role="dialog"
        className={[
          "tc-admin-frame relative z-10 w-full rounded-[28px] p-6 shadow-[0_24px_80px_rgba(0,30,64,0.16)]",
          widthClassName,
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Focused action
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="tc-muted mt-3 text-sm leading-7">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="tc-button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-6">{children}</div>

        {actions ? (
          <div className="tc-admin-toolbar mt-6 justify-end">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
