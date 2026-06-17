/**
 * سرویس‌یار - لایه API
 * تمام ارتباطات با سرور PHP از اینجا مدیریت میشه
 * هیچ سرور خارجی استفاده نمیشه - همه چیز روی هاست خودته
 */

// آدرس API - چون فرانت و بک‌اند روی یه هاست هستن، نسبی هست
const API_BASE = '/api';

// ذخیره توکن
const getToken = (): string | null => localStorage.getItem('sy_token');
const setToken = (t: string) => localStorage.setItem('sy_token', t);
const clearToken = () => localStorage.removeItem('sy_token');

// ─── درخواست پایه ────────────────────────────────────────────
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const json = await res.json();

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
  }

  return json;
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',  body: JSON.stringify(body) });
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' });

// ─── احراز هویت ──────────────────────────────────────────────
export const authApi = {
  login: async (phone: string, password: string) => {
    const res = await post<{ token: string; technician: Technician }>('/auth.php?action=login', { phone, password });
    if (res.success && res.data?.token) setToken(res.data.token);
    return res;
  },
  register: async (name: string, phone: string, password: string) => {
    const res = await post<{ token: string }>('/auth.php?action=register', { name, phone, password });
    if (res.success && res.data?.token) setToken(res.data.token);
    return res;
  },
  me:      () => get<Technician>('/auth.php?action=me'),
  profile: (data: Partial<Technician> & { new_password?: string }) => put('/auth.php?action=profile', data),
  logout:  () => { clearToken(); window.location.href = '/'; },
  isLoggedIn: () => !!getToken(),
};

// ─── مشتریان ──────────────────────────────────────────────────
export const customersApi = {
  list:   (q = '', offset = 0) => get<CustomersResponse>(`/customers.php?q=${q}&offset=${offset}`),
  get:    (id: number)         => get<Customer>(`/customers.php?id=${id}`),
  create: (data: CustomerInput) => post<Customer>('/customers.php', data),
  update: (id: number, data: CustomerInput) => put(`/customers.php?id=${id}`, data),
  delete: (id: number) => del(`/customers.php?id=${id}`),
};

// ─── سفارش‌ها ──────────────────────────────────────────────────
export const ordersApi = {
  list:   (status = 'all', date = '') => get<OrdersResponse>(`/orders.php?status=${status}&date=${date}`),
  get:    (id: number) => get<Order>(`/orders.php?id=${id}`),
  create: (data: OrderInput) => post<Order>('/orders.php', data),
  update: (id: number, data: Partial<OrderInput>) => put(`/orders.php?id=${id}`, data),
  delete: (id: number) => del(`/orders.php?id=${id}`),
};

// ─── فاکتورها ─────────────────────────────────────────────────
export const invoicesApi = {
  list:    (payStatus = 'all') => get<InvoicesResponse>(`/invoices.php?payment_status=${payStatus}`),
  get:     (id: number)        => get<Invoice>(`/invoices.php?id=${id}`),
  create:  (data: InvoiceInput) => post<Invoice>('/invoices.php', data),
  payment: (id: number, paidAmount: number, method: string, referenceCode?: string) =>
    put(`/invoices.php?id=${id}`, { paid_amount: paidAmount, method, reference_code: referenceCode }),
  delete:  (id: number) => del(`/invoices.php?id=${id}`),
};

// ─── گزارشات ─────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => get<DashboardStats>('/reports.php?type=dashboard'),
  monthly:   () => get<MonthlyRevenue[]>('/reports.php?type=monthly'),
  services:  () => get<ServiceStat[]>('/reports.php?type=services'),
  customers: () => get<TopCustomer[]>('/reports.php?type=customers'),
};

// ─── تنظیمات ─────────────────────────────────────────────────
export const settingsApi = {
  get:     () => get<SettingsResponse>('/settings.php'),
  save:    (data: SettingsInput) => put('/settings.php', data),
  upgrade: (plan: 'gold_monthly' | 'gold_yearly') => put('/settings.php?action=upgrade', { plan }),
};

// ─── تایپ‌ها ───────────────────────────────────────────────────
export type Technician = {
  id: number; name: string; phone: string;
  address?: string; specialty?: string; logo_url?: string;
  plan: 'free' | 'gold_monthly' | 'gold_yearly'; plan_expire?: string;
};

export type Customer = {
  id: number; technician_id: number; name: string; mobile: string;
  address?: string; notes?: string; created_at: string;
};

export type CustomerInput = { name: string; mobile: string; address?: string; notes?: string };

export type CustomersResponse = {
  customers: Customer[]; total: number;
  limit: number; isPremium: boolean; atLimit: boolean;
};

export type OrderStatus = 'pending' | 'inprogress' | 'completed' | 'cancelled';

export type Order = {
  id: number; customer_id: number; customer_name: string; customer_mobile: string;
  service_type: string; description?: string; visit_date: string;
  status: OrderStatus; next_service_date?: string; created_at: string;
};

export type OrderInput = {
  customer_id: number; service_type: string; description?: string;
  visit_date: string; visit_time?: string;
  status: OrderStatus; next_service_date?: string;
};

export type OrdersResponse = {
  orders: Order[];
  stats: { total: number; pending: number; inprogress: number; completed: number; cancelled: number; today: number };
};

export type InvoiceItem = { id?: number; description: string; quantity: number; unit_price: number; total_price?: number };

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type Invoice = {
  id: number; customer_id: number; customer_name: string;
  invoice_number: string; items: InvoiceItem[];
  labor_cost: number; discount: number; tax_percent: number; total_amount: number;
  payment_status: PaymentStatus; paid_amount: number; paid_at?: string; created_at: string;
};

export type InvoiceInput = {
  customer_id: number; order_id?: number;
  items: InvoiceItem[]; labor_cost: number;
  discount: number; tax_percent: number; notes?: string;
};

export type InvoicesResponse = {
  invoices: Invoice[];
  finance: { total_revenue: number; paid_revenue: number; unpaid_revenue: number; today_revenue: number; month_revenue: number };
};

export type DashboardStats = {
  customers_count: number; today_orders: number; pending_orders: number;
  daily_revenue: number; monthly_revenue: number;
  reminders: { next_service_date: string; service_type: string; customer_name: string; mobile: string }[];
  recent_orders: { id: number; service_type: string; visit_date: string; status: OrderStatus; customer_name: string }[];
  isPremium: boolean;
};

export type MonthlyRevenue  = { month_num: number; month_name: string; revenue: number; invoice_count: number };
export type ServiceStat     = { name: string; value: number };
export type TopCustomer     = { name: string; mobile: string; order_count: number; total_revenue: number };

export type SettingsInput   = { accent_color?: string; dark_mode?: number; sms_reminder?: number; invoice_prefix?: string; tax_default?: number; name?: string; address?: string; specialty?: string };
export type SettingsResponse= { settings: Record<string, unknown>; technician: Technician; isPremium: boolean; planExpire?: string };
