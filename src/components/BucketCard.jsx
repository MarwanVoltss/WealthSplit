import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function BucketCard({ icon: Icon, label, percentage, amount, color, bgColor, borderColor, tip, tips, currency, delay = 0, language }) {
  const [expanded, setExpanded] = useState(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)' }}
      className={`group rounded-2xl border ${borderColor} shadow-sm
        bg-white dark:bg-gray-800/60 backdrop-blur-sm overflow-hidden
        hover:shadow-2xl transition-shadow duration-500 relative`}
    >
      {/* Colored top gradient accent */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className={`p-2.5 rounded-xl ${bgColor} group-hover:scale-105 transition-transform duration-300`}
            >
              <Icon size={20} style={{ color }} />
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>
                {percentage}%
              </p>
            </div>
          </div>
          <motion.p
            key={amount}
            initial={{ scale: 0.5, opacity: 0, y: -6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white"
          >
            {amount > 0 ? formatAmount(amount) : '\u2014'}
          </motion.p>
        </div>

        {/* Percentage bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, delay: delay + 0.3, ease: 'easeOut' }}
            className="h-full rounded-full relative"
            style={{ backgroundColor: color }}
          >
            <motion.div
              animate={{ x: [-100, 100] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ width: 50 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Expandable tip */}
      {(tip || tips) && (
        <div className="border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center justify-between w-full px-5 py-3 text-xs font-medium
              transition-colors duration-300 cursor-pointer
              ${expanded
                ? 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/20'}`}
          >
            <span>{expanded ? t.buckets.hideDetails : t.buckets.showDetails}</span>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronDown size={14} />
            </motion.div>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-2">
                  {tip && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 font-medium"
                      style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10 }}
                    >
                      {tip}
                    </motion.p>
                  )}
                  {tips && (
                    <ul className="space-y-1.5">
                      {tips.map((titem, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.06 }}
                          className="flex items-start gap-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
                        >
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          {titem}
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
