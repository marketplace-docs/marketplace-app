-- Hapus fungsi lama jika sudah ada untuk memastikan kita menggunakan versi terbaru
DROP FUNCTION IF EXISTS get_all_batch_products();

-- Buat ulang fungsi dengan logika yang sudah diperbaiki
CREATE OR REPLACE FUNCTION get_all_batch_products()
RETURNS TABLE(
    id TEXT,
    sku TEXT,
    name TEXT,
    barcode TEXT,
    brand TEXT,
    exp_date DATE,
    location TEXT,
    stock BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stock_moves AS (
        SELECT
            p.barcode,
            p.location,
            p.expdate,
            SUM(
                CASE
                    WHEN p.status IN (
                        'Receipt - Inbound', 'Receipt - Putaway', 'Receipt - Internal Transfer In to Warehouse', 
                        'Receipt - Update Expired', 'Receipt - Outbound Return', 'Receipt'
                    ) THEN p.qty
                    WHEN p.status IN (
                        'Issue - Order', 'Issue - Internal Transfer', 'Issue - Internal Transfer Out From Warehouse', 
                        'Issue - Internal Transfer out B2B', 'Issue - Internal Transfer out B2C', 
                        'Issue - Adjustment Manual', 'Issue - Putaway', 'Issue - Return', 'Issue - Return Putaway', 
                        'Issue - Update Expired', 'Adjustment - Loc', 'Adjusment - Loc'
                    ) THEN -p.qty
                    ELSE 0
                END
            ) AS total_stock
        FROM
            product_out_documents p
        WHERE p.location <> 'Staging Area Inbound' -- Filter utama: Jangan hitung stok di staging area
        GROUP BY
            p.barcode, p.location, p.expdate
    ),
    product_info AS (
        SELECT DISTINCT ON (barcode)
            barcode,
            sku,
            name,
            brand
        FROM
            master_products
    )
    SELECT
        (sm.barcode || '-' || sm.location || '-' || sm.expdate) AS id,
        pi.sku::TEXT,
        pi.name::TEXT,
        sm.barcode::TEXT,
        pi.brand::TEXT,
        sm.expdate::DATE,
        sm.location::TEXT,
        sm.total_stock,
        CASE
            WHEN sm.total_stock <= 0 THEN 'Out of Stock'::TEXT
            WHEN sm.expdate <= CURRENT_DATE THEN 'Expired'::TEXT
            WHEN sm.expdate <= (CURRENT_DATE + INTERVAL '9 month') THEN 'Expiring'::TEXT
            ELSE 'Sellable'::TEXT
        END AS status
    FROM
        stock_moves sm
    -- Menggunakan INNER JOIN untuk memastikan hanya produk yang ada di master_products yang ditampilkan
    INNER JOIN
        product_info pi ON sm.barcode = pi.barcode;
END;
$$ LANGUAGE plpgsql;
