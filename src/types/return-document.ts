
export type ReturnDocument = {
  id: string;
  noDocument: string;
  date: string; // ISO string
  qty: number;
  status: 'Processed' | 'Pending' | 'Canceled';
  sku: string;
  barcode: string;
  brand: string;
  reason: string;
  receivedBy: string;
};
