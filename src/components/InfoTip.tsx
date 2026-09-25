"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export interface Info {
  /** What this value means, in plain words. */
  what: string;
  /** Where it comes from in iDoBooking. */
  from: string;
  /** Where GPC keeps it. */
  stored: string;
}

const WIDTH = 320;

/**
 * A small "i" icon. Hover or focus it to see what a value means and where it
 * comes from. The tip is drawn on top of the page (not inside the table), so a
 * scrolling table can never clip it.
 */
export function InfoTip({ info, label }: { info: Info; label: string }) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  function show(target: HTMLElement) {
    const box = target.getBoundingClientRect();
    const left = Math.min(Math.max(8, box.left + box.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - 8);
    setPosition({ left, top: box.bottom + 8 });
  }

  return (
    <>
      <button
        type="button"
        aria-label={`About ${label}`}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setPosition(null)}
        onKeyDown={(event) => event.key === "Escape" && setPosition(null)}
        className="inline-grid h-4 w-4 shrink-0 cursor-help place-items-center rounded-full border border-zinc-400 text-[10px] font-bold normal-case leading-none text-zinc-500 hover:border-blue-600 hover:text-blue-600 dark:border-zinc-500"
      >
        i
      </button>
      {position &&
        createPortal(
          <div
            role="tooltip"
            style={{ left: position.left, top: position.top, width: WIDTH }}
            className="pointer-events-none fixed z-50 rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs normal-case leading-relaxed tracking-normal text-zinc-700 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
            <p className="mb-2">{info.what}</p>
            <p>
              <span className="font-semibold text-blue-700 dark:text-blue-400">From iDoBooking: </span>
              {info.from}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Stored in GPC: </span>
              {info.stored}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
