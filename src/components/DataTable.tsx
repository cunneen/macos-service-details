/** biome-ignore-all lint/suspicious/noExplicitAny: This should be a generic table as far as possible */
"use client";
import Tray from "@gravity-ui/icons/Tray";
import { EmptyState, Table, TableLayout, Virtualizer } from "@heroui/react";
import type {
  ColumnDef,
  SortingState,
  TableFeatures,
} from "@tanstack/react-table";
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { useEffect, useMemo, useState } from "react";
import { getLoggerForCurrentRuntime } from "../util/log/getLoggerForCurrentRuntime";
import {
  type DynamicRow,
  formatHeader,
  getColumnWidths,
  sortDataByDescriptor,
  toSortDescriptor,
  toSortingState,
} from "../util/tanstackTableUtils";

const log = getLoggerForCurrentRuntime();

// declare which TanStack Table features this table uses
const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns, // built-in sort functions
});

// --- Props ------------------------------------------------------------
/**
 * Props for the {@link DataTable} component.
 */
export type DataTableProps = {
  /**
   * The rows to display. Each object's keys become the table's columns, and
   * every value is coerced to a string for rendering.
   */
  data: any[];
  /**
   * Optional configuration for the table.
   */
  options?: {
    /**
     * Overrides for the virtualized layout's sizing.
     */
    layoutOptions?: {
      /** Height (in px) of the header row. */
      headingHeight?: number;
      /** Height (in px) of each data row. */
      rowHeight?: number;
    };
    /** Accessible label for the table, used by screen readers. */
    ariaLabel?: string;
    /** CSS class name(s) applied to the table content. */
    className?: string;
  };
};

// --- Component ------------------------------------------------------------
// const PAGE_SIZE = 4;

/**
 * A generic, data-driven table that wraps TanStack Table and HeroUI's Table.
 *
 * Columns are derived automatically from the keys of the objects in `data`
 * (via {@link formatHeader}), and each column is sized to fit its content
 * using {@link getColumnWidths}. Rows are sorted client-side by the `UUID`
 * column by default, and the user can re-sort by clicking any sortable column
 * header.
 *
 * When `data` is empty, an {@link EmptyState} placeholder is rendered instead
 * of the table.
 *
 * @param props - The {@link DataTableProps} for the table.
 * @returns The rendered table, or an empty-state placeholder when there is no
 * data.
 */
export function DataTable(props: DataTableProps) {
  const { data, options = {} } = props;
  const [columns, setColumns] = useState<
    ColumnDef<TableFeatures, DynamicRow>[]
  >([]);

  // EFFECT --- recalculate column headers, if we need to.
  useEffect(() => {
    // dynamically obtain columns, if we have any data
    //   1. get a set of all keys
    //   2. return a "ColumnDef" for each key
    //   3. Add our custom column (username) "ColumnDef"
    const columnDefs: ColumnDef<TableFeatures, DynamicRow>[] = data.length
      ? data
          .reduce((prev: any[], curr: any) => {
            for (const key of Object.keys(curr)) {
              if (!prev.includes(key)) {
                prev.push(key);
                return prev;
              }
            }
            return prev;
          }, [])
          .map((key) => {
            const colDef: ColumnDef<TableFeatures, DynamicRow> = {
              accessorKey: key,
              header: formatHeader(key), // e.g. 'firstName' -> 'First Name'
              cell: (info) => String(info.getValue() ?? ""), // values are unknown, so coerce for rendering
              id: key,
            };
            return colDef;
          })
      : [];
    log.debug(`setting columnDefs to '${JSON.stringify(columnDefs)}'`);
    setColumns(columnDefs);
  }, [data]);

  // STATE --- sort column
  const [sorting, setSorting] = useState<SortingState>(
    toSortingState({ column: "UUID", direction: "ascending" }),
  );
  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);

  // MEMO --- memoize sorting the data by this descriptor
  const sortedData = useMemo(() => {
    return sortDataByDescriptor(data, sortDescriptor);
  }, [sortDescriptor, data]);

  // MEMO --- memoize column widths
  const columnWidths = useMemo(() => {
    return getColumnWidths(data, columns);
  }, [data, columns]);

  // TABLE --- TanStack Table config
  const table = useTable({
    key: "sfl-table",
    columns,
    features,
    data: sortedData,
  });

  useTanStackTableDevtools(table);

  // log.debug(`re-rendering table: data.length:${data.length}, flattenedData.length:${flattenedData.length}, sortedData.length:${sortedData.length}, sortDescriptor:'${JSON.stringify(sortDescriptor)}'`);

  // ---- <snip start> pagination ----
  // const { pageIndex } = table.getState().pagination;
  // const pageCount = table.getPageCount();
  // const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  // const start = pageIndex * PAGE_SIZE + 1;
  // const end = Math.min((pageIndex + 1) * PAGE_SIZE, users.length);
  // ---- <snip end> pagination ----

  // MEMO --- memoize table layout
  const layout = useMemo(() => {
    return new TableLayout({
      columnWidths: columnWidths,
    });
  }, [columnWidths]);

  log.debug(
    `columnWidths: ${JSON.stringify(Object.fromEntries(columnWidths.entries()), null, 2)}`,
  );

  // RENDER --- JSX
  return columnWidths.size > 0 ? (
    <Virtualizer
      layout={layout}
      layoutOptions={{
        columnWidths: columnWidths,
        ...(options?.layoutOptions ?? {}),
      }}
    >
      <Table>
        {/* <Table.ScrollContainer> */}
          <Table.Content
            aria-label={options?.ariaLabel ?? "Data Table"}
            className={options?.className ?? ""}
            sortDescriptor={sortDescriptor}
            onSortChange={(d) => setSorting(toSortingState(d))}
          >
            <Table.Header>
              {(table.getHeaderGroups()?.[0] ?? []).headers.map((header) => (
                <Table.Column
                  key={header.id}
                  allowsSorting={header.column.getCanSort()}
                  id={header.id}
                  isRowHeader={header.id === "name"}
                  defaultWidth={columnWidths.get(header.id)}
                >
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </Table.SortableColumnHeader>
                  )}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                  <Tray className="size-6 text-muted" />
                  <span className="text-sm text-muted">No results found</span>
                </EmptyState>
              )}
            >
              {table.getRowModel().rows.map((row) => (
                <Table.Row key={row.id} id={row.id}>
                  {row.getAllCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        {/* </Table.ScrollContainer> */}

        {/* ----- <snip start> pagination ----- */}
        {/* <Table.Footer>
        <Pagination size="sm">
          <Pagination.Summary>
            {start} to {end} of {users.length} results
          </Pagination.Summary>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={!table.getCanPreviousPage()}
                onPress={() => table.previousPage()}
              >
                <Pagination.PreviousIcon />
                Prev
              </Pagination.Previous>
            </Pagination.Item>
            {pages.map((p) => (
              <Pagination.Item key={p}>
                <Pagination.Link
                  isActive={p === pageIndex + 1}
                  onPress={() => table.setPageIndex(p - 1)}
                >
                  {p}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={!table.getCanNextPage()}
                onPress={() => table.nextPage()}
              >
                Next
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </Table.Footer> */}
        {/* ----- <snip end> pagination ----- */}
      </Table>
    </Virtualizer>
  ) : (
    <EmptyState className="flex items-center content-center flex-col flex-1 w-screen gap-4 text-center">
      <Tray className="size-6 text-muted" />
      <span className="text-sm text-muted">No results found</span>
    </EmptyState>
  );
}
