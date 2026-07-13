export type Transaction = {
  id: string;
  created_at: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  product_id: string;
  products: { name: string } | null;
};

export type BulkRow = {
  name: string;
  selling_price: string;
  sku: string;
  barcode: string;
  cost_price: string;
  reorder_level: string;
  initial_stock: string;
  status: 'valid' | 'missing_name' | 'missing_price' | 'invalid_price' | 'duplicate_barcode';
};

export type InventoryBatch = {
  id: string;
  business_id: string;
  product_id: string;
  receiving_session_id: string | null;
  receiving_session_item_id: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  batch_number: string | null;
  lot_number: string | null;
  manufactured_date: string | null;
  expiration_date: string | null;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number | null;
  status: string;
  created_at: string;
  product_name?: string;
};

export type StockCountLine = {
  product_id: string;
  inventory_id: string;
  business_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  system_qty: number;
  counted_qty: number;
};

export type StockCountRecord = {
  id: string;
  business_id: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export type StockCountItemDetail = {
  id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  products: { name: string; sku: string | null } | null;
};
