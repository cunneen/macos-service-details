/**
 * Recursively flattens an array of objects or nested arrays into a single-level array.
 *
 * @param arr - The array to flatten deeply.
 * @returns A new array with all nested arrays flattened into it.
 */
// biome-ignore lint/suspicious/noExplicitAny: we need to be able to handle any type
export const flattenDeep = (arr: any[]): any[] => Array.isArray(arr)
  ? arr.reduce((a, b) => a.concat(flattenDeep(b)), [])
  : [arr];
