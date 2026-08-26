"use client";
import type { Key, SortDescriptor } from "@heroui/react";
import { Chip, Pagination, Table } from "@heroui/react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  createColumnHelper,
  createCoreRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  flexRender,
  useTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

// 3. New in v9: declare which features this table uses (none yet)
const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns, // built-in sort functions
});

type DynamicRow = Record<string, unknown>;

const formatHeader = (i: any) => i;

// --- Sorting Bridge -------------------------------------------------------
// Convert TanStack SortingState → React Aria SortDescriptor
function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
  const first = sorting[0];

  if (!first) return undefined;

  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}

// Convert React Aria SortDescriptor → TanStack SortingState
function toSortingState(descriptor: SortDescriptor): SortingState {
  return [
    {
      desc: descriptor.direction === "descending",
      id: descriptor.column as string,
    },
  ];
}

const flattenDeep = (arr: any[]): any[] =>
  Array.isArray(arr)
    ? arr.reduce((a, b) => a.concat(flattenDeep(b)), [])
    : [arr];

const mapBtmItems = (arr: any[]) =>
  arr.map((i: any) =>
    i.items.map((ii: any) => ({ UID: i.UID, GUID: i.GUID, ...i.state, ...ii })),
  );

// --- Component ------------------------------------------------------------
const PAGE_SIZE = 4;

export function SFLTable({ data = [] }: { data: any[] }) {
  const flattenedData = flattenDeep(mapBtmItems(data));

  // dynamically obtain columns, if we have any data
  const columns: Array<ColumnDef<typeof features, DynamicRow>> =
    flattenedData.length
      ? flattenedData
          .reduce((prev: any[], curr: any, idx: number) => {
            for (const key of Object.keys(curr)) {
              if (!prev.includes(key)) {
                return [...prev, key];
              }
            }
            return prev;
          }, [])
          .map((key) => ({
            accessorKey: key,
            header: formatHeader(key), // e.g. 'firstName' -> 'First Name'
            cell: (info) => String(info.getValue() ?? ""), // values are unknown, so coerce for rendering
          }))
      : [];

  const [sorting, setSorting] = useState<SortingState>([]);

  const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);

  const sortedData = useMemo(() => {
    return [...flattenedData].sort((a, b) => {
      const col = sortDescriptor?.column as Key;
      const first = String(a[col]);
      const second = String(b[col]);
      let cmp = first.localeCompare(second);

      if (sortDescriptor?.direction === "descending") {
        cmp *= -1;
      }
      return cmp;
    });
  }, [sortDescriptor, flattenedData]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useTable({
    key: "person-table", // registers this table with the devtools
    features,
    columns,
    data: sortedData,
  });

  // const { pageIndex } = table.getState().pagination;
  // const pageCount = table.getPageCount();
  // const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  // const start = pageIndex * PAGE_SIZE + 1;
  // const end = Math.min((pageIndex + 1) * PAGE_SIZE, users.length);

  return (
    <Table className={"m-4 "}>
      <Table.ScrollContainer>
        <Table.Content
          aria-label="TanStack Table example"
          sortDescriptor={sortDescriptor}
          onSortChange={(d) => setSorting(toSortingState(d))}
        >
          <Table.Header>
            {table.getHeaderGroups()[0]!.headers.map((header) => (
              <Table.Column
                key={header.id}
                allowsSorting={header.column.getCanSort()}
                id={header.id}
                isRowHeader={header.id === "name"}
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
          <Table.Body>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id} id={row.id}>
                {row.getAllCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      <Table.Footer>
        {/* <Pagination size="sm">
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
        </Pagination> */}
      </Table.Footer>
    </Table>
  );
}
