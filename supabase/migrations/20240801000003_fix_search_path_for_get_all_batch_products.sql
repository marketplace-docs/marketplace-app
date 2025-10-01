
-- Drop the old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.get_all_batch_products();

-- Recreate the function with the correct, secure syntax
CREATE OR REPLACE FUNCTION public.get_all_batch_products()
RETURNS TABLE(
    id text,
    sku text,
    name text,
    barcode text,
    brand text,
    exp_date text,
    location text,
    stock bigint,
    status text
)
LANGUAGE plpgsql
-- Set a non-mutable search_path for security
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH stock_moves AS (
        SELECT
            p.sku,
            p.name,
            p.barcode,
            p.brand,
            pod.expdate::text AS exp_date,
            pod.location,
            CASE
                WHEN pod.status IN (
                    'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse', 
                    'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt',
                    'Receipt - Internal Transfer In to B2B', 'Receipt - Internal Transfer In to B2C'
                ) THEN pod.qty
                ELSE -pod.qty
            END AS quantity
        FROM
            product_out_documents pod
        JOIN
            master_products p ON pod.sku = p.sku
    ),
    aggregated_stock AS (
        SELECT
            sku,
            name,
            barcode,
            brand,
            exp_date,
            location,
            SUM(quantity) AS final_stock
        FROM
            stock_moves
        GROUP BY
            sku, name, barcode, brand, exp_date, location
    )
    SELECT
        (md5(concat(ags.sku, ags.location, ags.exp_date)))::text as id,
        ags.sku,
        ags.name,
        ags.barcode,
        ags.brand,
        ags.exp_date,
        ags.location,
        ags.final_stock AS stock,
        CASE
            WHEN ags.final_stock <= 0 THEN 'Out of Stock'
            WHEN ags.exp_date::date <= NOW() THEN 'Expired'
            WHEN ags.exp_date::date <= (NOW() + interval '3 months') THEN 'Expiring'
            WHEN ags.location ILIKE '%QUARANTINE%' THEN 'Quarantine'
            WHEN ags.location ILIKE '%DAMAGED%' THEN 'Damaged'
            WHEN ags.location ILIKE '%MP-%' THEN 'Marketplace'
            WHEN ags.location ILIKE '%SENSITIVE-MP%' THEN 'Sensitive MP'
            ELSE 'Sellable'
        END::text AS status
    FROM
        aggregated_stock ags;
END;
$$;
