"use client";

import { useState } from "react";
import { formatDateTime, squareFeetToSquareMetres } from "@/lib/format";
import type { Property, PropertyEdit } from "@/lib/types";
import { DetailRows, DetailRow } from "./DetailRows";
import { Drawer, Section } from "./Drawer";
import { Changes, EditPanel, FieldGroup } from "./EditPanel";
import { propertyColumns } from "./PropertiesTable";

const GROUPS: FieldGroup[] = [
  {
    title: "Address",
    note: "iDoBooking gives the address as one line of text, so some parts may be missing. Fill in only what you are sure about.",
    fields: [
      { key: "street", label: "Street", kind: "text", maxLength: 200, editedName: "street" },
      { key: "buildingNumber", label: "Building number", kind: "text", maxLength: 50, editedName: "buildingNumber" },
      { key: "apartmentNumber", label: "Apartment", kind: "text", maxLength: 50, editedName: "apartmentNumber" },
      { key: "city", label: "City", kind: "text", maxLength: 120, editedName: "city" },
      { key: "state", label: "State or region", kind: "text", maxLength: 120, editedName: "state" },
      { key: "zipcode", label: "ZIP / postal code", kind: "text", maxLength: 20, hint: "For example 00-001.", editedName: "zipcode" },
      { key: "country", label: "Country", kind: "text", maxLength: 100, editedName: "country" },
    ],
  },
  {
    title: "Size and capacity",
    fields: [
      { key: "accommodates", label: "Sleeps (guests)", kind: "int", min: 1, max: 500, editedName: "accommodates" },
      { key: "bedrooms", label: "Bedrooms", kind: "int", min: 0, max: 100, editedName: "bedrooms" },
      { key: "bathrooms", label: "Bathrooms", kind: "decimal", min: 0, max: 100, editedName: "bathrooms" },
      { key: "areaSquareMetres", label: "Area (m²)", kind: "decimal", min: 1, max: 100000, editedName: "areaSquareMetres" },
    ],
  },
  {
    title: "Default times",
    fields: [
      { key: "defaultCheckInTime", label: "Check-in time", kind: "time", editedName: "defaultCheckInTime" },
      { key: "defaultCheckOutTime", label: "Check-out time", kind: "time", editedName: "defaultCheckOutTime" },
    ],
  },
];

const text = (value: string | number | null | undefined) => (value === null || value === undefined ? "" : String(value));

function initialValues(p: Property): Record<string, string> {
  return {
    street: text(p.address.street),
    buildingNumber: text(p.address.buildingNumber),
    apartmentNumber: text(p.address.apartmentNumber),
    city: text(p.address.city),
    state: text(p.address.state),
    zipcode: text(p.address.zipcode),
    country: text(p.address.country),
    accommodates: text(p.accommodates),
    bedrooms: text(p.bedrooms),
    bathrooms: text(p.bathrooms),
    areaSquareMetres: squareFeetToSquareMetres(p.areaSquareFeet),
    defaultCheckInTime: text(p.defaultCheckInTime),
    defaultCheckOutTime: text(p.defaultCheckOutTime),
  };
}

interface PropertyDrawerProps {
  property: Property;
  open: boolean;
  onClose: () => void;
  /** Sends the edit to GPC. Resolves to the saved property, or an error message. */
  onSave: (id: string, edit: PropertyEdit) => Promise<{ property: Property } | { error: string }>;
}

export function PropertyDrawer({ property, open, onClose, onSave }: PropertyDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(property);

  const edited = current.partnerEditedFields;

  const rows: DetailRow[] = [
    ...propertyColumns
      .filter((column) => column.header !== "Title")
      .map((column) => ({
        label: column.header,
        value: column.cell(current),
        info: column.info,
        edited: column.field ? edited.includes(column.field) : false,
      })),
    {
      label: "Bathrooms",
      value: current.bathrooms ?? "",
      edited: edited.includes("bathrooms"),
      info: {
        what: "How many bathrooms the unit has.",
        from: "Not sent by iDoBooking. Can only be added here.",
        stored: "properties.bathrooms",
      },
    },
    {
      label: "Check-in time",
      value: current.defaultCheckInTime ?? "",
      edited: edited.includes("defaultCheckInTime"),
      info: {
        what: "The usual time guests can arrive.",
        from: "Not sent by iDoBooking. Can only be added here.",
        stored: "properties.default_check_in_time",
      },
    },
    {
      label: "Check-out time",
      value: current.defaultCheckOutTime ?? "",
      edited: edited.includes("defaultCheckOutTime"),
      info: {
        what: "The usual time guests must leave.",
        from: "Not sent by iDoBooking. Can only be added here.",
        stored: "properties.default_check_out_time",
      },
    },
    {
      label: "State / country",
      value: [current.address.state, current.address.country].filter(Boolean).join(", "),
      edited: edited.includes("state") || edited.includes("country"),
      info: {
        what: "The region and country of the property.",
        from: "Not sent by iDoBooking. Can only be added here.",
        stored: "properties.address_state and properties.address_country",
      },
    },
    {
      label: "Last synced",
      value: formatDateTime(current.lastSyncedAt),
      info: {
        what: "When GPC last read this property from iDoBooking.",
        from: "GPC's own record of the last sync.",
        stored: "properties.last_synced_at",
      },
    },
  ];

  async function save(changes: Changes): Promise<string | null> {
    const result = await onSave(current.id, mapChanges(changes));
    if ("error" in result) return result.error;
    setCurrent(result.property);
    setEditing(false);
    return null;
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={current.title}
      subtitle={
        <>
          iDoBooking unit {current.providerId}
          {current.address.full ? ` · ${current.address.full}` : ""}
        </>
      }
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
          groups={GROUPS}
          initial={initialValues(current)}
          edited={edited}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <Section
            title="Details"
            note="Hover the i icons to see where each value comes from. Values marked “edited by you” are yours: iDoBooking updates will not overwrite them."
          >
            <DetailRows rows={rows} />
          </Section>
          <Section title="Amenities">
            {current.amenities.length === 0 ? (
              <p className="text-sm text-zinc-400">None sent by iDoBooking for this property.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {current.amenities.map((name) => (
                  <li key={name} className="rounded-full bg-zinc-100 px-3 py-1 text-xs dark:bg-zinc-800">
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </Drawer>
  );
}

function mapChanges(changes: Changes): PropertyEdit {
  return { ...changes } as PropertyEdit;
}
