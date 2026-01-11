-- Update subscription plans: Unlimited listings for all plans
-- Strategy: Unlimited listings to maximize platform content
-- Premium feature: Offer limits (Basic: 10, Advanced: 100, Corporate: unlimited)

-- Update Basic Plan: Unlimited listings, 10 offers/month
UPDATE subscription_plans
SET limits = jsonb_set(
  limits,
  '{listings_per_month}',
  '-1'::jsonb
)
WHERE slug = 'basic';

-- Update Advanced Plan: Unlimited listings, 100 offers/month
UPDATE subscription_plans
SET limits = jsonb_set(
  limits,
  '{listings_per_month}',
  '-1'::jsonb
)
WHERE slug = 'advanced';

-- Update Corporate Plan: Unlimited listings, unlimited offers
-- (listings_per_month already -1, but ensure it's set)
UPDATE subscription_plans
SET limits = jsonb_set(
  limits,
  '{listings_per_month}',
  '-1'::jsonb
)
WHERE slug = 'corporate';

-- Verify changes
-- SELECT slug, name, limits->>'listings_per_month' as listings, limits->>'offers_per_month' as offers 
-- FROM subscription_plans 
-- ORDER BY slug;

