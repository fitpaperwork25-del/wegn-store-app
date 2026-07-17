export type Sale = {
  id: string;
  cashier_id: string | null;
  customer_id: string | null;
  subtotal: number;
  tax: number;
  discount_amount: number;
  total: number;
  status: string;
  created_at: string;
};

export type SaleItemRecord = {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type CartItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  original_unit_price: number;
  negotiation_reason: string | null;
  negotiated_by: string | null;
};

export type ReturnLineItem = {
  product_id: string;
  product_name: string;
  original_qty: number;
  unit_price: number;
  already_returned: number;
  available_qty: number;
  return_qty: number;
};

export type ReturnRecord = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity_returned: number;
  reason: string | null;
  return_number: string | null;
  return_reason: string | null;
  notes: string | null;
  processed_by: string | null;
  created_at: string;
};

/** Minimal projection of a return line — just enough to attribute a
 * return back to its sale/product for EOD and reporting rollups.
 * Distinct from ReturnRecord, which is the full return_items row. */
export type ReturnItemSummary = {
  sale_id: string;
  product_id: string;
  quantity_returned: number;
};

export type ReceiptItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type Receipt = {
  sale: Sale;
  items: ReceiptItem[];
  paymentMethod: string;
  paymentReference?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
};

export type EodPayment = {
  sale_id: string;
  payment_method: string;
  amount: number;
  reference?: string | null;
  payment_type?: string;
  /** Required for refund-date-based reconciliation (Cash Drawer / EOD): a
   *  refund must be matched to the drawer session/day it was actually
   *  processed in, not the day its original sale happened. */
  created_at: string;
};

export type AnalyticsData = {
  revenue: number;
  txCount: number;
  avgTx: number;
  itemsSold: number;
  discounts: number;
  taxCollected: number;
  cashTotal: number;
  cardTotal: number;
  otherTotal: number;
  dailyRows: [string, { revenue: number; count: number }][];
  productRows: { name: string; units: number; revenue: number; product_id: string }[];
  rangeLabel: string;
};
