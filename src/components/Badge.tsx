type Tone = "green" | "amber" | "red" | "blue" | "gray";

const TONES: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  red: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  gray: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "CONNECTED":
    case "CONFIRMED":
    case "SUCCEEDED":
      return "green";
    case "FAILED":
    case "CANCELED":
      return "red";
    case "TIMEOUT":
    case "DISCONNECTED":
    case "PARTIAL":
    case "UNKNOWN":
      return "amber";
    case "RESERVED":
    case "INQUIRY":
    case "RUNNING":
      return "blue";
    default:
      return "gray";
  }
}
