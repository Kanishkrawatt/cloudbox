export type Named = { name?: string };

/** Case-insensitive substring match on the item name. */
export const filterItems = <T extends Named>(query: string, data: T[]): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return data;
  return data.filter((item) => item.name?.toLowerCase().includes(q));
};

/** Same, for the date-grouped shape used by the images/files pages. */
export const filterGroups = <T extends { date: string; data: Named[] }>(
  query: string,
  groups: T[]
): T[] => {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => ({ ...group, data: filterItems(q, group.data) }))
    .filter((group) => group.data.length > 0);
};
