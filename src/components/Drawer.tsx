"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  /** Buttons shown at the right of the header, e.g. Edit. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * A panel that slides in from the right. Built on Headless UI's Dialog, which
 * provides what is easy to get wrong by hand: focus is trapped inside, Escape
 * and a click on the backdrop close it, the page behind stops scrolling, and
 * screen readers announce it as a dialog.
 */
export function Drawer({ open, onClose, title, subtitle, actions, children, footer }: DrawerProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-40">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 flex justify-end">
          <DialogPanel
            transition
            className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition duration-200 ease-out data-closed:translate-x-full dark:bg-zinc-900"
          >
            <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-bold">{title}</DialogTitle>
                {subtitle && <div className="mt-1 text-sm text-zinc-500">{subtitle}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {actions}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-300 text-lg leading-none hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  ×
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                {footer}
              </footer>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

/** A titled group of details inside a drawer. */
export function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      {note && <p className="mt-1 text-xs text-zinc-500">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
