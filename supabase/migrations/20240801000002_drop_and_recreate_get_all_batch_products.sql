-- Drop the old function first to avoid return type conflicts.
DROP FUNCTION IF EXISTS public.get_all_batch_products();

-- Recreate the function with the correct definition and security settings.
CREATE OR REPLACE FUNCTION public.get_all_batch_products()
RETURNS TABLE(
    id text,
    sku text,
    name text,
    barcode text,
    brand text,
    exp_date date,
    location text,
    stock bigint,
    status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Set a secure search_path to prevent hijacking
  SET search_path = public;

  RETURN QUERY
  WITH stock_moves AS (
      SELECT
          p.barcode,
          p.location,
          p.expdate,
          SUM(CASE
              WHEN p.status IN (
                  'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse',
                  'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt',
                  'Receipt - Internal Transfer In to B2B', 'Receipt - Internal Transfer In to B2C'
              ) THEN p.qty
              WHEN p.status IN (
                  'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse',
                  'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C',
                  'Issue - Adjustment Manual', 'Issue - Putaway', 'Issue - Return',
                  'Issue - Return Putaway', 'Issue - Update Expired', 'Adjustment - Loc', 'Adjusment - Loc'
              ) THEN -p.qty
              ELSE 0
          END) AS total_stock
      FROM product_out_documents p
      GROUP BY p.barcode, p.location, p.expdate
  ),
  product_info AS (
      SELECT DISTINCT ON (barcode)
          barcode,
          sku,
          name,
          brand
      FROM master_products
  )
  SELECT
      (sm.barcode || '-' || sm.location || '-' || sm.expdate) AS id,
      pi.sku,
      pi.name,
      sm.barcode,
      pi.brand,
      sm.expdate AS exp_date,
      sm.location,
      sm.total_stock AS stock,
      CASE
          WHEN sm.total_stock <= 0 THEN 'Out of Stock'
          WHEN sm.location ILIKE '%%QUARANTINE%%' THEN 'Quarantine'
          WHEN sm.location ILIKE '%%DAMAGED%%' THEN 'Damaged'
          WHEN sm.location ILIKE '%%SENSITIVE MP%%' THEN 'Sensitive MP'
          WHEN sm.location ILIKE '%%MARKETPLACE%%' THEN 'Marketplace'
          WHEN sm.expdate <= CURRENT_DATE THEN 'Expired'
          WHEN sm.expdate <= CURRENT_DATE + interval '3 month' THEN 'Expiring'
          ELSE 'Sellable'
      END AS status
  FROM stock_moves sm
  JOIN product_info pi ON sm.barcode = pi.barcode;
END;
$$;
