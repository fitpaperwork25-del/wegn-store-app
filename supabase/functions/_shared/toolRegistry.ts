import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AiToolDefinition, JsonSchema } from "./aiProvider.ts";
import type { CopilotRole } from "./resolveRole.ts";
import { searchProducts, createSupabaseProductSearchExecutor } from "./tools/searchProducts.ts";
import { getSupplierBalances, fetchSupplierBalancesRawData } from "./tools/getSupplierBalances.ts";
import { getSupplierPaymentHistory, fetchSupplierPaymentHistoryRawData } from "./tools/getSupplierPaymentHistory.ts";
import { getPurchaseOrders, fetchPurchaseOrdersRawData } from "./tools/getPurchaseOrders.ts";
import { getSalesSummary, fetchSalesSummaryRawData } from "./tools/getSalesSummary.ts";
import { getReturnsAndRefunds, fetchReturnsRawData } from "./tools/getReturnsAndRefunds.ts";
import { getProductSalesVelocity, fetchProductSalesVelocityRawData } from "./tools/getProductSalesVelocity.ts";
import { getLowStockProducts, fetchLowStockProductsRawData } from "./tools/getLowStockProducts.ts";

/**
 * Controlled tool registry. Adding a tool means adding one entry here - it
 * never means changing the orchestrator's auth/role/audit plumbing.
 */

export type ToolExecutionContext = {
  businessId: string;
  role: CopilotRole;
  supabase: SupabaseClient;
};

export type ToolRegistryEntry = {
  name: string;
  mode: "read" | "write";
  description: string;
  inputSchema: JsonSchema;
  /** Roles permitted to call this tool at all. Undefined means every
   *  Copilot-eligible role. Field-level restrictions (e.g. cost/margin)
   *  are handled inside the tool's own handler, not here - this is the
   *  coarse "can this role use this tool at all" gate. */
  allowedRoles?: CopilotRole[];
  execute: (rawInput: unknown, ctx: ToolExecutionContext) => Promise<{ ok: true; value: unknown } | { ok: false; error: string }>;
};

const SEARCH_PRODUCTS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Product name, SKU, or barcode text to search for." },
    limit: { type: "integer", minimum: 1, maximum: 25, description: "Maximum results to return (default 10)." },
  },
  required: ["query"],
  additionalProperties: false,
};

const GET_SUPPLIER_BALANCES_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string", description: "Optional supplier name (or partial name) to filter to one supplier. Omit for all suppliers." },
    statusFilter: {
      type: "string",
      enum: ["unpaid", "partial", "paid", "all"],
      description: "Optional. Defaults to 'all'. Use 'unpaid' for fully-outstanding invoices, 'partial' for partially paid ones.",
    },
  },
  required: [],
  additionalProperties: false,
};

const GET_SUPPLIER_PAYMENT_HISTORY_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string", description: "Optional supplier name (or partial name). Omit for the most recent payments across all suppliers." },
    limit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum payments to return, most recent first (default 10)." },
  },
  required: [],
  additionalProperties: false,
};

const GET_PURCHASE_ORDERS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    poNumber: { type: "string", description: "Exact or partial PO number to look up, e.g. \"PO-20260715-131913\"." },
    supplierName: { type: "string", description: "Optional supplier name (or partial name) to filter to one supplier's purchase orders." },
    status: {
      type: "string",
      enum: ["draft", "ordered", "partially_received", "received", "cancelled", "open", "all"],
      description: "Optional. Defaults to 'all'. 'open' means draft, ordered, or partially_received combined. 'ordered' means awaiting delivery.",
    },
    productName: { type: "string", description: "Optional product name (or partial name) - returns only purchase orders containing a matching line item." },
    minSubtotal: { type: "number", minimum: 0, description: "Optional inclusive lower bound on the PO's subtotal dollar amount." },
    maxSubtotal: { type: "number", minimum: 0, description: "Optional inclusive upper bound on the PO's subtotal dollar amount." },
  },
  required: [],
  additionalProperties: false,
};

const GET_SALES_SUMMARY_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    dateRange: { type: "string", enum: ["today", "7d", "30d", "all"], description: "Optional. Defaults to 'today'." },
    cashierName: { type: "string", description: "Optional employee name (or partial name) to filter to one cashier's sales." },
    minTotal: { type: "number", minimum: 0, description: "Optional inclusive lower bound on a sale's total dollar amount." },
    maxTotal: { type: "number", minimum: 0, description: "Optional inclusive upper bound on a sale's total dollar amount." },
  },
  required: [],
  additionalProperties: false,
};

const GET_RETURNS_AND_REFUNDS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    dateRange: { type: "string", enum: ["today", "7d", "30d", "all"], description: "Optional. Defaults to 'today'. Filters by when the RETURN was processed, not the original sale's date." },
    cashierName: { type: "string", description: "Optional employee name (or partial name) who processed the return." },
  },
  required: [],
  additionalProperties: false,
};

const GET_PRODUCT_SALES_VELOCITY_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum products to return in the top-sellers list (default 15)." },
  },
  required: [],
  additionalProperties: false,
};

const GET_LOW_STOCK_PRODUCTS_INPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    supplierName: { type: "string", description: "Optional supplier name (or partial name) to filter to one supplier's low-stock products." },
  },
  required: [],
  additionalProperties: false,
};

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    name: "search_products",
    mode: "read",
    description:
      "Search the store's live product catalog by name, SKU, or barcode. Returns basic product and stock info (name, SKU, barcode, selling price, quantity on hand, status) for matching products - no cost, margin, or profit data. " +
      "Use this whenever the user asks about specific products, current stock/inventory levels, or pricing for this store - for example: \"What products are in stock?\", \"Do we have Sunflower Seeds?\", \"How much is SKU 00123?\", \"Search for barcode 012345678901\", \"What's our stock of oat milk?\". " +
      "Do not use this for questions that aren't about this store's actual catalog data - general/educational questions (e.g. \"Explain FIFO inventory\"), greetings or small talk (e.g. \"Hello\", \"What can you do?\"), or requests this tool cannot fulfill (it searches by name/SKU/barcode text and does not return a total product count, cost/margin data, sales history, or supplier/employee/customer data).",
    inputSchema: SEARCH_PRODUCTS_INPUT_SCHEMA,
    // No allowedRoles restriction - every Copilot-eligible role may search
    // products; the output itself never contains restricted fields.
    execute: async (rawInput, ctx) => {
      const executor = createSupabaseProductSearchExecutor(ctx.supabase);
      const result = await searchProducts(rawInput, { businessId: ctx.businessId }, executor);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_supplier_balances",
    mode: "read",
    description:
      "Look up what this store owes its suppliers: outstanding, partially paid, and fully paid invoice balances, either across all suppliers or for one named supplier. Returns exact, already-computed totals - never estimate or add up figures yourself. " +
      "Use this for questions like: \"Which suppliers do we owe money?\", \"How much do we owe in total?\", \"How much do we owe CBA Supplies?\", \"Show unpaid supplier invoices\", \"Show partially paid invoices\", \"Which suppliers have no outstanding balance?\". " +
      "Do not use this for payment history/transactions (use get_supplier_payment_history instead) or for anything about products/inventory (use search_products instead). This tool is read-only and cannot create, edit, approve, delete, or pay invoices.",
    inputSchema: GET_SUPPLIER_BALANCES_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getSupplierBalances(rawInput, { businessId: ctx.businessId }, (businessId) => fetchSupplierBalancesRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_supplier_payment_history",
    mode: "read",
    description:
      "Look up this store's history of payments made to suppliers - individual payment records (amount, date, method, reference), most recent first, either across all suppliers or for one named supplier. " +
      "Use this for questions like: \"What was our latest supplier payment?\", \"Show payment history for CBA Supplies\". " +
      "Do not use this for current balances or what's still owed (use get_supplier_balances instead). This tool is read-only and cannot create, edit, or delete payments.",
    inputSchema: GET_SUPPLIER_PAYMENT_HISTORY_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getSupplierPaymentHistory(rawInput, { businessId: ctx.businessId }, (businessId) => fetchSupplierPaymentHistoryRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_purchase_orders",
    mode: "read",
    description:
      "Look up this store's purchase orders - by status (draft, ordered/awaiting delivery, partially received, received, cancelled, or open = draft+ordered+partially_received combined), by supplier, by PO number, by a product it contains, or by subtotal dollar range. Returns exact, already-computed counts and totals. " +
      "Use this for questions like: \"Show open purchase orders\", \"Which purchase orders are awaiting delivery?\", \"Show draft purchase orders\", \"Show purchase orders for CBA Supplies\", \"Which purchase order contains Milk 1 Liter?\", \"Show PO-20260715-131913\", \"What is the status of PO-20260715-131913?\", \"Show cancelled purchase orders\", \"Show purchase orders over $500\". " +
      "This tool has no reliable way to determine WHEN a purchase order's status last changed - only its CURRENT status and creation date. Do not use it, and do not guess, for questions like \"which purchase orders were received/cancelled/ordered today\" - if asked, say plainly that this isn't something you can determine reliably. This tool is read-only and cannot create, edit, approve, cancel, receive, or delete purchase orders.",
    inputSchema: GET_PURCHASE_ORDERS_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getPurchaseOrders(rawInput, { businessId: ctx.businessId }, (businessId, filter) => fetchPurchaseOrdersRawData(ctx.supabase, businessId, filter));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_sales_summary",
    mode: "read",
    description:
      "Look up this store's completed sales - totals, cash/card/other payment split, largest sale, average sale, per-cashier breakdown, and top-selling products - for a time window (defaults to today), optionally filtered by cashier or by a sale's dollar-total range. Returns exact, already-computed totals - never estimate or add up figures yourself. " +
      "Use this for questions like: \"What were today's total sales?\", \"What sold today?\", \"Show today's transactions\", \"What were cash sales today?\", \"What were card sales today?\", \"What are today's top-selling products?\", \"What was the largest sale today?\", \"Which cashier processed the most sales today?\", \"Show sales for cashier Alice\", \"Show transactions over $100\", \"What was the average sale amount today?\". " +
      "Do not use this for returns/refunds (use get_returns_and_refunds instead) or for which products are dormant/trending over the last week or month (use get_product_sales_velocity instead). This tool is read-only and cannot create, edit, or void sales.",
    inputSchema: GET_SALES_SUMMARY_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getSalesSummary(rawInput, { businessId: ctx.businessId }, (businessId, filter) => fetchSalesSummaryRawData(ctx.supabase, businessId, filter));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_returns_and_refunds",
    mode: "read",
    description:
      "Look up this store's processed returns and refunds - per-product return lines with reason, refund amount, and who processed them - for a time window (defaults to today, based on when the RETURN happened, not the original sale's date), optionally filtered by which cashier processed it. Returns exact, already-computed totals. " +
      "Use this for questions like: \"What were today's returns?\", \"Show today's refunds\". " +
      "Do not use this for sales totals (use get_sales_summary instead). This tool is read-only and cannot create, edit, or process returns.",
    inputSchema: GET_RETURNS_AND_REFUNDS_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getReturnsAndRefunds(rawInput, { businessId: ctx.businessId }, (businessId, filter) => fetchReturnsRawData(ctx.supabase, businessId, filter));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_product_sales_velocity",
    mode: "read",
    description:
      "Look up which active products have NOT sold in the last 30 days (dormant) and which products are selling the most by quantity in the last 7 days (top sellers this week). Fixed windows only - not a general date-range sales tool. " +
      "Use this for questions like: \"Which products have not sold in the last 30 days?\", \"Which products are selling fastest this week?\". " +
      "Do not use this for today's sales totals or transaction-level questions (use get_sales_summary instead). This tool is read-only.",
    inputSchema: GET_PRODUCT_SALES_VELOCITY_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getProductSalesVelocity(rawInput, { businessId: ctx.businessId }, (businessId) => fetchProductSalesVelocityRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
  {
    name: "get_low_stock_products",
    mode: "read",
    description:
      "Look up this store's active products that are below their reorder level - current stock, reorder level, supplier, and a suggested reorder quantity based on recent sales velocity (the same calculation the Purchasing tab's AI Smart Reorder already uses) - optionally filtered to one supplier. No cost, margin, or profit data. " +
      "Use this for questions like: \"What's low on stock?\", \"What needs reordering?\", \"Which products are below reorder level?\", \"What should I reorder from CBA Supplies?\". " +
      "The suggested quantity is informational only - this tool is read-only and cannot create purchase orders.",
    inputSchema: GET_LOW_STOCK_PRODUCTS_INPUT_SCHEMA,
    allowedRoles: ["owner", "manager"],
    execute: async (rawInput, ctx) => {
      const result = await getLowStockProducts(rawInput, { businessId: ctx.businessId }, (businessId) => fetchLowStockProductsRawData(ctx.supabase, businessId));
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, value: result.value };
    },
  },
];

export function findTool(name: string): ToolRegistryEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}

export function toAiToolDefinitions(): AiToolDefinition[] {
  return TOOL_REGISTRY.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
