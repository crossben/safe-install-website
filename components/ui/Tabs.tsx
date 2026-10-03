'use client';

import { useId, useState } from 'react';

import { CopyButton } from './CopyButton';

export type TabPanel = {
  readonly label: string;
  readonly html: string;
  readonly code: string;
};

export type TabItem = {
  readonly id: string;
  readonly label: string;
  readonly panels: readonly TabPanel[];
};

/**
 * Keyboard-accessible tabs following the WAI-ARIA tabs pattern.
 *
 * Arrow keys move between tabs, Home/End jump to the ends. The highlighting in
 * `panels` was done at build time; this only controls which panel is visible.
 */
export function Tabs({ items }: { items: readonly TabItem[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  const focusTab = (index: number) => {
    setActive(index);
    document.getElementById(`${baseId}-tab-${index}`)?.focus();
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Install command by platform"
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {items.map((item, i) => (
          <button
            key={item.id}
            id={`${baseId}-tab-${i}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                focusTab((i + 1) % items.length);
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                focusTab((i - 1 + items.length) % items.length);
              } else if (event.key === 'Home') {
                event.preventDefault();
                focusTab(0);
              } else if (event.key === 'End') {
                event.preventDefault();
                focusTab(items.length - 1);
              }
            }}
            className={`-mb-px border-b-2 px-3.5 py-2 font-mono text-[13px] transition-colors ${
              i === active
                ? 'border-accent text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {items.map((item, i) => (
        <div
          key={item.id}
          id={`${baseId}-panel-${i}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          <div className="flex flex-col gap-3">
            {item.panels.map((panel) => (
              <div
                key={panel.label}
                className="group relative overflow-hidden rounded-lg border border-line bg-surface"
              >
                <div className="flex items-center justify-between border-b border-line bg-surface-2 px-3 py-1.5">
                  <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
                    {panel.label}
                  </span>
                  <CopyButton
                    text={panel.code}
                    className="border-transparent px-1.5 py-0.5 hover:border-line"
                  />
                </div>
                <div
                  className="code-scroll overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0"
                  dangerouslySetInnerHTML={{ __html: panel.html }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}