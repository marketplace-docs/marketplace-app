-- Function to get aggregated stock from product_out_documents
-- and determine product status based on expiry date.

create or replace function get_all_batch_products()
returns table (
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
language plpgsql
as $$
declare
    nine_months_from_now date := current_date + interval '9 month';
    three_months_from_now date := current_date + interval '3 month';
begin
    return query
    with stock_moves as (
        select
            p.sku,
            p.name,
            p.barcode,
            p.brand,
            p.expdate as exp_date,
            p.location,
            case 
                when p.status in (
                    'Receipt - Inbound', 
                    'Receipt - Putaway', 
                    'Receipt - Internal Transfer In to Warehouse', 
                    'Receipt - Outbound Return', 
                    'Receipt'
                ) then p.qty
                else -p.qty
            end as quantity_change
        from product_out_documents p
        where p.location is not null and p.expdate is not null
    ),
    aggregated_stock as (
        select
            sm.sku,
            sm.name,
            sm.barcode,
            sm.brand,
            sm.exp_date,
            sm.location,
            sum(sm.quantity_change) as stock
        from stock_moves sm
        -- Filter out staging area from batch product view
        where sm.location <> 'Staging Area Inbound'
        group by sm.sku, sm.name, sm.barcode, sm.brand, sm.exp_date, sm.location
    )
    select 
        (a.sku || '-' || a.location || '-' || a.exp_date)::text as id,
        a.sku,
        a.name,
        a.barcode,
        a.brand,
        a.exp_date,
        a.location,
        a.stock,
        case
            when a.stock <= 0 then 'Out of Stock'
            when a.location ILIKE '%QUARANTINE%' or a.location ILIKE '%DAMAGE%' then 'Quarantine'
            when a.exp_date <= current_date then 'Expired'
            when a.exp_date <= three_months_from_now then 'Expired' -- consider as expired if within 3 months
            when a.exp_date <= nine_months_from_now then 'Expiring'
            else 'Sellable'
        end::text as status
    from aggregated_stock a;
end;
$$;
