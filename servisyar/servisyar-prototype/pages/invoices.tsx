import React, { useState } from 'react';
import { mockInvoices } from '../mock-data.js';
import type { Invoice, InvoiceItem, PaymentStatus } from '../types.js';
import styles from './invoices.module.css';

function calcTotal(invoice: Invoice): number {
  const itemsTotal = invoice.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const subtotal = itemsTotal + invoice.laborCost;
  const afterDiscount = subtotal - invoice.discount;
  return afterDiscount + (afterDiscount * invoice.tax) / 100;
}

const PAYMENT_STATUS: Record<PaymentStatus, { label: string; cls: string }> = {
  paid: { label: '✅ پرداخت شده', cls: 'paid' },
  unpaid: { label: '❌ پرداخت نشده', cls: 'unpaid' },
  partial: { label: '🔸 پرداخت ناقص', cls: 'partial' },
};

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [payFilter, setPayFilter] = useState<PaymentStatus | 'all'>('all');

  const [form, setForm] = useState({
    customerName: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as InvoiceItem[],
    laborCost: 0,
    discount: 0,
    tax: 0,
  });

  const filtered = invoices.filter(i => payFilter === 'all' || i.paymentStatus === payFilter);

  const previewTotal = (() => {
    const itemsTotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const subtotal = itemsTotal + form.laborCost;
    const afterDiscount = subtotal - form.discount;
    return afterDiscount + (afterDiscount * form.tax) / 100;
  })();

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unitPrice: 0 }] }));

  const handleCreate = () => {
    if (!form.customerName) return;
    const inv: Invoice = {
      id: `INV-${String(Date.now()).slice(-3)}`,
      orderId: String(Date.now()),
      customerName: form.customerName,
      items: form.items,
      laborCost: form.laborCost,
      discount: form.discount,
      tax: form.tax,
      paymentStatus: 'unpaid',
      createdAt: '۱۴۰۳/۰۴/۲۶',
    };
    setInvoices(prev => [inv, ...prev]);
    setShowCreate(false);
  };

  const markPaid = (id: string) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, paymentStatus: 'paid', paidAt: '۱۴۰۳/۰۴/۲۶' } : i));
    setSelected(null);
  };

  return (
    <div className={styles.invoices}>
      {/* Filter */}
      <div className={styles.filterTabs}>
        {[{ v: 'all', l: 'همه' }, { v: 'unpaid', l: 'پرداخت نشده' }, { v: 'partial', l: 'ناقص' }, { v: 'paid', l: 'پرداخت شده' }].map(f => (
          <button key={f.v} className={`${styles.tab} ${payFilter === f.v ? styles.tabActive : ''}`} onClick={() => setPayFilter(f.v as PaymentStatus | 'all')}>{f.l}</button>
        ))}
      </div>

      <button className={styles.createBtn} onClick={() => setShowCreate(true)}>+ ایجاد فاکتور جدید</button>

      {/* Invoice List */}
      <div className={styles.list}>
        {filtered.map(inv => {
          const total = calcTotal(inv);
          const ps = PAYMENT_STATUS[inv.paymentStatus];
          return (
            <div key={inv.id} className={styles.invoiceCard} onClick={() => setSelected(inv)}>
              <div className={styles.invHeader}>
                <div>
                  <span className={styles.invId}>{inv.id}</span>
                  <span className={styles.invCustomer}>{inv.customerName}</span>
                </div>
                <span className={`${styles.payBadge} ${styles[ps.cls]}`}>{ps.label}</span>
              </div>
              <div className={styles.invMeta}>
                <span>📅 {inv.createdAt}</span>
                <span className={styles.invTotal}>{total.toLocaleString('fa')} تومان</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Detail Modal */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.invoiceHeader}>
              <div className={styles.invoiceLogo}>🔧 سرویس‌یار</div>
              <div className={styles.invoiceIdBig}>{selected.id}</div>
            </div>
            <div className={styles.invoiceCustomerRow}>
              <span className={styles.invoiceLabel}>مشتری:</span>
              <span className={styles.invoiceValue}>{selected.customerName}</span>
            </div>
            <div className={styles.invoiceCustomerRow}>
              <span className={styles.invoiceLabel}>تاریخ:</span>
              <span className={styles.invoiceValue}>{selected.createdAt}</span>
            </div>
            <table className={styles.itemTable}>
              <thead><tr><th>شرح</th><th>تعداد</th><th>واحد</th><th>جمع</th></tr></thead>
              <tbody>
                {selected.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice.toLocaleString('fa')}</td>
                    <td>{(item.quantity * item.unitPrice).toLocaleString('fa')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.totalsSection}>
              <div className={styles.totalRow}><span>اجرت:</span><span>{selected.laborCost.toLocaleString('fa')} تومان</span></div>
              {selected.discount > 0 && <div className={`${styles.totalRow} ${styles.discount}`}><span>تخفیف:</span><span>-{selected.discount.toLocaleString('fa')} تومان</span></div>}
              {selected.tax > 0 && <div className={styles.totalRow}><span>مالیات ({selected.tax}٪):</span><span>{(calcTotal(selected) - (calcTotal(selected) / (1 + selected.tax / 100))).toLocaleString('fa')} تومان</span></div>}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}><span>جمع کل:</span><span>{calcTotal(selected).toLocaleString('fa')} تومان</span></div>
            </div>
            <div className={styles.payStatus}>
              <span className={`${styles.payBadge} ${styles[PAYMENT_STATUS[selected.paymentStatus].cls]}`}>{PAYMENT_STATUS[selected.paymentStatus].label}</span>
              {selected.paidAt && <span className={styles.paidDate}>در تاریخ {selected.paidAt}</span>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setSelected(null)}>بستن</button>
              {selected.paymentStatus !== 'paid' && (
                <button className={styles.paidBtn} onClick={() => markPaid(selected.id)}>ثبت پرداخت</button>
              )}
              <button className={styles.printBtn}>🖨️ چاپ PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>ایجاد فاکتور</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>نام مشتری</label>
              <input className={styles.input} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="نام مشتری" />
            </div>
            <div className={styles.sectionLabel}>اقلام خدمات</div>
            {form.items.map((item, i) => (
              <div key={i} className={styles.itemRow}>
                <input className={styles.inputSmall} value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="شرح خدمت" />
                <input className={styles.inputTiny} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                <input className={styles.inputSmall} type="number" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} placeholder="قیمت واحد" />
              </div>
            ))}
            <button className={styles.addItemBtn} onClick={addItem}>+ افزودن قلم</button>
            <div className={styles.twoCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>اجرت (تومان)</label>
                <input className={styles.input} type="number" value={form.laborCost} onChange={e => setForm(f => ({ ...f, laborCost: Number(e.target.value) }))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>تخفیف (تومان)</label>
                <input className={styles.input} type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>مالیات (%)</label>
              <input className={styles.input} type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: Number(e.target.value) }))} />
            </div>
            <div className={styles.totalPreview}>جمع کل: <strong>{previewTotal.toLocaleString('fa')} تومان</strong></div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowCreate(false)}>انصراف</button>
              <button className={styles.saveBtn} onClick={handleCreate}>ذخیره فاکتور</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
