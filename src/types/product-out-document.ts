
export type ProductOutDocument = {
  id: number;
  nodocument: string;
  sku: string;
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
};
