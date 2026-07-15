export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export type PurchaseOrder = {
  id: string;
  supplier_id: string;
  po_number: string;
  status: string;
  subtotal: number;
  notes: string | null;
  created_at: string;
};

export type POItem = {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  created_at: string;
  receive_notes: string | null;
};

/**
 * One invoiced-and-deduplicated line of a Supplier Statement, merged from
 * two sources: `receiving_sessions`-backed invoices (Inventory's Receiving
 * Session History feature — invoice_number/invoice_date/invoice_total) and,
 * as of Supplier Accounts Payable Phase 1, `supplier_invoices` rows
 * auto-created on Purchase Order receipt (Purchasing-owned). `session_id`
 * holds whichever row's own id regardless of source (a receiving_sessions.id
 * or a supplier_invoices.id) — it is only ever used as a stable row key and,
 * for source: "purchase_order" rows, as the id passed to the new
 * Record Payment/Payment History actions. See loadSupplierStatement() in
 * App.tsx.
 */
export type SupplierStatementRow = {
  session_id: string;
  invoice_number: string;
  invoice_date: string | null;
  invoice_total: number;
  paid: number;
  source: "receiving_session" | "purchase_order";
};

/** A PO's manager and/or supplier signature, keyed by role. Backed by the
 * po_signatures table (business_id-scoped) as of Phase 7 of the
 * stabilization effort — previously localStorage-only. */
export type PoSignatures = {
  manager?: { dataUrl: string; signedAt: string };
  supplier?: { dataUrl: string; signedAt: string };
};
