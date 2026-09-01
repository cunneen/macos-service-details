// ==== utils for working with TanStack Tables
import type { Key, SortDescriptor } from "@react-types/shared";
import type { ColumnDef, SortingState, TableFeatures } from "@tanstack/react-table";
import { CELL_PADDING_X, FONT_SIZE_MULTIPLIER } from "../config/config";
import { getLoggerForCurrentRuntime } from "./log/getLoggerForCurrentRuntime";

const log = getLoggerForCurrentRuntime();

/** A row whose value type we don't (yet) know, but keyed by string props */
export type DynamicRow = Record<string, unknown>;

/**
 * Default header formatter that converts the provided key to a string.
 * @param i - The column identifier to format as a header.
 * @returns The header as a string.
 */
export const formatHeader = (i: unknown) => String(i);

// --- Sorting Bridge -------------------------------------------------------
/**
 * Converts a TanStack Table `SortingState` to a HeroUI `SortDescriptor`.
 * @param sorting - The current TanStack sorting state.
 * @returns A `SortDescriptor` representing the first sort entry, or `undefined` if no sort is applied.
 */
export const toSortDescriptor = (sorting: SortingState): SortDescriptor | undefined => {
  const first = sorting[0];

  if (!first) return undefined;

  return {
    column: first.id,
    direction: first.desc ? "descending" : "ascending",
  };
}

/**
 * Converts a HeroUI / React ARIA `SortDescriptor` to a TanStack Table `SortingState`.
 * @param descriptor - The sort descriptor from HeroUI.
 * @returns A `SortingState` array with a single sort entry.
 */
export const toSortingState = (descriptor: SortDescriptor): SortingState => {
  return [
    {
      desc: descriptor.direction === "descending",
      id: descriptor.column as string,
    },
  ];
}

/**
 * Sorts the provided data based on a `SortDescriptor`.
 * Comparison is performed as a locale-aware string comparison.
 * @param dataToSort - The array of row data to sort.
 * @param sortDescriptor - The descriptor indicating which column and direction to sort by.
 * @returns A new sorted array (does not mutate the original).
 */
export const sortDataByDescriptor = (
  dataToSort: Record<string, Record<string, unknown>>[],
  sortDescriptor: SortDescriptor | undefined,
) => {
  return [...dataToSort].sort((a, b) => {
    const col = sortDescriptor?.column as Key;
    const first = String(a[col]);
    const second = String(b[col]);
    let cmp = first.localeCompare(second);
    // log.debug(`sortDataByDescriptor: sortDescriptor='${JSON.stringify(sortDescriptor)}', col='${col}', first='${first}', second='${second}', cmp='${cmp}'`);
    if (sortDescriptor?.direction === "descending") {
      cmp *= -1;
    }
    return cmp;
  });
};

/**
 * Calculates the maximum pixel width for each column based on the longest text content.
 * Width is determined by character count multiplied by a font size factor, plus padding.
 * Also considers header text width when calculating the maximum.
 * @param rowData - Array of row objects containing the data to measure.
 * @param columns - Column definitions containing header information.
 * @returns A Map of column keys to their calculated widths in pixels.
 */
export const getColumnWidths = (
  rowData: Record<string, Record<string, unknown>>[], // an array of objects, keyed by string props, values are unknown but also keyed by string props.
  columns: ColumnDef<TableFeatures, DynamicRow>[],
): Map<Key, number> => {
  // log.debug(`in getColumnWidths, rowData.length=${rowData.length}`);

  // function to get width in pixels for a string
  const getWidthInPixels = (str: unknown): number => {
    return str
      ? String(str).length * FONT_SIZE_MULTIPLIER + 2 * CELL_PADDING_X
      : -1;
  };

  // get the header for each key
  const headers = Object.fromEntries(columns.map((c) => [c.id, c.header]));

  const colWidthsByPropName: Map<Key, number> = new Map<Key, number>();
  for (const row of rowData) {
    // log.debug(`    getColumnWidths; row=${JSON.stringify(row)}`);
    for (const [k, v] of Object.entries(row)) {
      // log.debug(`        getColumnWidths; [k,v]=${JSON.stringify([k,v])}`);

      // also check the width of the "header" for this key
      const maxLengthHeader = (headers?.[k] ?? "")
        .split(" ")
        .reduce((p: string, c: string) => (p.length > c.length ? p : c), "");
      const headerWidth = getWidthInPixels(maxLengthHeader);
      // if this value is "wider" then use it as the new width.
      const existing = colWidthsByPropName.get(k) ?? -1;
      colWidthsByPropName.set(
        k,
        Math.max(existing, getWidthInPixels(v), headerWidth),
      );
    }
  }
  log.debug(
    `in getColumnWidths, returning=${JSON.stringify(Object.fromEntries(colWidthsByPropName.entries()))}`,
  );

  return colWidthsByPropName;
};
