export interface InvoiceItem {
  quantity: number;
  description: string;
  price: number;
}

export interface Invoice {
  id: string | number;
  date: Date;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}
