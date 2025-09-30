

export type BatchProduct = {
    id: string;
    sku: string;
    name: string;
    barcode: string;
    brand: string;
    exp_date: string;
    location: string;
    stock: number;
    status: 'Sellable' | 'Expiring' | 'Expired' | 'Out of Stock' | 'Quarantine' | 'Damaged' | 'Marketplace' | 'Sensitive MP';
};
