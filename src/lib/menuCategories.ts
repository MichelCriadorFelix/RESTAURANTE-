// Shared category order between the customer menu (Home.tsx) and the admin
// menu manager (AdminMenu.tsx) so both always group/sort items identically —
// whatever the admin sees is exactly what the customer sees.
export const ORDERED_CATEGORIES = [
  'MONTE SUA MASSA',
  'STROGONOFF',
  'BATATAS RECHEADAS',
  'LASANHAS',
  'MOQUECA',
  'PRATOS EXTRA',
  'PETISCOS',
  'PASTÉIS',
  'BEBIDAS'
];

export function normalizeCategory(category: string): string {
  const upper = (category || '').toUpperCase();
  return upper.startsWith('MONTE SEU ') ? 'MONTE SUA MASSA' : upper;
}

export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const idxA = ORDERED_CATEGORIES.indexOf(normalizeCategory(a));
    const idxB = ORDERED_CATEGORIES.indexOf(normalizeCategory(b));
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

// Products with an explicit sortOrder (set by the admin via the reorder
// buttons) come first, in that order; products that were never manually
// ordered fall back to alphabetical so the list is at least stable and
// predictable until the admin organizes that category.
export function sortProductsByOrder<T extends { name: string; sortOrder?: number }>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}
