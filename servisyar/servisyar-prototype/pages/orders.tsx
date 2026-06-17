import React, { useState } from 'react';
import { mockOrders } from '../mock-data.js';
import type { Order, OrderStatus } from '../types.js';
import styles from './orders.module.css';

const SERVICE_TYPES = [
  'سرویس پکیج', 'تعمیر پکیج', 'نصب پکیج',
  'سرویس کولر گازی', 'شارژ گاز کولر', 'نصب کولر',
  'تعمیر آبگرمکن', 'سرویس آبگرمکن',
  'برق‌کاری', 'لوله‌کشی', 'تاسیسات',
  'تعمیر ماشین لباسشویی', 'تعمیر یخچال', 'سایر'
];

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '⏳ در انتظار' },
  { value: 'inprogress', label: '🔄 در حال انجام' },
  { value: 'completed', label: '✅ تکمیل شده' },
  { value: 'cancelled', label: '❌ لغو شده' },
];

export function Orders() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: '', serviceType: SERVICE_TYPES[0], date: '', status: 'pending' as OrderStatus, nextServiceDate: '' });

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  const handleAdd = () => {
    if (!form.customerName || !form.date) return;
    const newOrder: Order = {
      id: String(Date.now()),
      customerId: String(Date.now()),
      customerName: form.customerName,
      serviceType: form.serviceType,
      date: form.date,
      status: form.status,
      nextServiceDate: form.nextServiceDate || undefined,
    };
    setOrders(prev => [newOrder, ...prev]);
    setShowForm(false);
    setForm({ customerName: '', serviceType: SERVICE_TYPES[0], date: '', status: 'pending', nextServiceDate: '' });
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const statusStyle = (s: OrderStatus) => {
    const map = {
      pending: styles.statusPending,
      inprogress: styles.statusInProgress,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled,
    };
    return map[s];
  };

  const statusText = (s: OrderStatus) => {
    const map = { pending: 'در انتظار', inprogress: 'در حال انجام', completed: 'تکمیل شده', cancelled: 'لغو شده' };
    return map[s];
  };

  return (
    <div className={styles.orders}>
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {[{ v: 'all', l: 'همه' }, { v: 'pending', l: 'در انتظار' }, { v: 'inprogress', l: 'جاری' }, { v: 'completed', l: 'تکمیل' }].map(f => (
          <button
            key={f.v}
            className={`${styles.filterTab} ${filter === f.v ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.v as OrderStatus | 'all')}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button className={styles.addOrderBtn} onClick={() => setShowForm(true)}>
        + ثبت سفارش جدید
      </button>

      {/* Order List */}
      <div className={styles.list}>
        {filtered.map(order => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <span className={styles.orderName}>{order.customerName}</span>
              <span className={`${styles.statusBadge} ${statusStyle(order.status)}`}>{statusText(order.status)}</span>
            </div>
            <div className={styles.orderMeta}>
              <span>🔧 {order.serviceType}</span>
              <span>📅 {order.date}</span>
            </div>
            {order.nextServiceDate && (
              <div className={styles.nextService}>⏰ سرویس بعدی: {order.nextServiceDate}</div>
            )}
            {/* Quick Status Change */}
            <div className={styles.quickStatus}>
              {STATUS_OPTIONS.filter(s => s.value !== order.status).map(s => (
                <button key={s.value} className={styles.quickBtn} onClick={() => updateStatus(order.id, s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>ثبت سفارش جدید</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>نام مشتری</label>
              <input className={styles.input} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="نام مشتری را وارد کنید" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>نوع خدمات</label>
              <select className={styles.input} value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>تاریخ مراجعه</label>
              <input className={styles.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="مثلاً: ۱۴۰۳/۰۴/۲۵" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>وضعیت</label>
              <select className={styles.input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OrderStatus }))}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>تاریخ سرویس بعدی (اختیاری)</label>
              <input className={styles.input} value={form.nextServiceDate} onChange={e => setForm(f => ({ ...f, nextServiceDate: e.target.value }))} placeholder="مثلاً: ۱۴۰۳/۱۰/۲۵" />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>انصراف</button>
              <button className={styles.saveBtn} onClick={handleAdd}>ثبت سفارش</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
