import React, { useState } from 'react';
import styles from './subscription.module.css';

type SubscriptionProps = {
  isPremium: boolean;
  onUpgrade: () => void;
};

type Plan = 'gold_monthly' | 'gold_yearly';

const PLANS = {
  gold_monthly: {
    name: 'طلایی ماهانه',
    price: '۴۹,۰۰۰',
    period: 'ماه',
    saving: null,
    features: [
      'مشتریان نامحدود',
      'گزارشات پیشرفته و نمودارها',
      'بکاپ ابری خودکار',
      'یادآوری SMS',
      'چاپ فاکتور PDF',
      'پشتیبانی اولویت‌دار',
    ],
  },
  gold_yearly: {
    name: 'طلایی سالانه',
    price: '۴۴۹,۰۰۰',
    period: 'سال',
    saving: '٪۲۴ تخفیف',
    features: [
      'همه امکانات طلایی ماهانه',
      'ۺصرفه‌جویی ۱۳۹,۰۰۰ تومان',
      'پشتیبانی VIP',
      'اکانت برای ۲ دستیار',
      'گزارش سالانه کامل',
      'پشتیبانی تلفنی ۲۴/۷',
    ],
  },
};

export function Subscription({ isPremium, onUpgrade }: SubscriptionProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('gold_yearly');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isPremium) {
    return (
      <div className={styles.subscription}>
        <div className={styles.activeCard}>
          <div className={styles.activeIcon}>⭐</div>
          <h2 className={styles.activeTitle}>اشتراک طلایی فعال</h2>
          <p className={styles.activeSub}>شما به تمام امکانات ویژه دسترسی دارید</p>
          <div className={styles.expireDate}>اعتبار تا: ۱۴۰۴/۰۴/۲۶</div>
          <div className={styles.featuresList}>
            {['مشتریان نامحدود ✅', 'گزارشات پیشرفته ✅', 'بکاپ ابری خودکار ✅', 'یادآوری SMS ✅', 'چاپ فاکتور PDF ✅'].map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.subscription}>
      {/* Free Plan Status */}
      <div className={styles.freePlanCard}>
        <div className={styles.freePlanHeader}>
          <span className={styles.freePlanIcon}>🆓</span>
          <div>
            <p className={styles.freePlanTitle}>نسخه رایگان</p>
            <p className={styles.freePlanSub}>اکنون فعال است</p>
          </div>
        </div>
        <div className={styles.limitations}>
          <p className={styles.limitTitle}>محدودیت‌های نسخه رایگان:</p>
          <div className={styles.limitItem}>❌ حداکثر ۵۰ مشتری</div>
          <div className={styles.limitItem}>❌ گزارشات پایه (بدون نمودار)</div>
          <div className={styles.limitItem}>❌ بدون بکاپ ابری</div>
          <div className={styles.limitItem}>❌ بدون یادآوری SMS</div>
        </div>
      </div>

      <div className={styles.upgradeTitle}>🚀 ارتقاء به اشتراک طلایی</div>

      {/* Plan Cards */}
      <div className={styles.plansContainer}>
        {(Object.entries(PLANS) as [Plan, typeof PLANS.gold_monthly][]).map(([key, plan]) => (
          <div
            key={key}
            className={`${styles.planCard} ${selectedPlan === key ? styles.planSelected : ''} ${key === 'gold_yearly' ? styles.planRecommended : ''}`}
            onClick={() => setSelectedPlan(key)}
          >
            {key === 'gold_yearly' && <div className={styles.recommendBadge}>⚡ پیشنهاد ویژه</div>}
            {plan.saving && <div className={styles.savingBadge}>{plan.saving}</div>}
            <div className={styles.planHeader}>
              <span className={styles.planIcon}>⭐</span>
              <div>
                <p className={styles.planName}>{plan.name}</p>
                <p className={styles.planPrice}>{plan.price} <span className={styles.planPeriod}>تومان/{plan.period}</span></p>
              </div>
            </div>
            <div className={styles.planFeatures}>
              {plan.features.map(f => (
                <div key={f} className={styles.planFeatureItem}>
                  <span className={styles.checkIcon}>✅</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <div className={`${styles.selectIndicator} ${selectedPlan === key ? styles.selectIndicatorActive : ''}`}>
              {selectedPlan === key ? '● انتخاب شده' : '○ انتخاب'}
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Button */}
      <button className={styles.purchaseBtn} onClick={() => setShowConfirm(true)}>
        خرید اشتراک {PLANS[selectedPlan].name}
      </button>

      <p className={styles.secureNote}>🔒 پرداخت امن از طریق درگاه بانکی</p>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>⭐</div>
            <h3 className={styles.modalTitle}>تأیید خرید اشتراک</h3>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmRow}>
                <span>پلن:</span>
                <span>{PLANS[selectedPlan].name}</span>
              </div>
              <div className={styles.confirmRow}>
                <span>مبلغ:</span>
                <span className={styles.confirmPrice}>{PLANS[selectedPlan].price} تومان</span>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>انصراف</button>
              <button className={styles.confirmBtn} onClick={() => { onUpgrade(); setShowConfirm(false); }}>
                پرداخت و فعال‌سازی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
