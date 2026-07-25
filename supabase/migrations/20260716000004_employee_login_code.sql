-- ========================================
-- Staff Authentication Redesign: Employee ID / Username login.
-- Scope: replace PIN-only staff login (no way to identify which employee
--        is attempting to log in) with Employee ID + PIN. Owner login
--        (Supabase Auth email/password) is untouched - completely separate
--        mechanism, never referenced here.
--
-- Migration strategy: additive, with a one-time backfill so existing staff
-- keep working without requiring a manual admin step first.
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code text;

-- Backfill: derive a code from each existing employee's name (letters/
-- digits only, uppercased), de-duplicated per business with a numeric
-- suffix on collision. Falls back to EMP + a short id fragment if a name
-- produces an empty code (e.g. a name with no ASCII letters/digits).
WITH generated AS (
  SELECT
    id,
    upper(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g')) AS base_code,
    row_number() OVER (
      PARTITION BY business_id, upper(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'))
      ORDER BY created_at
    ) AS rn
  FROM employees
  WHERE employee_code IS NULL
)
UPDATE employees e
SET employee_code = CASE
    WHEN g.base_code = '' THEN 'EMP' || substr(e.id::text, 1, 6)
    WHEN g.rn = 1 THEN g.base_code
    ELSE g.base_code || g.rn::text
  END
FROM generated g
WHERE e.id = g.id;

ALTER TABLE employees ALTER COLUMN employee_code SET NOT NULL;

ALTER TABLE employees
  ADD CONSTRAINT employees_business_id_employee_code_key UNIQUE (business_id, employee_code);

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_business_id_employee_code_key;
-- ALTER TABLE employees ALTER COLUMN employee_code DROP NOT NULL;
-- ALTER TABLE employees DROP COLUMN IF EXISTS employee_code;
