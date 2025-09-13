
export type ReturnDocument = {
  id: string;
  noDocument: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending' | 'Cancelled';
  sku: string;
  barcode: string;
  brand: string;
  reason: string;
  receivedBy: string;
};
