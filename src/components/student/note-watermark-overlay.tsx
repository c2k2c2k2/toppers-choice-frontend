"use client";

import type { NoteWatermarkResponse } from "@/lib/notes";

function buildWatermarkText(payload: NoteWatermarkResponse) {
  return [
    payload.displayName,
    payload.maskedEmail,
    payload.watermarkSeed.slice(0, 8),
  ]
    .filter(Boolean)
    .join(" • ");
}

export function NoteWatermarkOverlay({
  payload,
}: Readonly<{
  payload?: NoteWatermarkResponse | null;
}>) {
  if (!payload) {
    return null;
  }

  const watermarkText = buildWatermarkText(payload);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)]" />
      <div className="absolute inset-0 p-6 sm:p-8">
        <div className="grid h-full w-full content-evenly justify-items-center gap-10 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={`${payload.signature}-${index}`}
              className="max-w-full whitespace-nowrap text-center text-[9px] font-semibold tracking-[0.18em] text-black/18 [text-shadow:0_0_1px_rgba(255,255,255,0.95)] sm:text-[10px]"
              style={{
                transform: `rotate(${index % 2 === 0 ? -24 : -18}deg)`,
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
