
export type Order = {
  id: string; 
  reference: string;
  sku: string;
  status: 'Payment Accepted' | 'Out of Stock';
  order_date: string;
  customer: string;
  city: string;
  type: string;
  from: string;
  delivery_type: string;
  qty: number;
  total_stock_on_hand: number;
  location: string;
};
