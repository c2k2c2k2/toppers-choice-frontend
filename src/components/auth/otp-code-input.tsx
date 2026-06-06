"use client";

import { useEffect, useRef } from "react";

const DEFAULT_OTP_LENGTH = 6;

export function OtpCodeInput({
  autoFocus = false,
  length = DEFAULT_OTP_LENGTH,
  onChange,
  value,
}: Readonly<{
  autoFocus?: boolean;
  length?: number;
  onChange: (value: string) => void;
  value: string;
}>) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (autoFocus) {
      window.setTimeout(() => focusInput(0), 80);
    }
  }, [autoFocus]);

  function focusInput(index: number) {
    const target = inputRefs.current[index];

    if (!target) {
      return;
    }

    target.focus();
    target.select();
  }

  function commitDigits(nextDigits: string[]) {
    onChange(nextDigits.join("").replace(/\s/g, ""));
  }

  function updateDigit(index: number, rawValue: string) {
    const nextValue = rawValue.replace(/\D/g, "");

    if (nextValue.length > 1) {
      const pastedDigits = value.padEnd(length, " ").slice(0, length).split("");
      nextValue
        .slice(0, length - index)
        .split("")
        .forEach((digit, offset) => {
          pastedDigits[index + offset] = digit;
        });
      commitDigits(pastedDigits);
      focusInput(Math.min(index + nextValue.length, length - 1));
      return;
    }

    const nextDigits = value.padEnd(length, " ").slice(0, length).split("");
    nextDigits[index] = nextValue || " ";
    commitDigits(nextDigits);

    if (nextValue && index < length - 1) {
      focusInput(index + 1);
    }
  }

  function handleBackspace(index: number) {
    const nextDigits = value.padEnd(length, " ").slice(0, length).split("");

    if (nextDigits[index]?.trim()) {
      nextDigits[index] = " ";
      commitDigits(nextDigits);
      focusInput(Math.max(0, index - 1));
      return;
    }

    if (index > 0) {
      nextDigits[index - 1] = " ";
      commitDigits(nextDigits);
      focusInput(index - 1);
    }
  }

  return (
    <div
      className="mt-4 grid grid-cols-6 gap-1.5 sm:gap-2"
      aria-label="Verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit.trim()}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              handleBackspace(index);
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            updateDigit(index, event.clipboardData.getData("text"));
          }}
          className="h-11 min-h-0 w-full min-w-0 rounded-[18px] border border-[rgba(0,30,64,0.1)] bg-white/86 px-0 text-center text-lg font-bold leading-none text-[color:var(--brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-[rgba(0,51,102,0.28)] focus:ring-4 focus:ring-[rgba(0,51,102,0.08)] sm:h-12 sm:rounded-[20px]"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
