export type Employee = {
  id: string;
  business_id: string;
  name: string;
  employee_code: string;
  role: string;
  status: string;
  // Staff Mode Phase 2: PIN is hashed server-side and never selected by
  // the client - pin_set is a client-safe boolean replacement for the
  // old plaintext `pin` field's truthiness checks. auth_user_id is
  // populated at first PIN-login (see employee-pin-login) and used to
  // rehydrate staffSession after a page refresh - see App.tsx.
  pin_set: boolean;
  auth_user_id: string | null;
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
