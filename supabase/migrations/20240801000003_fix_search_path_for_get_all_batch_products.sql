-- First, drop the existing function to avoid any signature conflicts
DROP FUNCTION IF EXISTS public.get_all_batch_products();

-- Then, recreate the function with the correct security settings and logic
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
    status public.product_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH stock_moves AS (
        SELECT
            p.sku,
            p.barcode,
            p.expdate,
            p.location,
            SUM(
                CASE
                    WHEN p.status IN (
                        'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse',
                        'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt',
                        'Receipt - Internal Transfer In to B2B', 'Receipt - Internal Transfer In to B2C'
                    ) THEN p.qty
                    WHEN p.status IN (
                        'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse',
                        'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C',
                        'Issue - Adjustment Manual', 'Issue - Putaway', 'Issue - Return',
                        'Issue - Return Putaway', 'Issue - Update Expired', 'Adjustment - Loc',
                        'Adjusment - Loc'
                    ) THEN -p.qty
                    ELSE 0
                END
            ) AS final_stock
        FROM
            product_out_documents p
        GROUP BY
            p.sku, p.barcode, p.expdate, p.location
    ),
    master_products_info AS (
        SELECT DISTINCT ON (sku) sku, name, brand FROM master_products
    )
    SELECT
        (sm.sku || '-' || sm.location || '-' || sm.expdate::text) AS id,
        sm.sku,
        COALESCE(mpi.name, '(No Master Data)'),
        sm.barcode,
        mpi.brand,
        sm.expdate,
        sm.location,
        sm.final_stock AS stock,
        CASE
            WHEN sm.final_stock <= 0 THEN 'Out of Stock'::public.product_status
            WHEN sm.location ILIKE 'SENSITIVE-MP%' THEN 'Sensitive MP'::public.product_status
            WHEN sm.location ILIKE 'MP-%' THEN 'Marketplace'::public.product_status
            WHEN sm.location ILIKE 'QUARANTINE%' THEN 'Quarantine'::public.product_status
            WHEN sm.location ILIKE 'DAMAGE%' THEN 'Damaged'::public.product_status
            WHEN sm.expdate IS NOT NULL AND sm.expdate <= NOW() THEN 'Expired'::public.product_status
            WHEN sm.expdate IS NOT NULL AND sm.expdate <= (NOW() + INTERVAL '3 month') THEN 'Expiring'::public.product_status
            ELSE 'Sellable'::public.product_status
        END AS status
    FROM
        stock_moves sm
    LEFT JOIN
        master_products_info mpi ON sm.sku = mpi.sku;
END;
$$;