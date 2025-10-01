
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
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH stock_moves AS (
        SELECT
            p.barcode,
            p.location,
            p.expdate,
            p.sku,
            mp.name AS product_name,
            mp.brand AS product_brand,
            SUM(
                CASE
                    WHEN p.status IN (
                        'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse',
                        'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt'
                    ) THEN p.qty
                    WHEN p.status IN (
                        'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse',
                        'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C', 'Issue - Adjustment Manual',
                        'Issue - Putaway', 'Issue - Return', 'Issue - Return Putaway', 'Issue - Update Expired',
                        'Adjustment - Loc', 'Adjusment - Loc'
                    ) THEN -p.qty
                    ELSE 0
                END
            ) AS final_stock
        FROM
            product_out_documents p
        JOIN
            master_products mp ON p.sku = mp.sku
        GROUP BY
            p.barcode, p.location, p.expdate, p.sku, mp.name, mp.brand
    )
    SELECT
        (sm.barcode || '-' || sm.location || '-' || sm.expdate)::text as id,
        sm.sku::text,
        sm.product_name::text as name,
        sm.barcode::text,
        sm.product_brand::text as brand,
        sm.expdate::date as exp_date,
        sm.location::text,
        sm.final_stock::bigint as stock,
        CASE
            WHEN sm.final_stock <= 0 THEN 'Out of Stock'
            WHEN sm.location ILIKE '%%QUARANTINE%%' THEN 'Quarantine'
            WHEN sm.location ILIKE '%%DAMAGE%%' THEN 'Damaged'
            WHEN sm.location ILIKE '%%SENSITIVE%%' THEN 'Sensitive MP'
            WHEN sm.location ILIKE '%%MP%%' THEN 'Marketplace'
            WHEN sm.expdate <= NOW() THEN 'Expired'
            WHEN sm.expdate <= (NOW() + INTERVAL '3 months') THEN 'Expiring'
            ELSE 'Sellable'
        END::text AS status
    FROM
        stock_moves sm;
END;
$$;
