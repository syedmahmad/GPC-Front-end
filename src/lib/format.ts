const WARSAW = "Europe/Warsaw";

/** iDoBooking accounts here run on Warsaw time, so dates are shown in it. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: WARSAW,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount === null || amount === undefined) return "";
  return `${amount.toFixed(2)} ${currency ?? ""}`.trim();
}

const SQFT_PER_SQM = 10.7639;

/** GPC stores area in square feet; the booking system's own unit is m². */
export function squareFeetToSquareMetres(sqft: number | null): string {
  if (sqft === null || sqft === undefined) return "";
  return (sqft / SQFT_PER_SQM).toFixed(0);
}

export function guestName(guest: { firstName?: string; lastName?: string } | undefined): string {
  if (!guest) return "";
  return [guest.firstName, guest.lastName].filter(Boolean).join(" ");
}

/** The API answers with a message, or a list of messages when several fields are wrong. */
export function errorText(body: { message?: string | string[] } | null | undefined): string {
  const message = body?.message;
  if (Array.isArray(message)) return message.join(". ");
  return message ?? "Something went wrong.";
}
