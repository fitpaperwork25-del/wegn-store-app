import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Read-only Super Admin / Store Success data foundation — server-only,
// service-role access (never sent to the client), shared-secret
// authenticated server-to-server (same cross-project convention as
// QR-Wegn's own admin-operational-summary endpoint). Returns only
// aggregate/identity fields that already exist in the schema — see
// docs/03_DATABASE_REFERENCE.md. No customer data, staff PINs, payment
// details, or per-sale financial figures are read or returned.
//
// This RLS-bypassing service-role client is scoped to this one
// read-only handler; it never touches RLS policies and grants no
// tenant any access it doesn't already have.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sharedSecret = process.env.STORE_ADMIN_SHARED_SECRET;

interface StoreSummary {
  id: string;
  name: string;
  createdAt: string;
  productCount: number;
  activeStaffCount: number;
  salesCount: number;
  lastSaleAt: string | null;
}

interface BusinessRow {
  id: string;
  name: string;
  created_at: string;
}

function getSharedSecretHeader(req: VercelRequest): string | null {
  const header = req.headers["x-store-admin-secret"];
  return typeof header === "string" ? header : null;
}

async function loadStoreCounts(
  supabase: SupabaseClient,
  businessId: string
): Promise<Pick<StoreSummary, "productCount" | "activeStaffCount" | "salesCount" | "lastSaleAt">> {
  const [productsRes, staffRes, salesRes, lastSaleRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("business_id", businessId),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "active"),
    supabase.from("sales").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("status", "completed"),
    supabase
      .from("sales")
      .select("created_at")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const lastSaleRow = (lastSaleRes.data?.[0] as { created_at: string } | undefined) ?? null;

  return {
    productCount: productsRes.count ?? 0,
    activeStaffCount: staffRes.count ?? 0,
    salesCount: salesRes.count ?? 0,
    lastSaleAt: lastSaleRow?.created_at ?? null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed. This endpoint is read-only." });
    return;
  }

  if (!sharedSecret || getSharedSecretHeader(req) !== sharedSecret) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    res.status(500).json({ error: "Supabase credentials are not configured on the server." });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const stores: StoreSummary[] = await Promise.all(
      ((businesses ?? []) as BusinessRow[]).map(async (biz) => {
        const counts = await loadStoreCounts(supabase, biz.id);
        return {
          id: biz.id,
          name: biz.name,
          createdAt: biz.created_at,
          ...counts,
        };
      })
    );

    res.status(200).json({
      storeCount: stores.length,
      stores,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to load store summary." });
  }
}
