import React, { useState } from 'react';
import { settingsApi } from '../src/api.js';
import styles from './settings.module.css';

type SettingsProps = { darkMode: boolean; onToggleDark: () => void; onLogout?: () => void };

const ACCENT_COLORS = ['#4A90E2', '#27AE60', '#E74C3C', '#8E44AD', '#F5A623', '#16A085'];

export function Settings({ darkMode, onToggleDark, onLogout }: SettingsProps) {
  const [profile, setProfile] = useState({
    name: 'حسین تهرانی',
    phone: '09121234567',
    address: 'تهران، بلوار میرداماد',
    specialty: 'تعمیر پکیج و کولر گازی',
  });
  const [accentColor, setAccentColor] = useState('#4A90E2');
  const [notif, setNotif]   = useState(true);
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await settingsApi.save({ accent_color: accentColor, dark_mode: darkMode ? 1 : 0, sms_reminder: notif ? 1 : 0, name: profile.name, address: profile.address, specialty: profile.specialty }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.settings}>
      {/* Profile Section */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>👤 اطلاعات تعمیرکار</h3>
        <div className={styles.avatarRow}>
          <div className={styles.avatarCircle}>🔧</div>
          <button className={styles.changeLogoBtn}>تغییر لوگو</button>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>نام و نام خانوادگی</label>
          <input className={styles.input} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>شماره تماس</label>
          <input className={styles.input} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>آدرس</label>
          <input className={styles.input} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>تخصص</label>
          <input className={styles.input} value={profile.specialty} onChange={e => setProfile(p => ({ ...p, specialty: e.target.value }))} placeholder="مثلاً: تعمیر پکیج و کولر گازی" />
        </div>
      </div>

      {/* Appearance */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>🎨 ظاهر برنامه</h3>
        <div className={styles.toggleRow}>
          <span>حالت تاریک</span>
          <button className={`${styles.toggle} ${darkMode ? styles.toggleOn : ''}`} onClick={onToggleDark}>
            <div className={styles.toggleThumb} />
          </button>
        </div>
        <div className={styles.colorSection}>
          <span className={styles.label}>رنگ اصلی برنامه</span>
          <div className={styles.colorPalette}>
            {ACCENT_COLORS.map(c => (
              <button
                key={c}
                className={`${styles.colorDot} ${accentColor === c ? styles.colorDotSelected : ''}`}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>🔔 اعلان‌ها</h3>
        <div className={styles.toggleRow}>
          <div>
            <span className={styles.toggleLabel}>یادآوری سرویس دوره‌ای</span>
            <p className={styles.toggleSub}>دریافت SMS برای سرویس بعدی</p>
          </div>
          <button className={`${styles.toggle} ${notif ? styles.toggleOn : ''}`} onClick={() => setNotif(n => !n)}>
            <div className={styles.toggleThumb} />
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>ℹ️ اطلاعات برنامه</h3>
        <div className={styles.infoRow}><span>نسخه:</span><span className={styles.infoValue}>۱.۲.۰</span></div>
        <div className={styles.infoRow}><span>توسعه‌دهنده:</span><span className={styles.infoValue}>سرویس‌یار</span></div>
        <div className={styles.infoRow}><span>سرور خارجی:</span><span style={{ color: '#27AE60', fontWeight: 700 }}>❌ استفاده نمیشه</span></div>
      </div>

      {/* Save Button */}
      <button className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`} onClick={handleSave} disabled={saving}>
        {saving ? '⏳ در حال ذخیره...' : saved ? '✅ ذخیره شد' : 'ذخیره تغییرات'}
      </button>

      {onLogout && (
        <button className={styles.logoutBtn} onClick={onLogout}>🚪 خروج از حساب</button>
      )}
    </div>
  );
}
