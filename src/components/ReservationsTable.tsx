import { formatDateTime, formatMoney, guestName } from "@/lib/format";
import type { Property, Reservation } from "@/lib/types";
import { Badge, statusTone } from "./Badge";
import { Column, DataTable } from "./DataTable";

export function reservationColumns(titles: Map<string, string>): Column<Reservation>[] {
  return [
    {
      header: "Ref",
      cell: (r) => r.providerId,
      nowrap: true,
      info: {
        what: "iDoBooking's own number for this booking. GPC uses it to recognise the same booking on the next sync.",
        from: "reservations/get: the reservation id.",
        stored: "reservations.provider_reservation_id",
      },
    },
    {
      header: "Property",
      minWidth: "16rem",
      cell: (r) => titles.get(r.propertyId) ?? "",
      info: {
        what: "The unit that was booked. If a booking covers several units, GPC attaches it to the first one and keeps the rest in the original data.",
        from: "reservations/get: items[].objectItemId, matched to the property with that unit id.",
        stored: "reservations.property_id (a link to the properties table)",
      },
    },
    {
      header: "Check-in",
      cell: (r) => formatDateTime(r.checkIn),
      nowrap: true,
      info: {
        what: "When the stay starts, shown in Warsaw time.",
        from: "reservations/get: reservationDetails.dateFrom. iDoBooking sends it without a time zone; the account runs on Warsaw time, so GPC converts it to UTC.",
        stored: "reservations.check_in (UTC)",
      },
    },
    {
      header: "Check-out",
      cell: (r) => formatDateTime(r.checkOut),
      nowrap: true,
      info: {
        what: "When the stay ends, shown in Warsaw time.",
        from: "reservations/get: reservationDetails.dateTo, converted from Warsaw time to UTC like check-in.",
        stored: "reservations.check_out (UTC)",
      },
    },
    {
      header: "Nights",
      cell: (r) => r.nights ?? "",
      align: "right",
      info: {
        what: "How many nights the stay lasts.",
        from: "Worked out by GPC: the number of calendar days between the check-in and check-out dates. iDoBooking does not send it.",
        stored: "reservations.nights_count",
      },
    },
    {
      header: "Status",
      cell: (r) => (
        <span title={`iDoBooking status: ${r.sourceStatus}`}>
          <Badge tone={statusTone(r.status)}>{r.status}</Badge>
        </span>
      ),
      info: {
        what: "Where the booking stands. iDoBooking has 11 statuses and GPC has 8, so GPC translates: accepted becomes CONFIRMED, completed becomes CLOSED, canceled or withdrawn become CANCELED. Hover a badge to see the original word.",
        from: "reservations/get: reservationDetails.status.",
        stored: "reservations.status (translated) and reservations.source_status (as sent)",
      },
    },
    {
      header: "Channel",
      minWidth: "8rem",
      cell: (r) => r.channel,
      info: {
        what: "Where the booking came from, for example the iDoBooking panel or a website. \"panel\" means it was entered by hand in the iDoBooking panel.",
        from: "reservations/get gives two numbers (reservationSourceTypeId and reservationSourceId); reservations/getSources says what they mean.",
        stored: "reservations.channel",
      },
    },
    {
      header: "Paid",
      cell: (r) => formatMoney(r.money.totalPaid, r.currency) || <span className="text-zinc-400">not set</span>,
      align: "right",
      nowrap: true,
      info: {
        what: "How much the guest has paid. Not filled yet: iDoBooking keeps payments in a separate module, and the login used for this test is not allowed to read it.",
        from: "payments/get (not permitted for this login).",
        stored: "reservations.total_paid (empty for now)",
      },
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
      info: {
        what: "How much the guest still owes for the stay.",
        from: "reservations/get: reservationDetails.balance. iDoBooking counts it as advance minus price, so -450 means the guest owes 450. GPC flips the sign.",
        stored: "reservations.balance_due",
      },
    },
    {
      header: "Guest",
      minWidth: "12rem",
      cell: (r) => guestName(r.guest) || <span className="text-zinc-400">no guest on this booking</span>,
      info: {
        what: "The person who booked. Empty when the booking was made in the iDoBooking panel without a customer, which is the case for the test reservations. Names are shown only to credentials with the guests:name permission.",
        from: "reservations/get gives a client id (0 means none); clients/get gives the person.",
        stored: "guests.first_name and guests.last_name, linked by reservations.guest_id",
      },
    },
    {
      header: "Contact",
      minWidth: "12rem",
      cell: (r) => r.guest?.email ?? "",
      info: {
        what: "The booker's email. Shown only to credentials with the guests:contact permission, and only when the booking has a guest.",
        from: "clients/get: the client's email.",
        stored: "guests.email",
      },
    },
    {
      header: "Party",
      cell: (r) => r.partyGuests?.length ?? 0,
      align: "right",
      info: {
        what: "How many other people are staying besides the booker.",
        from: "clients/get: the guests list inside the booker's client record.",
        stored: "guests, linked to the booking through reservation_guests",
      },
    },
  ];
}

export function ReservationsTable({
  reservations,
  properties,
  onView,
}: {
  reservations: Reservation[];
  properties: Property[];
  onView: (reservation: Reservation) => void;
}) {
  const titles = new Map(properties.map((p) => [p.id, p.title]));
  const columns: Column<Reservation>[] = [
    {
      header: "Details",
      cell: (r) => (
        <button
          onClick={() => onView(r)}
          className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          View
        </button>
      ),
    },
    ...reservationColumns(titles),
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
