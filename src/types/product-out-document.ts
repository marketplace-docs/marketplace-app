
export type ProductOutDocument = {
  id: string;
  nodocument: string;
  sku: string;
  name: string;
  barcode: string;
  expdate: string;
  qty: number;
  status: string;
  date: string;
  location: string;
  validatedby: string;
  packer_name: string | null;
  order_reference?: string;
  shipping_status?: 'Shipped' | 'Delivered' | null;
  weight?: number | null;
};
