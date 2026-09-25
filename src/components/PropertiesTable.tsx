import { squareFeetToSquareMetres } from "@/lib/format";
import type { Property } from "@/lib/types";
import { Badge } from "./Badge";
import { Column, DataTable } from "./DataTable";

const dash = <span className="text-zinc-400">not set</span>;

const ADDRESS_NOTE =
  "iDoBooking gives the address as one line of text, like \"Street 3/33, City\". GPC splits it into parts as best it can; a part it is unsure about stays empty and can be completed later.";

export const propertyColumns: Column<Property>[] = [
  {
    header: "Title",
    minWidth: "18rem",
    cell: (p) => <span className="font-medium">{p.title}</span>,
    info: {
      what: "The name of this bookable unit. One iDoBooking room type can have several units, and each unit is one property in GPC.",
      from: "objects/getAll: the object's name and the unit's name (items[].name), written as \"Object (unit)\". The same format the iDoBooking panel uses.",
      stored: "properties.title",
    },
  },
  {
    header: "Street",
    field: "street",
    minWidth: "11rem",
    cell: (p) => p.address.street ?? dash,
    info: {
      what: `The street name. ${ADDRESS_NOTE}`,
      from: "objects/getLocation: the address text of the object, split into parts.",
      stored: "properties.address_street (the original text is kept in address_full)",
    },
  },
  {
    header: "No.",
    field: "buildingNumber",
    cell: (p) => p.address.buildingNumber ?? dash,
    nowrap: true,
    info: {
      what: `The building number. ${ADDRESS_NOTE}`,
      from: "objects/getLocation: the number after the street, before any \"/\".",
      stored: "properties.address_building_number",
    },
  },
  {
    header: "Apt",
    field: "apartmentNumber",
    cell: (p) => p.address.apartmentNumber ?? dash,
    nowrap: true,
    info: {
      what: `The flat or apartment number, when the unit is inside a building. ${ADDRESS_NOTE}`,
      from: "objects/getLocation: the number after the \"/\" in the address text.",
      stored: "properties.address_apartment_number",
    },
  },
  {
    header: "City",
    field: "city",
    minWidth: "9rem",
    cell: (p) => p.address.city ?? dash,
    info: {
      what: `The city. ${ADDRESS_NOTE}`,
      from: "objects/getLocation: the part of the address text after the last comma.",
      stored: "properties.address_city",
    },
  },
  {
    header: "ZIP",
    field: "zipcode",
    cell: (p) => p.address.zipcode ?? dash,
    nowrap: true,
    info: {
      what: "The postal code. It is empty when the address text does not contain one, which is common: iDoBooking addresses usually have no postal code.",
      from: "objects/getLocation: only filled when the text contains a code like 00-001.",
      stored: "properties.address_zipcode",
    },
  },
  {
    header: "Sleeps",
    field: "accommodates",
    cell: (p) => p.accommodates ?? dash,
    align: "right",
    info: {
      what: "The most guests this unit can hold (its capacity).",
      from: "objects/getAll: the unit's capacity, or the object's capacity when the unit has none.",
      stored: "properties.accommodates",
    },
  },
  {
    header: "Bedrooms",
    field: "bedrooms",
    cell: (p) => p.bedrooms ?? dash,
    align: "right",
    info: {
      what: "How many bedrooms the unit has.",
      from: "objects/getAll: object.bedroomsCount (the same for every unit of one object).",
      stored: "properties.bedrooms",
    },
  },
  {
    header: "Area (m²)",
    field: "areaSquareMetres",
    cell: (p) => squareFeetToSquareMetres(p.areaSquareFeet) || dash,
    align: "right",
    info: {
      what: "The floor area. \"not set\" means iDoBooking sent 0, which means unknown, not a real size of zero.",
      from: "objects/getAll: object.area, in square metres.",
      stored: "properties.area_square_feet (GPC keeps square feet; this table converts it back to m²)",
    },
  },
  {
    header: "Listed",
    cell: (p) => <Badge tone={p.isListed && p.active ? "green" : "gray"}>{p.isListed && p.active ? "Yes" : "No"}</Badge>,
    info: {
      what: "Whether GPC treats the property as active and available to list.",
      from: "Not sent by iDoBooking. GPC marks every imported property as listed and active by default.",
      stored: "properties.is_listed and properties.active",
    },
  },
  {
    header: "iDoBooking ID",
    cell: (p) => p.providerId,
    nowrap: true,
    info: {
      what: "iDoBooking's own number for this unit. GPC uses it to recognise the same unit on the next sync, so it is updated instead of duplicated.",
      from: "objects/getAll: the unit id (items[].id), not the object id.",
      stored: "properties.provider_listing_id",
    },
  },
];

export function PropertiesTable({
  properties,
  onView,
}: {
  properties: Property[];
  onView: (property: Property) => void;
}) {
  const columns: Column<Property>[] = [
    {
      header: "Details",
      cell: (p) => (
        <button
          onClick={() => onView(p)}
          className="rounded-lg border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          View
        </button>
      ),
    },
    ...propertyColumns,
  ];
  return (
    <DataTable
      columns={columns}
      rows={properties}
      rowKey={(p) => p.id}
      caption="Properties"
      emptyMessage="No properties imported yet."
      searchText={(p) =>
        [p.title, p.address.street, p.address.city, p.address.full, p.providerId].filter(Boolean).join(" ")
      }
    />
  );
}
