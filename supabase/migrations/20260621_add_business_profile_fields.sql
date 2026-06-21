-- ========================================
-- Add profile fields to businesses table
-- Applied: 2026-06-21
-- ========================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text;
