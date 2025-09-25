

export type Order = {
  id: number; 
  reference: string;
  sku: string;
  status: 'Payment Accepted' | 'Out of Stock';
  order_date: string;
  customer: string; // This is customer name
  city: string;
  type: string;
  from: string;
  delivery_type: string;
  qty: number;
  total_stock_on_hand: number;
  location: string;
  address: string; // New field
  phone: string; // New field
};
