
export type ReturnDocument = {
  id: string;
  no_document: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending' | 'Cancelled';
  sku: string;
  barcode: string;
  brand: string;
  reason: string;
  received_by: string;
};
