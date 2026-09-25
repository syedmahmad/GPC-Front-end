import { squareFeetToSquareMetres } from "@/lib/format";
import type { Property } from "@/lib/types";
import { Badge } from "./Badge";
import { Column, DataTable } from "./DataTable";

const dash = <span className="text-zinc-400">not set</span>;

const columns: Column<Property>[] = [
  { header: "Title", cell: (p) => <span className="font-medium">{p.title}</span> },
  { header: "Street", cell: (p) => p.address.street ?? dash },
  { header: "No.", cell: (p) => p.address.buildingNumber ?? dash, nowrap: true },
  { header: "Apt", cell: (p) => p.address.apartmentNumber ?? dash, nowrap: true },
  { header: "City", cell: (p) => p.address.city ?? dash },
  { header: "ZIP", cell: (p) => p.address.zipcode ?? dash, nowrap: true },
  { header: "Sleeps", cell: (p) => p.accommodates ?? dash, align: "right" },
  { header: "Bedrooms", cell: (p) => p.bedrooms ?? dash, align: "right" },
  {
    header: "Area (m²)",
    cell: (p) => squareFeetToSquareMetres(p.areaSquareFeet) || dash,
    align: "right",
  },
  {
    header: "Listed",
    cell: (p) => <Badge tone={p.isListed && p.active ? "green" : "gray"}>{p.isListed && p.active ? "Yes" : "No"}</Badge>,
  },
  { header: "iDoBooking ID", cell: (p) => p.providerId, nowrap: true },
];

export function PropertiesTable({ properties }: { properties: Property[] }) {
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
