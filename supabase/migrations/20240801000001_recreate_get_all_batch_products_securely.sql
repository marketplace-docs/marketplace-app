
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
        (sm.barcode || '-' || sm.location || '-' || sm.expdate)::text AS id,
        pi.sku::text,
        pi.name::text,
        sm.barcode::text,
        pi.brand::text,
        sm.expdate::date,
        sm.location::text,
        sm.total_stock,
        CASE
            WHEN sm.total_stock <= 0 THEN 'Out of Stock'
            WHEN sm.expdate <= CURRENT_DATE THEN 'Expired'
            WHEN sm.expdate <= CURRENT_DATE + interval '3 month' THEN 'Expiring'
            WHEN sm.location ILIKE '%quarantine%' THEN 'Quarantine'
            WHEN sm.location ILIKE '%damaged%' THEN 'Damaged'
            WHEN sm.location ILIKE '%MP-SENSITIF%' THEN 'Sensitive MP'
            WHEN sm.location ILIKE '%MP%' THEN 'Marketplace'
            ELSE 'Sellable'
        END::text AS status
    FROM stock_moves sm
    LEFT JOIN product_info pi ON sm.barcode = pi.barcode
    WHERE pi.sku IS NOT NULL;
END;
$$;
