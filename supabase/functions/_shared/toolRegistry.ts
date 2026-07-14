import type { AiToolDefinition, JsonSchema } from "./aiProvider.ts";
import type { CopilotRole } from "./resolveRole.ts";
import { searchProducts, createSupabaseProductSearchExecutor, type ProductSearchClient } from "./tools/searchProducts.ts";

/**
 * Controlled tool registry. Adding a tool means adding one entry here - it
 * never means changing the orchestrator's auth/role/audit plumbing. Milestone
 * 1 registers exactly one tool: search_products.
 */

export type ToolExecutionContext = {
  businessId: string;
  role: CopilotRole;
  supabase: ProductSearchClient;
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

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    name: "search_products",
    mode: "read",
    description: "Search the store's product catalog by name, SKU, or barcode. Returns basic product and stock info - no cost, margin, or profit data.",
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
];

export function findTool(name: string): ToolRegistryEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}

export function toAiToolDefinitions(): AiToolDefinition[] {
  return TOOL_REGISTRY.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
}
