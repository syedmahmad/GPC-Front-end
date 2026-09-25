"use client";

import { useMemo, useState } from "react";

export interface Column<Row> {
  header: string;
  cell: (row: Row) => React.ReactNode;
  align?: "left" | "right";
  /** Keeps a long value on one line (dates, ids). */
  nowrap?: boolean;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Text a row can be found by; enables the search box. */
  searchText?: (row: Row) => string;
  emptyMessage: string;
  caption: string;
}

/** A plain, readable table: sticky header, zebra rows, optional search. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  searchText,
  emptyMessage,
  caption,
}: DataTableProps<Row>) {
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle || !searchText) return rows;
    return rows.filter((row) => searchText(row).toLowerCase().includes(needle));
  }, [rows, query, searchText]);

  return (
    <div>
      {searchText && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this table"
            aria-label={`Search ${caption}`}
            className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-xs text-zinc-500">
            {shown.length} of {rows.length}
          </span>
        </div>
      )}
      <div className="max-h-[32rem] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-max border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-zinc-500">
                  {rows.length === 0 ? emptyMessage : "Nothing matches your search."}
                </td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-zinc-200 odd:bg-white even:bg-zinc-50 dark:border-zinc-800 dark:odd:bg-zinc-900 dark:even:bg-zinc-900/50"
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={`px-3 py-2 align-top ${column.align === "right" ? "text-right tabular-nums" : ""} ${
                        column.nowrap ? "whitespace-nowrap" : ""
                      }`}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
