import Link from "next/link";
import { MarathiText } from "@/components/primitives/marathi-text";
import { getPublicShellChrome } from "@/lib/public";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/tracks/mpsc-allied", label: "Tracks" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export async function PublicShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chrome = await getPublicShellChrome();

  return (
    <div className="min-h-dvh">
      <header className="tc-glass sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="min-w-0 space-y-1">
            <p className="tc-kicker">Topper&apos;s Choice</p>
            <p className="tc-display text-xl font-semibold tracking-tight text-[color:var(--brand)]">
              {chrome.branding.displayName}
            </p>
            <p className="tc-muted max-w-xs text-sm">{chrome.branding.tagline}</p>
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="tc-nav-chip"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <Link href={chrome.supportHref} className="tc-button-secondary">
              WhatsApp support
            </Link>
            <Link href="/student" className="tc-button-primary">
              Open student app
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
        <div className="w-full">{children}</div>
      </main>

      <footer className="mt-4 px-4 pb-6">
        <div className="tc-glass mx-auto grid w-full max-w-7xl gap-5 rounded-[30px] px-5 py-5 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:px-6">
          <div className="space-y-3">
            <p className="tc-overline">Academic atelier footer</p>
            <h2 className="tc-display text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
              {chrome.branding.displayName}
            </h2>
            <p className="tc-muted max-w-md text-sm leading-6">
              {chrome.branding.description}
            </p>
            <MarathiText
              as="p"
              text={chrome.branding.motto}
              className="text-sm font-medium text-[color:var(--brand)]"
            />
          </div>
          <div className="space-y-3">
            <p className="tc-overline">Public routes</p>
            <div className="flex flex-col gap-2 text-sm">
              {chrome.footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="tc-muted hover:text-[color:var(--brand)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="tc-overline">Support</p>
            <p className="text-sm font-semibold text-[color:var(--brand)]">
              WhatsApp {chrome.branding.supportWhatsapp}
            </p>
            <p className="tc-muted text-sm leading-6">
              {chrome.branding.supportNote}
            </p>
            <p className="tc-muted text-sm leading-6">{chrome.branding.address}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
