import React, { useState } from 'react';
import { authApi } from '../src/api.js';
import styles from './login.module.css';

type LoginProps = { onLogin: () => void };

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [phone, setPhone]     = useState('');
  const [name, setName]       = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!phone || !password) { setError('لطفاً تمام فیلدها رو پر کن'); return; }
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authApi.login(phone, password)
        : await authApi.register(name, phone, password);
      if (res.success) {
        onLogin();
      } else {
        setError(res.message ?? 'خطا در ورود');
      }
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon}>🔧</span>
          <h1 className={styles.appName}>سرویس‌یار</h1>
          <p className={styles.appSub}>مدیریت حرفه‌ای تعمیرکاران</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`} onClick={() => setMode('login')}>ورود</button>
          <button className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`} onClick={() => setMode('register')}>ثبت‌نام</button>
        </div>

        {mode === 'register' && (
          <div className={styles.field}>
            <label className={styles.label}>نام و نام خانوادگی</label>
            <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="حسین تهرانی" />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>شماره موبایل</label>
          <input className={styles.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="09XXXXXXXXX" dir="ltr" type="tel" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>رمز عبور</label>
          <input className={styles.input} value={password} onChange={e => setPass(e.target.value)} placeholder="حداقل ۶ کاراکتر" type="password" dir="ltr" />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'ورود به سرویس‌یار' : 'ثبت‌نام و شروع'}
        </button>

        <p className={styles.hint}>برنامه کاملاً آفلاین روی سرور شما اجرا می‌شود</p>
      </div>
    </div>
  );
}
