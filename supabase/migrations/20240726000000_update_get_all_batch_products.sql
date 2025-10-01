-- supabase/migrations/20240726000000_update_get_all_batch_products.sql

-- First, drop the existing function if it exists to ensure a clean re-creation.
DROP FUNCTION IF EXISTS public.get_all_batch_products();

-- Re-create the function with enhanced security and performance.
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
AS $$
BEGIN
    -- Set a secure search path for the function's execution context.
    -- This mitigates the risk of search path hijacking.
    SET search_path = public;

    RETURN QUERY
    WITH stock_movements AS (
        -- Calculate the net quantity for each batch based on its status.
        SELECT
            p_out.sku,
            p_out.barcode,
            p_out.location,
            p_out.expdate,
            SUM(
                CASE
                    WHEN p_out.status = ANY (ARRAY['Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse', 'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt']) THEN p_out.qty
                    WHEN p_out.status = ANY (ARRAY['Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse', 'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C', 'Issue - Adjustment Manual', 'Issue - Putaway', 'Issue - Return', 'Issue - Return Putaway', 'Issue - Update Expired', 'Adjustment - Loc']) THEN -p_out.qty
                    ELSE 0
                END
            ) AS net_stock
        FROM
            product_out_documents p_out
        WHERE
            p_out.barcode IS NOT NULL AND p_out.location IS NOT NULL AND p_out.expdate IS NOT NULL
        GROUP BY
            p_out.sku, p_out.barcode, p_out.location, p_out.expdate
    ),
    product_info AS (
        -- Get the latest product information for each SKU.
        SELECT
            mp.sku,
            mp.name,
            mp.brand,
            mp.barcode
        FROM
            master_products mp
    )
    -- Final SELECT to join movements with product info and calculate status.
    SELECT
        (m.barcode || '-' || m.location || '-' || m.expdate::text) AS id,
        m.sku,
        COALESCE(p.name, '(No Master Data)') AS name,
        m.barcode,
        COALESCE(p.brand, '(No Brand)') AS brand,
        m.expdate::text,
        m.location,
        m.net_stock AS stock,
        CASE
            WHEN m.expdate < CURRENT_DATE THEN 'Expired'
            WHEN m.expdate < (CURRENT_DATE + interval '9 months') THEN 'Expiring'
            ELSE 'Sellable'
        END AS status
    FROM
        stock_movements m
    LEFT JOIN
        product_info p ON m.sku = p.sku;
END;
$$;
