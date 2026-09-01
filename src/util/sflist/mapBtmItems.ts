/**
 * maps the output of dumpbtm:
 * - assigns the top-level UID, GUID and Username to each item
 * - flattens the "state" property of each item
 */
/** biome-ignore-all lint/suspicious/noExplicitAny: we need to be able to handle any type */
export const mapBtmItems = (arr: any[]) =>
  arr.map((i: any) =>
    i.items.map((ii: any) => ({ Username: i.Username, UID: i.UID, GUID: i.GUID, ...i.state, ...ii })),
  );
