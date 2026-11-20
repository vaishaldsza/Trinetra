-- TRINETRA Migration: Add consent column to emergency_contacts
-- Ensures user explicitly grants consent before emergency notifications are dispatched

ALTER TABLE public.emergency_contacts
ADD COLUMN IF NOT EXISTS consent boolean NOT NULL DEFAULT true;
