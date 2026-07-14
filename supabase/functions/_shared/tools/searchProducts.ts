/**
 * search_products - the one tool in Foundation Milestone 1.
 *
 * Split the same way every tool in this registry should be: a pure
 * validate/shape layer (unit-tested, no I/O) and a thin executor factory
 * that does the actual, tenant-scoped Supabase query. No output field in
 * this tool is role-restricted - product name/sku/barcode/price/stock are
 * visible to every role that can use the Copilot at all, matching the
 * approved permission matrix (cost/margin fields don't appear in this
 * tool's output at all, for any role - they belong to get_product_details,
 * a later milestone).
 */

export type SearchProductsInput = { query: string; limit?: number };

export type ProductSearchRow = {
  product_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  quantity_on_hand: number;
  status: string;
};

export type SearchProductsOutput = { products: ProductSearchRow[] };

export const SEARCH_PRODUCTS_DEFAULT_LIMIT = 10;
export const SEARCH_PRODUCTS_MAX_LIMIT = 25;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Pure input validation - no network, fully unit-testable. */
export function validateSearchProductsInput(input: unknown): ValidationResult<SearchProductsInput> {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Input must be an object" };
  }
  const obj = input as Record<string, unknown>;

  if (typeof obj.query !== "string" || obj.query.trim().length === 0) {
    return { ok: false, error: "query is required and must be a non-empty string" };
  }
  if (obj.query.length > 200) {
    return { ok: false, error: "query must be 200 characters or fewer" };
  }

  let limit = SEARCH_PRODUCTS_DEFAULT_LIMIT;
  if (obj.limit !== undefined) {
    if (typeof obj.limit !== "number" || !Number.isInteger(obj.limit) || obj.limit < 1) {
      return { ok: false, error: "limit must be a positive integer" };
    }
    limit = Math.min(obj.limit, SEARCH_PRODUCTS_MAX_LIMIT);
  }

  return { ok: true, value: { query: obj.query.trim(), limit } };
}

/**
 * PostgREST's .or() filter string treats `,` `(` `)` as structural syntax.
 * Strip them from user-supplied search text rather than trying to escape
 * them, so a search query can never distort the filter it's embedded in.
 */
export function sanitizeForPostgrestFilter(value: string): string {
  return value.replace(/[,()]/g, "");
}

export type ProductSearchExecutor = (params: {
  businessId: string;
  query: string;
  limit: number;
}) => Promise<ProductSearchRow[]>;

/** Pure orchestration of validate -> execute -> shape. Unit-tested with a
 *  mock executor - no live database needed. */
export async function searchProducts(
  rawInput: unknown,
  ctx: { businessId: string },
  executor: ProductSearchExecutor
): Promise<ValidationResult<SearchProductsOutput>> {
  const validated = validateSearchProductsInput(rawInput);
  if (!validated.ok) return validated;

  const rows = await executor({
    businessId: ctx.businessId,
    query: validated.value.query,
    limit: validated.value.limit,
  });

  return { ok: true, value: { products: rows } };
}

/**
 * Minimal structural shape of what this executor needs from a Supabase
 * client - kept narrow so this file doesn't force a hard dependency on
 * @supabase/supabase-js's full type surface.
 */
export type ProductSearchClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        or(filter: string): {
          limit(n: number): Promise<{ data: unknown; error: unknown }>;
        };
      };
    };
  };
};

type RawInventoryJoinRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  status: string;
  inventory: { quantity_on_hand: number } | { quantity_on_hand: number }[] | null;
};

function extractQuantityOnHand(inv: RawInventoryJoinRow["inventory"]): number {
  if (!inv) return 0;
  if (Array.isArray(inv)) return inv[0]?.quantity_on_hand ?? 0;
  return inv.quantity_on_hand ?? 0;
}

/**
 * Real, tenant-scoped Supabase executor. `business_id` is applied as an
 * explicit filter here in addition to RLS (which already scopes the query
 * via the caller's JWT) - defense in depth, and it's what makes tenant
 * isolation for this tool directly assertable in a unit test against a
 * mock client, not just trusted to RLS alone.
 */
export function createSupabaseProductSearchExecutor(client: ProductSearchClient): ProductSearchExecutor {
  return async ({ businessId, query, limit }) => {
    const pattern = `%${sanitizeForPostgrestFilter(query)}%`;
    const { data, error } = await client
      .from("products")
      .select("id, name, sku, barcode, selling_price, status, inventory(quantity_on_hand)")
      .eq("business_id", businessId)
      .or(`name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`)
      .limit(limit);

    if (error) throw error;

    return ((data ?? []) as RawInventoryJoinRow[]).map((row) => ({
      product_id: row.id,
      product_name: row.name,
      sku: row.sku,
      barcode: row.barcode,
      selling_price: row.selling_price,
      quantity_on_hand: extractQuantityOnHand(row.inventory),
      status: row.status,
    }));
  };
}
