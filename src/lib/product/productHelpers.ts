import type { ProductStock, Category } from "./types";

/**
 * Pure, stateless Product-domain helpers.
 *
 * None of these touch Supabase, React state, or any other domain's data —
 * every function here takes `products` (and occasionally `categories`) as a
 * plain argument and returns a derived value. They exist to replace the
 * ~11 independently-duplicated `Object.fromEntries(products.map(...))`
 * call sites found across App.tsx and the already-extracted tab/shared
 * components, without changing what any of them compute.
 */

/** id -> product_name. Replaces the most common duplicated lookup pattern. */
export function buildProductNameMap(products: ProductStock[]): Record<string, string> {
  return Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
}

/** id -> full ProductStock record. */
export function buildProductIndex(products: ProductStock[]): Record<string, ProductStock> {
  return Object.fromEntries(products.map((p) => [p.product_id, p])) as Record<string, ProductStock>;
}

/**
 * Exact-match barcode lookup, case-insensitive and whitespace-tolerant.
 * Not yet wired into any existing call site (POS's scan-to-cart and the
 * Add Product form's auto-fill each currently have their own inline,
 * slightly different matching expression) — those are POS/Product-form
 * owned code and are intentionally left untouched in this step. This
 * helper is here so a future extraction can adopt it without
 * reimplementing the lookup a third time.
 */
export function findProductByBarcode(products: ProductStock[], code: string): ProductStock | undefined {
  const normalized = code.trim().toUpperCase();
  return products.find((p) => String(p.barcode || "").trim().toUpperCase() === normalized);
}

/** Category-and-search filter used by the Inventory product table. */
export function filterProducts(
  products: ProductStock[],
  categoryFilter: string,
  searchQuery: string
): ProductStock[] {
  return products
    .filter((p) =>
      categoryFilter === "all" ? true : categoryFilter === "uncategorized" ? !p.category_id : p.category_id === categoryFilter
    )
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        p.product_name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q)
      );
    });
}

/** Active products below their reorder level, sorted by most-short-of-target first. */
export function getLowStockProducts(products: ProductStock[]): ProductStock[] {
  return products
    .filter((p) => p.status === "active" && p.reorder_level !== null && p.quantity_on_hand < p.reorder_level)
    .sort((a, b) => (a.quantity_on_hand - (a.reorder_level ?? 0)) - (b.quantity_on_hand - (b.reorder_level ?? 0)));
}

/** Total value of on-hand inventory, valued at each product's average cost. */
export function getTotalInventoryValue(products: ProductStock[]): number {
  return products.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0);
}

/**
 * Generates a candidate internal "Wegn" barcode for a product with no
 * manufacturer barcode: "WGN" + 10 random digits (e.g. "WGN8729755354").
 * Pure and stateless - does not check uniqueness itself, since that requires
 * a database round-trip. Callers must verify the candidate doesn't already
 * exist and regenerate on collision (see handleAddProduct in App.tsx).
 */
export function generateWegnBarcode(): string {
  const digits = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
  return `WGN${digits}`;
}

export type CategoryChip = { key: string; label: string; count: number };

/** Category filter-chip list (All / Uncategorized / each category) with product counts. */
export function getCategoryChips(products: ProductStock[], categories: Category[]): CategoryChip[] {
  const countByCategory: Record<string, number> = {};
  let uncategorizedCount = 0;
  for (const p of products) {
    if (!p.category_id) uncategorizedCount++;
    else countByCategory[p.category_id] = (countByCategory[p.category_id] ?? 0) + 1;
  }
  return [
    { key: "all", label: "All", count: products.length },
    { key: "uncategorized", label: "Uncategorized", count: uncategorizedCount },
    ...categories.map((c) => ({ key: c.id, label: c.name, count: countByCategory[c.id] ?? 0 })),
  ];
}
