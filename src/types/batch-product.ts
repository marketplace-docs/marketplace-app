
export type BatchProduct = {
    sku: string;
    barcode: string;
    brand: string;
    expDate: string;
    location: string;
    stock: number;
    status: 'Sellable' | 'Expiring' | 'Expired';
};
