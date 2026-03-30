import Link from "next/link";
import { MarathiText } from "@/components/primitives/marathi-text";
import { getPublicShellChrome } from "@/lib/public";

const publicLinks = [
  { href: "/tracks/mpsc-allied", label: "Programs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Admissions" },
] as const;

export async function PublicShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chrome = await getPublicShellChrome();

  return (
    <div className="tc-public-shell min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3 md:px-5 md:pt-4">
        <div className="tc-public-topbar mx-auto flex w-full max-w-[120rem] flex-wrap items-center justify-between gap-4 rounded-[26px] px-4 py-4 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="tc-public-logo-mark">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7.5h16" />
                <path d="M6 7.5v9.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7.5" />
                <path d="M8.5 5.5h7" />
                <path d="M12 11v4.5" />
                <path d="M9.5 13.5H12h2.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="tc-display text-xl font-extrabold tracking-tight text-[color:var(--brand)] md:text-2xl">
                {chrome.branding.displayName}
              </p>
              <p className="tc-muted hidden text-sm md:block">
                {chrome.branding.tagline}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} className="tc-public-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/student/login" className="tc-button-secondary">
              Login
            </Link>
            <Link href="/pricing" className="tc-button-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[120rem] flex-1 px-3 pb-8 pt-4 md:px-5 md:pb-12 md:pt-6">
        <div className="w-full">{children}</div>
      </main>

      <footer className="tc-public-footer mt-10 px-3 pb-8 pt-16 md:px-5 md:pb-10 md:pt-20">
        <div className="relative z-10 mx-auto flex w-full max-w-[120rem] flex-col gap-12">
          <div className="grid gap-10 border-b border-white/8 pb-10 md:grid-cols-[1.25fr_0.8fr_0.8fr_0.8fr]">
            <div className="space-y-5">
              <p className="tc-overline text-white/48">Topper&apos;s Choice</p>
              <h2 className="tc-display text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {chrome.branding.displayName}
              </h2>
              <p className="max-w-md text-sm leading-7 text-white/68">
                {chrome.branding.description}
              </p>
              <MarathiText
                as="p"
                text={chrome.branding.motto}
                className="text-base font-semibold text-white"
              />
              <p className="text-sm italic text-[color:var(--accent-glow)]">
                {chrome.branding.tagline}
              </p>
            </div>

            <div className="space-y-4">
              <p className="tc-overline text-white/48">Quick Navigation</p>
              <div className="flex flex-col gap-3 text-sm">
                {chrome.footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="tc-public-footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="tc-overline text-white/48">Explore</p>
              <div className="flex flex-col gap-3 text-sm">
                <Link href="/tracks/mpsc-allied" className="tc-public-footer-link">
                  MPSC Programs
                </Link>
                <Link
                  href="/tracks/bank-staff-railway"
                  className="tc-public-footer-link"
                >
                  Banking Courses
                </Link>
                <Link href="/pricing" className="tc-public-footer-link">
                  Study Material
                </Link>
                <Link href="/student/login" className="tc-public-footer-link">
                  Mock Tests
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <p className="tc-overline text-white/48">Support</p>
              <Link
                href={chrome.supportHref}
                className="inline-flex w-fit items-center rounded-[1rem] bg-[#1f9d55] px-4 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                WhatsApp: {chrome.branding.supportWhatsapp}
              </Link>
              <p className="text-sm leading-7 text-white/68">
                {chrome.branding.supportNote}
              </p>
              <p className="text-sm leading-7 text-white/68">
                {chrome.branding.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/48 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 {chrome.branding.displayName}. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/5 text-white/68">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/5 text-white/68">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
