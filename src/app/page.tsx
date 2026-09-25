import { ApiProvider } from "@/lib/api-log";
import { Dashboard } from "@/components/Dashboard";

export default function Home() {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-xl font-extrabold tracking-tight">
          Box<span className="text-blue-600">Buy</span>
        </span>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Demo screen, not the real BoxBuy
        </span>
      </header>
      <main className="flex-1">
        <ApiProvider>
          <Dashboard />
        </ApiProvider>
      </main>
    </>
  );
}
