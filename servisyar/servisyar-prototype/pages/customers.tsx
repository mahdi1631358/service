import React, { useState } from 'react';
import { mockCustomers } from '../mock-data.js';
import type { Customer } from '../types.js';
import styles from './customers.module.css';

const FREE_LIMIT = 50;

type CustomersProps = { isPremium: boolean };

export function Customers({ isPremium }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', mobile: '', address: '', notes: '' });

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.mobile.includes(search) || c.address.includes(search)
  );

  const atLimit = !isPremium && customers.length >= FREE_LIMIT;

  const openAdd = () => {
    if (atLimit) return;
    setEditCustomer(null);
    setForm({ name: '', mobile: '', address: '', notes: '' });
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditCustomer(c);
    setForm({ name: c.name, mobile: c.mobile, address: c.address, notes: c.notes });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.mobile) return;
    if (editCustomer) {
      setCustomers(prev => prev.map(c => c.id === editCustomer.id ? { ...c, ...form } : c));
    } else {
      const newC: Customer = { id: String(Date.now()), ...form, createdAt: new Date() };
      setCustomers(prev => [...prev, newC]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className={styles.customers}>
      {/* Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="جستجوی مشتری..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`${styles.addBtn} ${atLimit ? styles.addBtnDisabled : ''}`}
          onClick={openAdd}
        >
          +
        </button>
      </div>

      {/* Limit Warning */}
      {!isPremium && (
        <div className={styles.limitBar}>
          <div className={styles.limitInfo}>
            <span>مشتریان: {customers.length} / {FREE_LIMIT}</span>
            {atLimit && <span className={styles.limitWarning}>⭐ برای بیشتر، اشتراک بگیر</span>}
          </div>
          <div className={styles.limitProgress}>
            <div className={styles.limitFill} style={{ width: `${Math.min((customers.length / FREE_LIMIT) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>مشتری‌ای یافت نشد</div>
        )}
        {filtered.map(c => (
          <div key={c.id} className={styles.customerCard}>
            <div className={styles.avatar}>{c.name[0]}</div>
            <div className={styles.customerInfo}>
              <span className={styles.customerName}>{c.name}</span>
              <span className={styles.customerMobile}>📞 {c.mobile}</span>
              <span className={styles.customerAddress}>📍 {c.address}</span>
              {c.notes && <span className={styles.customerNotes}>🔧 {c.notes}</span>}
            </div>
            <div className={styles.actions}>
              <button className={styles.editBtn} onClick={() => openEdit(c)}>✏️</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{editCustomer ? 'ویرایش مشتری' : 'ثبت مشتری جدید'}</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>نام و نام خانوادگی *</label>
              <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثلاً: علی رضایی" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>شماره موبایل *</label>
              <input className={styles.input} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="09XXXXXXXXX" dir="ltr" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>آدرس</label>
              <input className={styles.input} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="آدرس کامل" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>توضیحات (نوع دستگاه)</label>
              <textarea className={styles.textarea} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="مثلاً: پکیج ایران رادیاتور مدل ۲۴۰۰۰" rows={2} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>انصراف</button>
              <button className={styles.saveBtn} onClick={handleSave}>ذخیره</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
