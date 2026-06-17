import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/dashboard.js';
import { Customers } from './pages/customers.js';
import { Orders } from './pages/orders.js';
import { Invoices } from './pages/invoices.js';
import { Reports } from './pages/reports.js';
import { Subscription } from './pages/subscription.js';
import { Settings } from './pages/settings.js';
import { Login } from './pages/login.js';
import { authApi, settingsApi } from './src/api.js';
import styles from './servisyar-prototype.module.css';

type Page = 'dashboard' | 'customers' | 'orders' | 'invoices' | 'reports' | 'subscription' | 'settings';

export function ServisyarPrototype() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [darkMode, setDarkMode]     = useState(false);
  const [isPremium, setIsPremium]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(authApi.isLoggedIn());
  const [loading, setLoading]       = useState(true);

  // بارگذاری تنظیمات از سرور
  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    settingsApi.get().then(res => {
      if (res.success && res.data) {
        setIsPremium(res.data.isPremium);
        setDarkMode(!!(res.data.settings as Record<string, unknown>)?.dark_mode);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isLoggedIn]);

  // ذخیره حالت تاریک در سرور
  const toggleDark = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await settingsApi.save({ dark_mode: next ? 1 : 0 });
  };

  const handleUpgrade = async (plan: 'gold_monthly' | 'gold_yearly') => {
    const res = await settingsApi.upgrade(plan);
    if (res.success) setIsPremium(true);
  };

  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'dashboard',    icon: '🏠', label: 'داشبورد' },
    { id: 'customers',    icon: '👥', label: 'مشتریان' },
    { id: 'orders',       icon: '📋', label: 'سفارش‌ها' },
    { id: 'invoices',     icon: '🧾', label: 'فاکتور' },
    { id: 'reports',      icon: '📊', label: 'گزارشات' },
    { id: 'subscription', icon: '⭐', label: 'اشتراک' },
    { id: 'settings',     icon: '⚙️', label: 'تنظیمات' },
  ];

  if (!isLoggedIn) {
    return (
      <div className={styles.light} dir="rtl">
        <Login onLogin={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.app} ${styles.light}`} dir="rtl">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '32px' }}>
          ⏳
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <Dashboard isPremium={isPremium} />;
      case 'customers':    return <Customers isPremium={isPremium} />;
      case 'orders':       return <Orders />;
      case 'invoices':     return <Invoices />;
      case 'reports':      return <Reports isPremium={isPremium} />;
      case 'subscription': return <Subscription isPremium={isPremium} onUpgrade={handleUpgrade} />;
      case 'settings':     return <Settings darkMode={darkMode} onToggleDark={toggleDark} onLogout={() => { authApi.logout(); setIsLoggedIn(false); }} />;
      default:             return <Dashboard isPremium={isPremium} />;
    }
  };

  return (
    <div className={`${styles.app} ${darkMode ? styles.dark : styles.light}`} dir="rtl">
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔧</span>
            <span className={styles.logoText}>سرویس‌یار</span>
          </div>
          {isPremium && <span className={styles.premiumBadge}>⭐ ویژه</span>}
          <button className={styles.darkToggle} onClick={toggleDark}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {renderPage()}
      </main>

      <nav className={styles.bottomNav}>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
