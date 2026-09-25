"use client";

import { useState } from "react";
import { formatDateTime, guestName } from "@/lib/format";
import type { Property, Reservation, ReservationEdit } from "@/lib/types";
import { DetailRows, DetailRow } from "./DetailRows";
import { Drawer, Section } from "./Drawer";
import { Changes, EditPanel, FieldGroup } from "./EditPanel";
import { reservationColumns } from "./ReservationsTable";

const GROUPS = (hasGuest: boolean): FieldGroup[] => [
  {
    title: "Who is staying",
    note: "Fill in only what you are sure about.",
    fields: [
      { key: "numberOfAdults", label: "Adults", kind: "int", min: 0, max: 100, editedName: "numberOfAdults" },
      { key: "numberOfChildren", label: "Children", kind: "int", min: 0, max: 100, editedName: "numberOfChildren" },
      { key: "numberOfInfants", label: "Infants", kind: "int", min: 0, max: 100, editedName: "numberOfInfants" },
      { key: "numberOfPets", label: "Pets", kind: "int", min: 0, max: 100, editedName: "numberOfPets" },
    ],
  },
  {
    title: "Guest",
    note: hasGuest
      ? "Correct the guest's details."
      : "This booking has no guest yet, which is normal for bookings made in the iDoBooking panel. Adding details here creates the guest and links it to this booking.",
    fields: [
      { key: "guest.firstName", label: "First name", kind: "text", maxLength: 100 },
      { key: "guest.lastName", label: "Last name", kind: "text", maxLength: 100 },
      { key: "guest.email", label: "Email", kind: "email", maxLength: 200 },
      { key: "guest.phone", label: "Phone", kind: "phone" },
      { key: "guest.country", label: "Country", kind: "text", maxLength: 100 },
    ],
  },
];

const text = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function initialValues(r: Reservation): Record<string, string> {
  return {
    numberOfAdults: text(r.numberOfAdults),
    numberOfChildren: text(r.numberOfChildren),
    numberOfInfants: text(r.numberOfInfants),
    numberOfPets: text(r.numberOfPets),
    "guest.firstName": text(r.guest?.firstName),
    "guest.lastName": text(r.guest?.lastName),
    "guest.email": text(r.guest?.email),
    "guest.phone": text(r.guest?.phone),
    "guest.country": text(r.guest?.addressCountry),
  };
}

/** Turns the flat form values back into the shape the API expects. */
function toEdit(changes: Changes): ReservationEdit {
  const edit: ReservationEdit = {};
  const guest: NonNullable<ReservationEdit["guest"]> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (key.startsWith("guest.")) (guest as Record<string, string>)[key.slice(6)] = String(value);
    else (edit as Record<string, number>)[key] = Number(value);
  }
  if (Object.keys(guest).length > 0) edit.guest = guest;
  return edit;
}

interface ReservationDrawerProps {
  reservation: Reservation;
  properties: Property[];
  open: boolean;
  onClose: () => void;
  onSave: (id: string, edit: ReservationEdit) => Promise<{ reservation: Reservation } | { error: string }>;
}

export function ReservationDrawer({ reservation, properties, open, onClose, onSave }: ReservationDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(reservation);
  const titles = new Map(properties.map((p) => [p.id, p.title]));
  const edited = current.partnerEditedFields;

  const rows: DetailRow[] = [
    ...reservationColumns(titles).map((column) => ({
      label: column.header,
      value: column.cell(current),
      info: column.info,
    })),
    {
      label: "Adults / children",
      value: current.numberOfAdults === null ? "" : `${current.numberOfAdults} adults, ${current.numberOfChildren ?? 0} children`,
      edited: edited.includes("numberOfAdults") || edited.includes("numberOfChildren"),
      info: {
        what: "How many adults and children are staying.",
        from: "reservations/get: the sum over items[] of numberOfAdults and the big and small children counts.",
        stored: "reservations.number_of_adults and reservations.number_of_children",
      },
    },
    {
      label: "Infants / pets",
      value: current.numberOfInfants === null && current.numberOfPets === null ? "" : `${current.numberOfInfants ?? 0} infants, ${current.numberOfPets ?? 0} pets`,
      edited: edited.includes("numberOfInfants") || edited.includes("numberOfPets"),
      info: {
        what: "Infants and pets travelling with the guests.",
        from: "Not sent by iDoBooking. Can only be added here.",
        stored: "reservations.number_of_infants and reservations.number_of_pets",
      },
    },
    {
      label: "Total guests",
      value: current.guestsCount ?? "",
      info: {
        what: "Adults plus children.",
        from: "Worked out by GPC from the counts above.",
        stored: "reservations.guests_count",
      },
    },
    {
      label: "Party members",
      value: (current.partyGuests ?? []).map(guestName).filter(Boolean).join(", "),
      info: {
        what: "The other people staying, besides the booker (needs the guests:name permission to show).",
        from: "clients/get: the guests list inside the booker's client record.",
        stored: "guests, linked through reservation_guests",
      },
    },
    {
      label: "Last updated",
      value: formatDateTime(current.updatedAt),
      info: { what: "When GPC last changed this booking.", from: "GPC's own record.", stored: "reservations.updated_at" },
    },
  ];

  async function save(changes: Changes): Promise<string | null> {
    const result = await onSave(current.id, toEdit(changes));
    if ("error" in result) return result.error;
    setCurrent(result.reservation);
    setEditing(false);
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Reservation ${current.providerId}`}
      subtitle={<>{titles.get(current.propertyId) ?? ""}</>}
      actions={
        !editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Edit
          </button>
        )
      }
    >
      {editing ? (
        <EditPanel
          groups={GROUPS(!!current.guest)}
          initial={initialValues(current)}
          edited={edited}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <Section
            title="Details"
            note="Hover the i icons to see where each value comes from. Dates, status, money and the booked unit always come from iDoBooking and cannot be edited here."
          >
            <DetailRows rows={rows} />
          </Section>
        </>
      )}
    </Drawer>
  );
}
