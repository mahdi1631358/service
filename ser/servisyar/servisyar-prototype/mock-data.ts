import type { Customer, Order, Invoice } from './types.js';

export const mockCustomers: Customer[] = [
  { id: '1', name: 'علی رضایی', mobile: '09121234567', address: 'تهران، خیابان ولیعصر، پلاک ۱۲', notes: 'پکیج ایران رادیاتور', createdAt: new Date('2024-01-10') },
  { id: '2', name: 'مریم احمدی', mobile: '09351234567', address: 'تهران، تجریش، کوچه بهار', notes: 'کولر گازی ال‌جی', createdAt: new Date('2024-02-15') },
  { id: '3', name: 'حسین محمدی', mobile: '09191234567', address: 'تهران، پونک، بلوار اصلی', notes: 'آبگرمکن جوتا', createdAt: new Date('2024-03-01') },
  { id: '4', name: 'فاطمه کریمی', mobile: '09011234567', address: 'تهران، نارمک، خیابان ۱۷۵', notes: 'ماشین لباسشویی', createdAt: new Date('2024-03-10') },
  { id: '5', name: 'رضا موسوی', mobile: '09301234567', address: 'تهران، شهرک غرب', notes: 'تاسیسات ساختمان', createdAt: new Date('2024-04-05') },
  { id: '6', name: 'سارا قاسمی', mobile: '09151234567', address: 'تهران، یوسف‌آباد', notes: 'کولر آبی', createdAt: new Date('2024-04-20') },
  { id: '7', name: 'محمد نجفی', mobile: '09221234567', address: 'تهران، مرزداران', notes: 'پکیج گرمایشی', createdAt: new Date('2024-05-01') },
  { id: '8', name: 'زینب صادقی', mobile: '09021234567', address: 'تهران، اکباتان', notes: 'برق‌کاری ساختمان', createdAt: new Date('2024-05-15') },
];

export const mockOrders: Order[] = [
  { id: '1', customerId: '1', customerName: 'علی رضایی', serviceType: 'سرویس پکیج', date: '1403/03/15', status: 'completed', nextServiceDate: '1403/09/15' },
  { id: '2', customerId: '2', customerName: 'مریم احمدی', serviceType: 'شارژ گاز کولر', date: '1403/04/01', status: 'completed' },
  { id: '3', customerId: '3', customerName: 'حسین محمدی', serviceType: 'تعمیر آبگرمکن', date: '1403/04/10', status: 'inprogress' },
  { id: '4', customerId: '4', customerName: 'فاطمه کریمی', serviceType: 'تعمیر ماشین لباسشویی', date: '1403/04/18', status: 'pending' },
  { id: '5', customerId: '5', customerName: 'رضا موسوی', serviceType: 'نصب رادیاتور', date: '1403/04/20', status: 'pending' },
  { id: '6', customerId: '6', customerName: 'سارا قاسمی', serviceType: 'سرویس کولر آبی', date: '1403/04/22', status: 'inprogress' },
  { id: '7', customerId: '7', customerName: 'محمد نجفی', serviceType: 'سرویس پکیج', date: '1403/04/25', status: 'pending' },
  { id: '8', customerId: '8', customerName: 'زینب صادقی', serviceType: 'برق‌کاری', date: '1403/04/05', status: 'completed' },
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001', orderId: '1', customerName: 'علی رضایی',
    items: [{ description: 'فیلتر پکیج', quantity: 1, unitPrice: 450000 }, { description: 'روغن‌کاری', quantity: 1, unitPrice: 200000 }],
    laborCost: 350000, discount: 50000, tax: 5, paymentStatus: 'paid', paidAmount: 997500, paidAt: '1403/03/15', createdAt: '1403/03/15'
  },
  {
    id: 'INV-002', orderId: '2', customerName: 'مریم احمدی',
    items: [{ description: 'گاز R22', quantity: 2, unitPrice: 380000 }],
    laborCost: 450000, discount: 0, tax: 0, paymentStatus: 'paid', paidAmount: 1210000, paidAt: '1403/04/01', createdAt: '1403/04/01'
  },
  {
    id: 'INV-003', orderId: '3', customerName: 'حسین محمدی',
    items: [{ description: 'شیر گاز', quantity: 1, unitPrice: 680000 }, { description: 'قطعات متفرقه', quantity: 1, unitPrice: 150000 }],
    laborCost: 500000, discount: 0, tax: 5, paymentStatus: 'partial', paidAmount: 700000, createdAt: '1403/04/10'
  },
  {
    id: 'INV-004', orderId: '8', customerName: 'زینب صادقی',
    items: [{ description: 'کابل برق', quantity: 10, unitPrice: 45000 }, { description: 'پریز و کلید', quantity: 5, unitPrice: 85000 }],
    laborCost: 800000, discount: 100000, tax: 0, paymentStatus: 'unpaid', createdAt: '1403/04/05'
  },
];

export const monthlyRevenueData = [
  { month: 'دی', amount: 4200000 },
  { month: 'بهمن', amount: 5800000 },
  { month: 'اسفند', amount: 3900000 },
  { month: 'فروردین', amount: 6100000 },
  { month: 'اردیبهشت', amount: 7400000 },
  { month: 'خرداد', amount: 5200000 },
];

export const serviceTypeData = [
  { name: 'سرویس پکیج', value: 35 },
  { name: 'کولر گازی', value: 25 },
  { name: 'آبگرمکن', value: 18 },
  { name: 'برق‌کاری', value: 12 },
  { name: 'لوازم خانگی', value: 10 },
];
