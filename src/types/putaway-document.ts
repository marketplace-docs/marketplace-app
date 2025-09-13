
export type PutawayDocument = {
  id: string;
  no_document: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending';
  sku: string;
  barcode: string;
  brand: string;
  exp_date: string;
  location: string;
  check_by: string;
};
