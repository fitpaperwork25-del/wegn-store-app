export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  created_at: string;
};

export type LoyaltyTransaction = {
  id: string;
  customer_id: string;
  sale_id: string | null;
  points: number;
  type: string;
  created_at: string;
};
