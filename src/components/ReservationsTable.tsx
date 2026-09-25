import { formatDateTime, formatMoney, guestName } from "@/lib/format";
import type { Property, Reservation } from "@/lib/types";
import { Badge, statusTone } from "./Badge";
import { Column, DataTable } from "./DataTable";

export function ReservationsTable({
  reservations,
  properties,
}: {
  reservations: Reservation[];
  properties: Property[];
}) {
  const titles = new Map(properties.map((p) => [p.id, p.title]));

  const columns: Column<Reservation>[] = [
    { header: "Ref", cell: (r) => r.providerId, nowrap: true },
    { header: "Property", cell: (r) => titles.get(r.propertyId) ?? "" },
    { header: "Check-in", cell: (r) => formatDateTime(r.checkIn), nowrap: true },
    { header: "Check-out", cell: (r) => formatDateTime(r.checkOut), nowrap: true },
    { header: "Nights", cell: (r) => r.nights ?? "", align: "right" },
    {
      header: "Status",
      cell: (r) => (
        <span title={`iDoBooking status: ${r.sourceStatus}`}>
          <Badge tone={statusTone(r.status)}>{r.status}</Badge>
        </span>
      ),
    },
    { header: "Channel", cell: (r) => r.channel },
    {
      header: "Paid",
      cell: (r) => formatMoney(r.money.totalPaid, r.currency) || <span className="text-zinc-400">not set</span>,
      align: "right",
      nowrap: true,
    },
    {
      header: "Balance due",
      cell: (r) => (
        <span className={r.money.balanceDue ? "font-semibold text-amber-700 dark:text-amber-400" : ""}>
          {formatMoney(r.money.balanceDue, r.currency)}
        </span>
      ),
      align: "right",
      nowrap: true,
    },
    {
      header: "Guest",
      cell: (r) =>
        guestName(r.guest) || <span className="text-zinc-400">no guest on this booking</span>,
    },
    { header: "Contact", cell: (r) => r.guest?.email ?? "" },
    { header: "Party", cell: (r) => r.partyGuests?.length ?? 0, align: "right" },
  ];

  return (
    <DataTable
      columns={columns}
      rows={reservations}
      rowKey={(r) => r.id}
      caption="Reservations"
      emptyMessage="No reservations imported yet."
      searchText={(r) =>
        [r.providerId, titles.get(r.propertyId), r.status, r.channel, guestName(r.guest), r.guest?.email]
          .filter(Boolean)
          .join(" ")
      }
    />
  );
}
