-- Migration: Add stitches_used column to patterns table
-- Feature: Link stitches to patterns

ALTER TABLE patterns ADD COLUMN IF NOT EXISTS stitches_used text[] DEFAULT '{}';

COMMENT ON COLUMN patterns.stitches_used IS 'Array of stitch names used in this pattern (e.g. chain, single crochet, double crochet)';
