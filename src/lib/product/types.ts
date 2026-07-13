export type ProductStock = {
  inventory_id: string;
  business_id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  selling_price: number;
  quantity_on_hand: number;
  reorder_level: number | null;
  status: string;
  average_cost: number;
  cost_price: number | null;
  estimated_overhead_pct: number;
  target_margin_percent: number | null;
  minimum_margin_percent: number | null;
  supplier_id: string | null;
  category_id: string | null;
};

export type Category = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
};
