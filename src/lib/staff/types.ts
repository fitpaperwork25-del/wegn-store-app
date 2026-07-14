export type Employee = {
  id: string;
  business_id: string;
  name: string;
  role: string;
  status: string;
  pin: string | null;
  created_at: string;
};

export type DrawerSession = {
  id: string;
  business_id: string;
  cashier_id: string | null;
  status: string;
  opening_float: number;
  opened_at: string | null;
  closed_at: string | null;
  closing_count: number | null;
  expected_cash: number | null;
  over_short: number | null;
  notes: string | null;
  created_at: string | null;
};

export type DrawerPaidOut = {
  id: string;
  drawer_session_id: string;
  amount: number;
  reason: string | null;
  created_at: string;
};
