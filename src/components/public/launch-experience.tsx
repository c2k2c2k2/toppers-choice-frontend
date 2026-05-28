"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/primitives/brand-logo";

const REDIRECT_DELAY_MS = 4200;
const FOUNDER_NAME = "Mrs. Madhuri Deulkar Allies M.D. Madam";

type LaunchState = "ready" | "countdown" | "launched";

export function LaunchExperience() {
  const router = useRouter();
  const [launchState, setLaunchState] = useState<LaunchState>("ready");
  const [countdown, setCountdown] = useState(3);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 72 }, (_, index) => ({
        id: index,
        delay: `${(index % 18) * 0.045}s`,
        drift: `${((index % 9) - 4) * 15}px`,
        left: `${(index * 37) % 100}%`,
        rotate: `${(index * 47) % 360}deg`,
      })),
    [],
  );

  useEffect(() => {
    if (launchState !== "countdown") {
      return;
    }

    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        setLaunchState("launched");
        return;
      }

      setCountdown((value) => value - 1);
    }, 760);

    return () => window.clearTimeout(timer);
  }, [countdown, launchState]);

  useEffect(() => {
    if (launchState !== "launched") {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push("/");
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [launchState, router]);

  function startLaunch() {
    if (launchState !== "ready") {
      return;
    }

    setCountdown(3);
    setLaunchState("countdown");
  }

  const hasLaunched = launchState === "launched";
  const isCountingDown = launchState === "countdown";

  return (
    <main className="tc-launch-page min-h-dvh overflow-hidden">
      <div className="tc-launch-aurora" />
      <div className="tc-launch-stage">
        {hasLaunched ? (
          <div className="tc-launch-confetti" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                style={
                  {
                    "--delay": piece.delay,
                    "--drift": piece.drift,
                    "--left": piece.left,
                    "--rotate": piece.rotate,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ) : null}

        <section className="tc-launch-card">
          <div className="tc-launch-brand">
            <span className="tc-launch-logo">
              <BrandMark alt="Toppers' Choice" priority sizes="72px" className="w-16" />
            </span>
            <span className="tc-launch-pill">Founder&apos;s Day Launch</span>
          </div>

          <div className="tc-launch-copy">
            <p className="tc-launch-kicker">Celebrating the beginning</p>
            <h1>Toppers&apos; Choice Begins Today</h1>
            <p className="tc-launch-description">
              A focused learning platform for students, launched with gratitude,
              ambition, and a promise to keep preparation simple.
            </p>
            <p className="tc-launch-founder">
              Founder&apos;s Day tribute to <strong>{FOUNDER_NAME}</strong>
            </p>
          </div>

          <div className="tc-launch-orbit" aria-hidden="true">
            <span data-ring="outer" />
            <span data-ring="middle" />
            <span data-ring="inner" />
            <strong>{isCountingDown ? countdown : hasLaunched ? "Live" : "Ready"}</strong>
          </div>

          <div className="tc-launch-actions">
            <button
              type="button"
              className="tc-launch-button"
              data-state={launchState}
              disabled={launchState !== "ready"}
              onClick={startLaunch}
            >
              {isCountingDown
                ? `Launching in ${countdown}`
                : hasLaunched
                  ? "Launched Successfully"
                  : "Launch Toppers' Choice"}
            </button>
            <Link href="/" className="tc-launch-home-link">
              Open homepage directly
            </Link>
          </div>

          <div className="tc-launch-message" data-visible={hasLaunched}>
            <p>Launched with gratitude on Founder&apos;s Day</p>
            <strong>{FOUNDER_NAME}</strong>
            <span>Redirecting to the homepage...</span>
          </div>
        </section>
      </div>
    </main>
  );
}
