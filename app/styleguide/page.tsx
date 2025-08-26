'use client';

import { useEffect, useRef, useState } from 'react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-display">{title}</h2>
      <div className="rounded-[var(--radius-xl)] border-[var(--border-w)] border-[var(--color-ink)] p-4 shadow-[6px_6px_0_rgba(0,0,0,0.2)] bg-[var(--color-paper)]">
        {children}
      </div>
    </section>
  );
}

function TokenSwatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 rounded-lg border-2 border-black/80"
        style={{ backgroundColor: `var(${varName})` }}
        aria-label={`${name} swatch`}
      />
      <code className="text-sm font-mono">{name} — {varName}</code>
    </div>
  );
}

export default function StyleguidePage() {
  // Collapse demo
  const [isOpen, setIsOpen] = useState(true);

  // Live region demo
  const [liveMsg, setLiveMsg] = useState('Idle…');
  const liveRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setLiveMsg('Async data loaded'), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="p-6 md:p-10 space-y-10 bg-[var(--color-paper)] text-[var(--color-ink)]">
      <header className="rounded-[var(--radius-xl)] border-[var(--border-w)] border-[var(--color-ink)] p-6 shadow-[6px_6px_0_rgba(0,0,0,0.2)] bg-white">
        <h1 className="text-4xl md:text-5xl font-display">Styleguide</h1>
        <p className="mt-2 max-w-prose text-sm md:text-base italic font-body">
          Visual tokens, typography, and generic components for the retro/monochrome design language.
        </p>
      </header>

      {/* 1) Colors & Tokens */}
      <Section title="Colors & Tokens">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <TokenSwatch name="Ink" varName="--ink" />
          <TokenSwatch name="Paper" varName="--paper" />
          <TokenSwatch name="Gray" varName="--gray" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-sm font-mono">2px Border + Offset Shadow</div>
            <div className="h-20 rounded-2xl border-2 border-black/90 shadow-[6px_6px_0_rgba(0,0,0,0.2)] bg-white" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-mono">Radius Samples (12px / 24px)</div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-20 rounded-[12px] border-2 border-black/80" />
              <div className="h-10 w-20 rounded-[24px] border-2 border-black/80" />
            </div>
          </div>
        </div>
      </Section>

      {/* 2) Typography */}
      <Section title="Typography">
        <div className="space-y-4">
          <h1 className="text-4xl font-display">H1 — Serif Display (Playfair Display)</h1>
          <h3 className="text-xl font-display italic">Subhead — Italic style</h3>
          <p className="max-w-prose leading-relaxed font-body">
            Body copy uses a clean sans-serif (Inter) with comfortable measure (~65ch). This paragraph is a placeholder to
            verify line-height (1.4–1.6), contrast, and readability in the monochrome theme.
          </p>
          <p className="font-meta text-sm">Mono sample — code/meta text (IBM Plex Mono)</p>
        </div>
      </Section>

      {/* 3) Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white focus:outline-none focus:ring-4 ring-[var(--color-ink)]/30 hover:bg-[var(--color-ink)]/90 transition-colors">
            Primary
          </button>
          <button className="px-4 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent focus:outline-none focus:ring-4 ring-[var(--color-ink)]/30 hover:bg-[var(--color-ink)] hover:text-white transition-colors">
            Secondary
          </button>
          <button
            className="px-4 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-gray)] text-[var(--color-gray)] bg-[var(--color-gray)]/20 cursor-not-allowed"
            disabled
          >
            Disabled
          </button>
          <button
            className="px-4 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white relative"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="opacity-70">Loading</span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">•••</span>
          </button>
        </div>
      </Section>

      {/* 4) Pills */}
      <Section title="Pills">
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] text-sm">Neutral</span>
          <span className="px-3 py-1 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white text-sm">Active</span>
          <span className="px-3 py-1 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-gray)] text-[var(--color-gray)] text-sm">Disabled</span>
        </div>
      </Section>

      {/* 4.5) Halftone Background Utility */}
      <Section title="Halftone Background Utility">
        <div className="relative p-8 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-white">
          <div className="bg-halftone absolute inset-0 rounded-[var(--radius-md)]" />
          <div className="relative z-10">
            <h3 className="font-display text-lg mb-2">Halftone Background Demo</h3>
            <p className="text-sm">This demonstrates the optional halftone/grain background utility class with low opacity.</p>
            <p className="text-sm mt-2">The pattern is pure CSS and creates a subtle retro texture.</p>
          </div>
        </div>
      </Section>

      {/* 5) Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-4">
            <h4 className="font-display text-lg">Card Header</h4>
            <p className="text-sm mt-2 font-body">Simple card with border and rounded corners.</p>
          </div>
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-0">
            <div className="border-b-[var(--border-w)] border-[var(--color-ink)] p-3 font-display">Scrollable Card</div>
            <div className="max-h-32 overflow-auto p-3 space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <p key={i} className="text-sm font-body">
                  Scroll line {i + 1}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 6) Sidebar & NavItem */}
      <Section title="Sidebar & NavItem">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
          <nav
            className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-2"
            aria-label="Demo sidebar"
          >
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="block rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] px-3 py-2 font-medium hover:bg-[var(--color-ink)] hover:text-white transition-colors"
                  aria-current="page"
                >
                  Active Item
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-gray)] px-3 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-colors">
                  Normal Item
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-gray)] px-3 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-colors">
                  Hover Item (hover to see effect)
                </a>
              </li>
            </ul>
          </nav>
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-4">
            <p className="text-sm font-body">
              Content pane placeholder. On small screens, this would be full width; sidebar becomes collapsible.
            </p>
          </div>
        </div>
      </Section>

      {/* 7) Table */}
      <Section title="Table">
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full border-[var(--border-w)] border-[var(--color-ink)] rounded-[var(--radius-md)] overflow-hidden">
            <thead className="bg-[var(--color-gray)]">
              <tr className="[&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:font-display">
                <th scope="col">
                  Name <span aria-hidden>↕</span>
                </th>
                <th scope="col">
                  Date <span aria-hidden>↕</span>
                </th>
                <th scope="col">
                  Duration <span aria-hidden>↕</span>
                </th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-3 [&_td]:py-2">
              <tr className="odd:bg-white even:bg-[var(--color-paper)]">
                <td className="font-body">Row A</td>
                <td className="font-body">1972-05-26</td>
                <td className="font-meta">12:34</td>
              </tr>
              <tr className="odd:bg-white even:bg-[var(--color-paper)]">
                <td className="font-body">Row B</td>
                <td className="font-body">1977-05-08</td>
                <td className="font-meta">09:12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 8) Collapse */}
      <Section title="Collapse">
        <div className="space-y-2">
          <button
            className="px-3 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-white focus:outline-none focus:ring-4 ring-[var(--color-ink)]/30"
            aria-expanded={isOpen}
            aria-controls="demo-collapse"
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
          <div
            id="demo-collapse"
            hidden={!isOpen}
            className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-3"
          >
            <p className="text-sm font-body">Collapsible content block (accessible toggle).</p>
          </div>
        </div>
      </Section>

      {/* 9) Player (Docked) */}
      <Section title="Player (Docked)">
        <div className="relative min-h-40">
          <div className="fixed inset-x-4 bottom-6 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-white p-3 shadow-[6px_6px_0_rgba(0,0,0,0.2)] max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white">⏮</button>
              <button className="px-3 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white">⏯</button>
              <button className="px-3 py-2 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-[var(--color-ink)] text-white">⏭</button>
              <div className="flex-1 truncate px-2">
                <div className="text-sm font-medium font-body">Track Title — Demo</div>
                <div className="h-2 mt-1 rounded bg-[var(--color-gray)]">
                  <div className="h-2 w-1/3 rounded bg-[var(--color-ink)]" />
                </div>
              </div>
              <div className="text-xs font-meta">01:23 / 04:56</div>
            </div>
            <div className="mt-2 text-xs text-[var(--color-gray)]">
              Queue: Item 1, Item 2
            </div>
          </div>
          <p className="text-sm text-[var(--color-gray)] font-body">
            Placeholder content to show page scroll with a docked player.
          </p>
        </div>
      </Section>

      {/* 10) States */}
      <Section title="States">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-3">
            <div className="font-display">Idle</div>
            <p className="text-sm font-body">Neutral content.</p>
          </div>
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-3" aria-busy="true">
            <div className="font-display">Loading</div>
            <p className="text-sm animate-pulse font-body">•••</p>
          </div>
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-3">
            <div className="font-display">Empty</div>
            <p className="text-sm italic font-body">Nothing to show yet.</p>
          </div>
          <div className="rounded-[var(--radius-md)] border-[var(--border-w)] border-red-700 p-3">
            <div className="font-display text-red-800">Error</div>
            <button className="mt-2 px-3 py-1 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] bg-white">Retry</button>
          </div>
        </div>
      </Section>

      {/* 11) Accessibility Demos */}
      <Section title="Accessibility Demos">
        <div className="space-y-3">
          <div
            ref={liveRef}
            role="status"
            aria-live="polite"
            className="rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] p-3"
          >
            <strong className="font-display">Live region: </strong>
            <span className="font-body">{liveMsg}</span>
          </div>
          <a href="#top" className="inline-block px-3 py-1 rounded-[var(--radius-md)] border-[var(--border-w)] border-[var(--color-ink)] focus:ring-4 ring-[var(--color-ink)]/30">
            Skip to content (demo)
          </a>
        </div>
      </Section>

      <footer className="pt-2 text-xs text-[var(--color-gray)]">
        <p className="font-body">
          This page is a visual QA surface for tokens & primitives. No real data is used.
        </p>
      </footer>
    </main>
  );
}
