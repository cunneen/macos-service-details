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
import { getLoggerForCurrentRuntime } from "./util/getLoggerForCurrentRuntime";
import {
  type DynamicRow,
  formatHeader,
  getColumnWidths,
  sortDataByDescriptor,
  toSortDescriptor,
  toSortingState,
} from "./util/tanstackTableUtils";

const log = getLoggerForCurrentRuntime();

// declare which TanStack Table features this table uses
const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns, // built-in sort functions
});

// --- Component ------------------------------------------------------------
// const PAGE_SIZE = 4;

export function SFLTable({
  data = [],
  userGUIDs = {},
}: {
  data: any[];
  userGUIDs: { [k: string]: string };
}) {
  const [columns, setColumns] = useState<
    ColumnDef<TableFeatures, DynamicRow>[]
  >([]);
  const [guids, setGuids] = useState<{ [k: string]: string }>(userGUIDs);

  // EFFECT --- update guids if prop changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't want a circular dependency on guids
  useEffect(() => {
    if (JSON.stringify(userGUIDs) !== JSON.stringify(guids)) {
      setGuids(userGUIDs);
    }
  }, [userGUIDs]);

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
    // add "username" column
    log.debug("adding username column");
    columnDefs.splice(2, 0, {
      accessorKey: "username",
      header: formatHeader("username"),
      cell: (info) => guids[info.row.getValue("GUID") as string],
      id: "username",
    } as ColumnDef<TableFeatures, DynamicRow>);
    log.debug(`setting columnDefs to '${JSON.stringify(columnDefs)}'`);
    setColumns(columnDefs);
  }, [data.reduce, data.length, guids]);

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
        headingHeight: 56,
        rowHeight: 56,
        columnWidths: columnWidths,
      }}
    >
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="TanStack Table example"
            className="min-w-150"
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
        </Table.ScrollContainer>

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
    <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
      <Tray className="size-6 text-muted" />
      <span className="text-sm text-muted">No results found</span>
    </EmptyState>
  );
}
