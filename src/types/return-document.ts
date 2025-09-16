
export type ReturnDocument = {
  id: string;
  nodocument: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending' | 'Cancelled';
  sku: string;
  barcode: string;
  brand: string;
  location: string;
  reason: string;
  receivedby: string;
};
