
-- Drop the existing function to avoid conflicts if its definition has changed
DROP FUNCTION IF EXISTS public.get_all_batch_products();

-- Recreate the function with the secure search_path setting
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
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH stock_moves AS (
        SELECT
            p_out.barcode,
            p_out.location,
            p_out.expdate::date AS exp_date,
            SUM(
                CASE
                    WHEN p_out.status IN (
                        'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse',
                        'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt'
                    ) THEN p_out.qty
                    WHEN p_out.status IN (
                        'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse',
                        'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C',
                        'Issue - Adjustment Manual', 'Issue - Putaway', 'Issue - Return',
                        'Issue - Return Putaway', 'Issue - Update Expired', 'Adjustment - Loc', 'Adjusment - Loc'
                    ) THEN -p_out.qty
                    ELSE 0
                END
            ) AS total_stock
        FROM
            public.product_out_documents p_out
        GROUP BY
            p_out.barcode,
            p_out.location,
            p_out.expdate
    ),
    latest_master_product AS (
        SELECT DISTINCT ON (mp.barcode)
            mp.barcode,
            mp.sku,
            mp.name,
            mp.brand
        FROM
            public.master_products mp
        ORDER BY
            mp.barcode, mp.created_at DESC
    )
    SELECT
        (sm.barcode || '-' || sm.location || '-' || sm.exp_date)::text AS id,
        lmp.sku::text,
        lmp.name::text,
        sm.barcode::text,
        lmp.brand::text,
        sm.exp_date::date,
        sm.location::text,
        sm.total_stock::bigint AS stock,
        CASE
            WHEN sm.total_stock <= 0 THEN 'Out of Stock'::text
            WHEN sm.exp_date <= (now() + interval '3 month') AND sm.exp_date > now() THEN 'Expiring'::text
            WHEN sm.exp_date <= now() THEN 'Expired'::text
            WHEN sm.location ILIKE '%QUARANTINE%' THEN 'Quarantine'::text
            WHEN sm.location ILIKE '%MP%' AND lmp.brand ILIKE ANY (ARRAY['%sensitive%', '%adult%']) THEN 'Sensitive MP'::text
            WHEN sm.location ILIKE '%MP%' THEN 'Marketplace'::text
            WHEN sm.location ILIKE '%DAMAGED%' THEN 'Damaged'::text
            ELSE 'Sellable'::text
        END AS status
    FROM
        stock_moves sm
    JOIN
        latest_master_product lmp ON sm.barcode = lmp.barcode;
END;
$$;
