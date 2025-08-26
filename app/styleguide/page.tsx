'use client';

import { useEffect, useRef, useState } from 'react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-serif">{title}</h2>
      <div className="rounded-2xl border-2 border-black/90 p-4 shadow-[6px_6px_0_rgba(0,0,0,0.2)] bg-[var(--paper,theme(colors.gray.100))]">
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
    <main className="p-6 md:p-10 space-y-10 bg-[var(--paper,theme(colors.gray.100))] text-[var(--ink,#111)]">
      <header className="rounded-3xl border-2 border-black/90 p-6 shadow-[6px_6px_0_rgba(0,0,0,0.2)] bg-white">
        <h1 className="text-4xl md:text-5xl font-serif">Styleguide</h1>
        <p className="mt-2 max-w-prose text-sm md:text-base italic">
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
          <h1 className="text-4xl font-serif">H1 — Serif Display</h1>
          <h3 className="text-xl font-serif italic">Subhead — Italic style</h3>
          <p className="max-w-prose leading-relaxed">
            Body copy uses a clean sans-serif with comfortable measure (~65ch). This paragraph is a placeholder to
            verify line-height (1.4–1.6), contrast, and readability in the monochrome theme.
          </p>
          <p className="font-mono text-sm">Mono sample — code/meta text</p>
        </div>
      </Section>

      {/* 3) Buttons */}
      <Section title="Buttons">
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white focus:outline-none focus:ring-4 ring-black/30">
            Primary
          </button>
          <button className="px-4 py-2 rounded-xl border-2 border-black text-black bg-transparent focus:outline-none focus:ring-4 ring-black/30">
            Secondary
          </button>
          <button
            className="px-4 py-2 rounded-xl border-2 border-black text-black/50 bg-gray-200 cursor-not-allowed"
            disabled
          >
            Disabled
          </button>
          <button
            className="px-4 py-2 rounded-xl border-2 border-black bg-black text-white relative"
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
          <span className="px-3 py-1 rounded-2xl border-2 border-black text-sm">Neutral</span>
          <span className="px-3 py-1 rounded-2xl border-2 border-black bg-black text-white text-sm">Active</span>
          <span className="px-3 py-1 rounded-2xl border-2 border-black/50 text-black/50 text-sm">Disabled</span>
        </div>
      </Section>

      {/* 5) Cards */}
      <Section title="Cards">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border-2 border-black/90 p-4">
            <h4 className="font-serif text-lg">Card Header</h4>
            <p className="text-sm mt-2">Simple card with border and rounded corners.</p>
          </div>
          <div className="rounded-2xl border-2 border-black/90 p-0">
            <div className="border-b-2 border-black/90 p-3 font-serif">Scrollable Card</div>
            <div className="max-h-32 overflow-auto p-3 space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <p key={i} className="text-sm">
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
            className="rounded-2xl border-2 border-black/90 p-2"
            aria-label="Demo sidebar"
          >
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="block rounded-xl border-2 border-black/90 px-3 py-2 font-medium"
                  aria-current="page"
                >
                  Active Item
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-xl border-2 border-black/50 px-3 py-2">
                  Normal Item
                </a>
              </li>
              <li>
                <a href="#" className="block rounded-xl border-2 border-black/50 px-3 py-2">
                  Hover Item (simulate by hovering)
                </a>
              </li>
            </ul>
          </nav>
          <div className="rounded-2xl border-2 border-black/90 p-4">
            <p className="text-sm">
              Content pane placeholder. On small screens, this would be full width; sidebar becomes collapsible.
            </p>
          </div>
        </div>
      </Section>

      {/* 7) Table */}
      <Section title="Table">
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full border-2 border-black/90 rounded-2xl overflow-hidden">
            <thead className="bg-[var(--gray,theme(colors.gray.300))]">
              <tr className="[&_th]:text-left [&_th]:px-3 [&_th]:py-2 [&_th]:font-serif">
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
              <tr className="odd:bg-white even:bg-[var(--paper,theme(colors.gray.100))]">
                <td>Row A</td>
                <td>1972-05-26</td>
                <td>12:34</td>
              </tr>
              <tr className="odd:bg-white even:bg-[var(--paper,theme(colors.gray.100))]">
                <td>Row B</td>
                <td>1977-05-08</td>
                <td>09:12</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 8) Collapse */}
      <Section title="Collapse">
        <div className="space-y-2">
          <button
            className="px-3 py-2 rounded-xl border-2 border-black bg-white focus:outline-none focus:ring-4 ring-black/30"
            aria-expanded={isOpen}
            aria-controls="demo-collapse"
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
          <div
            id="demo-collapse"
            hidden={!isOpen}
            className="rounded-xl border-2 border-black/80 p-3"
          >
            <p className="text-sm">Collapsible content block (accessible toggle).</p>
          </div>
        </div>
      </Section>

      {/* 9) Player (Docked) */}
      <Section title="Player (Docked)">
        <div className="relative min-h-40">
          <div className="fixed inset-x-4 bottom-6 rounded-2xl border-2 border-black/90 bg-white p-3 shadow-[6px_6px_0_rgba(0,0,0,0.2)] max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <button className="px-3 py-2 rounded-xl border-2 border-black bg-black text-white">⏮</button>
              <button className="px-3 py-2 rounded-xl border-2 border-black bg-black text-white">⏯</button>
              <button className="px-3 py-2 rounded-xl border-2 border-black bg-black text-white">⏭</button>
              <div className="flex-1 truncate px-2">
                <div className="text-sm font-medium">Track Title — Demo</div>
                <div className="h-2 mt-1 rounded bg-gray-200">
                  <div className="h-2 w-1/3 rounded bg-gray-500" />
                </div>
              </div>
              <div className="text-xs font-mono">01:23 / 04:56</div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Queue: Item 1, Item 2
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Placeholder content to show page scroll with a docked player.
          </p>
        </div>
      </Section>

      {/* 10) States */}
      <Section title="States">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border-2 border-black p-3">
            <div className="font-serif">Idle</div>
            <p className="text-sm">Neutral content.</p>
          </div>
          <div className="rounded-xl border-2 border-black p-3" aria-busy="true">
            <div className="font-serif">Loading</div>
            <p className="text-sm animate-pulse">•••</p>
          </div>
          <div className="rounded-xl border-2 border-black p-3">
            <div className="font-serif">Empty</div>
            <p className="text-sm italic">Nothing to show yet.</p>
          </div>
          <div className="rounded-xl border-2 border-red-700 p-3">
            <div className="font-serif text-red-800">Error</div>
            <button className="mt-2 px-3 py-1 rounded-lg border-2 border-black bg-white">Retry</button>
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
            className="rounded-xl border-2 border-black p-3"
          >
            <strong className="font-serif">Live region: </strong>
            <span>{liveMsg}</span>
          </div>
          <a href="#top" className="inline-block px-3 py-1 rounded-xl border-2 border-black focus:ring-4 ring-black/30">
            Skip to content (demo)
          </a>
        </div>
      </Section>

      <footer className="pt-2 text-xs text-gray-600">
        <p>
          This page is a visual QA surface for tokens & primitives. No real data is used.
        </p>
      </footer>
    </main>
  );
}
