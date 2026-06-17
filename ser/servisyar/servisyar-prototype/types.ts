export type SubscriptionPlan = 'free' | 'gold_monthly' | 'gold_yearly';

export type Customer = {
  id: string;
  name: string;
  mobile: string;
  address: string;
  notes: string;
  createdAt: Date;
};

export type OrderStatus = 'pending' | 'inprogress' | 'completed' | 'cancelled';

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  date: string;
  status: OrderStatus;
  nextServiceDate?: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type Invoice = {
  id: string;
  orderId: string;
  customerName: string;
  items: InvoiceItem[];
  laborCost: number;
  discount: number;
  tax: number;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  paidAt?: string;
  createdAt: string;
};
