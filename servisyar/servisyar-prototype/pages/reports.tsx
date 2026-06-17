import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { monthlyRevenueData, serviceTypeData, mockInvoices, mockCustomers } from '../mock-data.js';
import styles from './reports.module.css';

const COLORS = ['#4A90E2', '#27AE60', '#F5A623', '#8E44AD', '#E74C3C'];

type ReportsProps = { isPremium: boolean };

function PremiumLock({ feature }: { feature: string }) {
  return (
    <div className={styles.lockCard}>
      <span className={styles.lockIcon}>🔒</span>
      <p className={styles.lockTitle}>{feature}</p>
      <p className={styles.lockSub}>این قابلیت مخصوص کاربران ویژه است</p>
      <button className={styles.upgradeBtn}>⭐ ارتقاء به طلایی</button>
    </div>
  );
}

export function Reports({ isPremium }: ReportsProps) {
  const [period, setPeriod] = useState<'daily' | 'monthly'>('monthly');

  const totalRevenue = monthlyRevenueData.reduce((s, d) => s + d.amount, 0);
  const totalOrders = 47;
  const topCustomers = mockCustomers.slice(0, 3).map((c, i) => ({ ...c, orderCount: 8 - i * 2, revenue: (3 - i) * 1_200_000 }));

  return (
    <div className={styles.reports}>
      {/* Period Toggle */}
      <div className={styles.periodToggle}>
        <button className={`${styles.periodBtn} ${period === 'daily' ? styles.periodActive : ''}`} onClick={() => setPeriod('daily')}>روزانه</button>
        <button className={`${styles.periodBtn} ${period === 'monthly' ? styles.periodActive : ''}`} onClick={() => setPeriod('monthly')}>ماهانه</button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>💰</span>
          <span className={styles.summaryValue}>{(totalRevenue / 1_000_000).toFixed(1)}M</span>
          <span className={styles.summaryLabel}>درآمد کل (تومان)</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>📋</span>
          <span className={styles.summaryValue}>{totalOrders}</span>
          <span className={styles.summaryLabel}>تعداد سفارش</span>
        </div>
      </div>

      {/* Revenue Bar Chart */}
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>نمودار درآمد ماهانه (تومان)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'inherit' }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
            <Tooltip formatter={(v: number) => [`${v.toLocaleString('fa')} تومان`, 'درآمد']} />
            <Bar dataKey="amount" fill="#4A90E2" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Service Type Pie — Premium */}
      <div className={styles.chartCard}>
        <h4 className={styles.chartTitle}>توزیع نوع خدمات</h4>
        {isPremium ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={serviceTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}٪`}>
                  {serviceTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <PremiumLock feature="نمودار توزیع خدمات" />
        )}
      </div>

      {/* Top Customers — Premium */}
      <div className={styles.section}>
        <h4 className={styles.chartTitle}>🏆 مشتریان برتر</h4>
        {isPremium ? (
          <div className={styles.topCustomerList}>
            {topCustomers.map((c, i) => (
              <div key={c.id} className={styles.topCustomerRow}>
                <span className={styles.rank}>{i + 1}</span>
                <div className={styles.topCustomerInfo}>
                  <span className={styles.topName}>{c.name}</span>
                  <span className={styles.topSub}>{c.orderCount} سفارش</span>
                </div>
                <span className={styles.topRevenue}>{c.revenue.toLocaleString('fa')} تومان</span>
              </div>
            ))}
          </div>
        ) : (
          <PremiumLock feature="مشتریان برتر" />
        )}
      </div>

      {/* Cloud Backup — Premium */}
      <div className={`${styles.section} ${styles.backupSection}`}>
        <h4 className={styles.chartTitle}>☁️ بکاپ ابری</h4>
        {isPremium ? (
          <div className={styles.backupCard}>
            <span>✅ آخرین بکاپ: امروز ساعت ۰۸:۳۰</span>
            <button className={styles.backupBtn}>بکاپ الآن</button>
          </div>
        ) : (
          <PremiumLock feature="بکاپ ابری خودکار" />
        )}
      </div>
    </div>
  );
}
