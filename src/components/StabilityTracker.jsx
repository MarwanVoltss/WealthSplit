import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const MILESTONES = [1, 3, 5, 6, 12];

export default function StabilityTracker({ stabilityAmount, baselineExpenses, currency, language }) {
  const t = useI18n(language);
  const CURRENCY_SYMBOLS = {
    USD: '$', EUR: '\u20AC', GBP: '\u00A3', SAR: 'SAR', AED: 'AED',
    EGP: 'EGP', JPY: '\u00A5', INR: '\u20B9',
  };
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  const formatAmount = (val) => {
    if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(1)}K`;
    return `${symbol}${val.toFixed(0)}`;
  };

  const monthsSaved = baselineExpenses > 0 ? stabilityAmount / baselineExpenses : 0;
  const targetMonths = 5;
  const progress = Math.min((monthsSaved / targetMonths) * 100, 100);
  const targetAmount = baselineExpenses * targetMonths;
  const remaining = Math.max(targetAmount - stabilityAmount, 0);

  const getStatus = () => {
    if (monthsSaved >= targetMonths) return { label: t.stability.fullyFunded, color: 'emerald', icon: CheckCircle };
    if (monthsSaved >= 3) return { label: t.stability.onTrack, color: 'blue', icon: Shield };
    return { label: t.stability.building, color: 'amber', icon: AlertTriangle };
  };

  const status = getStatus();

  const colorMap = {
    emerald: {
      chip: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      bar: 'bg-emerald-500',
      glow: '#34d399',
    },
    blue: {
      chip: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      bar: 'bg-blue-500',
      glow: '#60a5fa',
    },
    amber: {
      chip: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      bar: 'bg-amber-500',
      glow: '#fbbf24',
    },
  };

  const colors = colorMap[status.color];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/80
        bg-white dark:bg-gray-800/60 shadow-md shadow-gray-200/50 dark:shadow-black/20 backdrop-blur-sm p-5 sm:p-6
        hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/40 transition-shadow"
    >
      {/* Decorative glow (radial gradient — no blur filter) */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }} />

      <div className="flex items-center justify-between mb-5 relative">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -6 }}
            className={`p-2 rounded-lg ${colors.chip}`}
          >
            <Shield size={18} className={colors.text} />
          </motion.div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t.stability.title}</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.stability.sub}</p>
          </div>
        </div>
        <motion.div
          key={status.label}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.chip} ${colors.text}`}
        >
          <StatusIcon size={13} />
          {status.label}
        </motion.div>
      </div>

      {/* Months counter */}
      <div className="flex items-baseline gap-1.5 mb-4 relative">
        <motion.span
          key={monthsSaved.toFixed(1)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-none tabular-nums"
        >
          {baselineExpenses > 0 ? monthsSaved.toFixed(1) : '\u2014'}
        </motion.span>
        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
          {t.stability.monthsOf}
        </span>
      </div>

      {/* Progress milestones */}
      <div className="relative mb-3">
        <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full relative ${colors.bar}`}
          >
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.9, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.div>
        </div>
        <div className="flex justify-between mt-1.5 px-0.5">
          {MILESTONES.map((m) => {
            const hit = monthsSaved >= m;
            return (
              <div key={m} className="flex flex-col items-center" style={{ width: 0 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 + m * 0.03 }}
                  className={`w-2 h-2 rounded-full -mt-[17px]
                    ${hit ? `${colors.bar} ring-2 ring-white dark:ring-gray-800` : 'bg-gray-300 dark:bg-gray-600'}`}
                />
                <span className={`text-[10px] font-medium mt-1 ${hit ? colors.text : 'text-gray-400 dark:text-gray-500'}`}>
                  {m}{t.stability.mo}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
        <div>
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{t.stability.saved}</p>
          <motion.p
            key={stabilityAmount}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-bold text-gray-900 dark:text-white"
          >
            {formatAmount(stabilityAmount)}
          </motion.p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">
            {remaining > 0 ? t.stability.remaining : t.stability.targetReached}
          </p>
          <p className={`text-sm font-bold ${remaining > 0 ? 'text-gray-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {remaining > 0 ? `${formatAmount(remaining)} ${t.stability.toGo}` : formatAmount(targetAmount)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
