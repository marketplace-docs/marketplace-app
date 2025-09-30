
export type InboundDocument = {
    id: number;
    reference: string;
    sku: string;
    barcode: string;
    brand: string;
    exp_date: string;
    qty: number;
    date: string;
    received_by: string;
    main_status: 'Assign' | 'In Progress' | 'Done';
};
