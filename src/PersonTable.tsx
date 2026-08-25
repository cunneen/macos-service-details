import type { ColumnDef } from "@tanstack/preact-table";
import {
  createSortedRowModel,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/preact-table";

// 1. Define the shape of your data
type Person = {
  firstName: string;
  lastName: string;
  age: number;
};

// // 2. Give your data a stable reference (module scope, useState, a query cache, etc.)
// const data: Array<Person> = [
//   { firstName: "tanner", lastName: "linsley", age: 24 },
//   { firstName: "tandy", lastName: "miller", age: 40 },
//   { firstName: "joe", lastName: "dirte", age: 45 },
// ];

// 3. New in v9: declare which features this table uses (none yet)
const features = tableFeatures({
  rowSortingFeature, // enables sorting APIs and state
  sortedRowModel: createSortedRowModel(), // client-side sorting
  sortFns, // built-in sort functions
});

// 4. Define your columns
// const columns: Array<ColumnDef<typeof features, Person>> = [
//   {
//     accessorKey: "firstName", // accessorKey shorthand
//     header: "First Name",
//     cell: (info) => info.getValue(),
//   },
//   {
//     accessorFn: (row) => row.lastName, // accessorFn alternative with a custom id
//     id: "lastName",
//     header: () => <span>Last Name</span>,
//     cell: (info) => <i>{info.getValue<string>()}</i>,
//   },
//   {
//     accessorKey: "age",
//     header: () => "Age",
//   },
// ];
type DynamicRow = Record<string, unknown>

const formatHeader = (i:any) => i;



export function PersonTable({data = []}: {data: any[]}) {
const columns: Array<ColumnDef<typeof features, DynamicRow>> = data.length
  ? Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: formatHeader(key), // e.g. 'firstName' -> 'First Name'
      cell: (info) => String(info.getValue() ?? ''), // values are unknown, so coerce for rendering
    }))
  : [];
    // 5. Create the table instance
  const table = useTable({
    key: "person-table", // registers this table with the devtools
    features,
    columns,
    data,
  });

  // 6. Render markup from the table instance APIs
  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder ? null : (
                  <div
                    style={{
                      cursor: header.column.getCanSort()
                        ? "pointer"
                        : undefined,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <table.FlexRender header={header} />
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td key={cell.id}>
                <table.FlexRender cell={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
