
export type PutawayDocument = {
  id: string;
  noDocument: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending';
  sku: string;
  barcode: string;
  brand: string;
  expDate: string;
  checkBy: string;
};
