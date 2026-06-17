import React from 'react';
import { mockCustomers, mockOrders, mockInvoices } from '../mock-data.js';
import styles from './dashboard.module.css';

type DashboardProps = { isPremium: boolean };

export function Dashboard({ isPremium }: DashboardProps) {
  const todayOrders = mockOrders.filter(o => o.date === '1403/04/22').length + 3;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const dailyRevenue = 2_850_000;
  const monthlyRevenue = 32_400_000;
  const totalCustomers = mockCustomers.length;
  const recentOrders = mockOrders.slice(0, 5);

  const statusLabel = (s: string) => {
    if (s === 'pending') return { text: 'در انتظار', cls: styles.statusPending };
    if (s === 'inprogress') return { text: 'در حال انجام', cls: styles.statusInProgress };
    if (s === 'completed') return { text: 'تکمیل شده', cls: styles.statusCompleted };
    return { text: 'لغو شده', cls: styles.statusCancelled };
  };

  return (
    <div className={styles.dashboard}>
      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <span className={styles.statIcon}>👥</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalCustomers}</span>
            <span className={styles.statLabel}>مشتریان</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statOrange}`}>
          <span className={styles.statIcon}>📋</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{todayOrders}</span>
            <span className={styles.statLabel}>سفارش امروز</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <span className={styles.statIcon}>💰</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{(dailyRevenue / 1000).toFixed(0)}K</span>
            <span className={styles.statLabel}>درآمد امروز (تومان)</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statPurple}`}>
          <span className={styles.statIcon}>📈</span>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{(monthlyRevenue / 1_000_000).toFixed(1)}M</span>
            <span className={styles.statLabel}>درآمد ماه (تومان)</span>
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {pendingOrders > 0 && (
        <div className={styles.alertCard}>
          <span>⏳</span>
          <span><strong>{pendingOrders} سفارش</strong> در انتظار بررسی است</span>
        </div>
      )}

      {/* Premium Teaser */}
      {!isPremium && (
        <div className={styles.premiumTeaser}>
          <div className={styles.teaserContent}>
            <span className={styles.teaserIcon}>⭐</span>
            <div>
              <p className={styles.teaserTitle}>اشتراک طلایی</p>
              <p className={styles.teaserSub}>گزارشات پیشرفته + بکاپ ابری + نامحدود</p>
            </div>
          </div>
          <span className={styles.teaserArrow}>‹</span>
        </div>
      )}

      {/* Recent Orders */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>سفارش‌های اخیر</h3>
        <div className={styles.orderList}>
          {recentOrders.map(order => {
            const s = statusLabel(order.status);
            return (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderName}>{order.customerName}</span>
                  <span className={styles.orderService}>{order.serviceType}</span>
                  <span className={styles.orderDate}>{order.date}</span>
                </div>
                <span className={`${styles.statusBadge} ${s.cls}`}>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reminders */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>⏰ یادآوری سرویس</h3>
        <div className={styles.reminderCard}>
          <div className={styles.reminderRow}>
            <span>🔧</span>
            <div>
              <p className={styles.reminderName}>علی رضایی</p>
              <p className={styles.reminderDate}>سرویس بعدی: ۱۴۰۳/۰۹/۱۵</p>
            </div>
            <button className={styles.reminderBtn}>ارسال SMS</button>
          </div>
        </div>
      </div>
    </div>
  );
}
