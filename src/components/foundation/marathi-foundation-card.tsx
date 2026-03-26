import { MarathiText } from "@/components/primitives/marathi-text";

const sharedRules = [
  "Unicode Marathi uses the shared Devanagari-safe stack so landing, student, and admin content render consistently.",
  "Legacy encoded content can opt in explicitly with data attributes like data-marathi-font=\"shree-dev\" or data-marathi-font=\"surekh\".",
  "If old content arrives without explicit metadata, the shared helper falls back to the Dhurandhar-inspired glyph heuristics before rendering.",
] as const;

export function MarathiFoundationCard() {
  return (
    <section className="tc-panel rounded-[32px] p-6 md:p-7">
      <p className="tc-kicker" style={{ color: "var(--brand)" }}>
        Marathi foundation
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
        Unicode and legacy Marathi now share one rendering path.
      </h2>
      <p className="tc-muted mt-3 text-sm leading-6">
        F02 turns Marathi text handling into application infrastructure so later
        content modules do not have to rediscover font loading, class naming, or
        legacy detection rules.
      </p>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="tc-card rounded-[28px] p-5">
          <p className="tc-overline">Unicode Marathi</p>
          <MarathiText
            as="p"
            text="मराठी मजकूर, अभ्यास, चाचण्या आणि मार्गदर्शन आता एका सामायिक रेंडरिंग फाउंडेशनवर बसतात."
            className="mt-4 text-xl font-medium leading-9 text-[color:var(--brand)]"
          />
          <p className="tc-muted mt-4 text-sm leading-6">
            This path uses the shared Devanagari-safe fallback stack layered into
            the global typography tokens.
          </p>
        </article>

        <div className="grid gap-4">
          <article className="tc-card rounded-[28px] p-5">
            <p className="tc-overline">Shree-Dev / Shreelipi</p>
            <p className="mt-3 text-base font-semibold text-[color:var(--brand)]">
              Explicit hint path
            </p>
            <p className="tc-muted mt-2 text-sm leading-6">
              Use the shared helper or set an explicit font hint when old
              question-bank or CMS content is known to be Shree-Dev encoded.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tc-code-chip">
                {'data-marathi-font="shree-dev"'}
              </span>
              <span className="tc-code-chip">font-marathi-shree-dev</span>
            </div>
          </article>

          <article className="tc-card rounded-[28px] p-5">
            <p className="tc-overline">Surekh / Sulekha</p>
            <p className="mt-3 text-base font-semibold text-[color:var(--brand)]">
              Shared alternate legacy path
            </p>
            <p className="tc-muted mt-2 text-sm leading-6">
              Surekh-style content gets its own reusable classes and the same
              centralized detection path, ready for structured content modules.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tc-code-chip">
                {'data-marathi-font="surekh"'}
              </span>
              <span className="tc-code-chip">font-marathi-surekh</span>
            </div>
          </article>
        </div>
      </div>

      <div className="tc-glass mt-5 rounded-[24px] p-4">
        <p className="text-sm font-semibold text-[color:var(--brand)]">
          Finalized shared rules
        </p>
        <ul className="tc-muted mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
          {sharedRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
