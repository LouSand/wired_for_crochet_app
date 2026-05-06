-- Add default_currency and default_profit_margin to user_settings
-- These allow users to set a global currency and profit margin from settings

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS default_currency varchar(3) NOT NULL DEFAULT 'GBP';

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS default_profit_margin decimal(5,2);

-- Also add profit_margin to projects table for per-project override
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS profit_margin decimal(5,2);
