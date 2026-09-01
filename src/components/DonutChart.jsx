import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', SAR: 'SAR', AED: 'AED',
  EGP: 'EGP', JPY: '\u00A5', INR: '\u20B9',
};

function formatAmount(val, symbol) {
  if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${symbol}${(val / 1000).toFixed(1)}K`;
  return `${symbol}${val.toFixed(0)}`;
}

export default function DonutChart({ buckets, currency, income, language, onSelect }) {
  const t = useI18n(language);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = buckets.reduce((s, b) => s + b.amount, 0);
  const cx = 140, cy = 140, r = 110, strokeW = 36;
  const circumference = 2 * Math.PI * r;
  const gapDeg = 3;

  let accAngle = 0;
  const segments = buckets.map((b, i) => {
    const pct = total > 0 ? b.amount / total : b.percentage / 100;
    const angle = pct * 360;
    const startAngle = accAngle + gapDeg / 2;
    const endAngle = accAngle + angle - gapDeg / 2;
    accAngle += angle;
    const isHovered = hoveredIndex === i;
    return { ...b, pct, startAngle, endAngle, isHovered, index: i };
  });

  const arcLength = (angle) => (angle / 360) * circumference;
  const totalGapDeg = gapDeg * buckets.length;
  const usableAngle = 360 - totalGapDeg;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-center"
    >
      <div className="relative w-full max-w-[280px] aspect-square">
        <motion.svg
          viewBox="0 0 280 280"
          initial={{ rotate: -90, scale: 0.6 }}
          animate={{ rotate: -90, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full h-full"
        >
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="currentColor" strokeWidth={strokeW}
            className="text-gray-100 dark:text-gray-800" />

          {segments.map((seg) => {
            const segLen = mounted ? arcLength(seg.pct * usableAngle) : 0;
            const dashOffset = -arcLength(seg.startAngle);
            return (
              <circle
                key={seg.id}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={seg.isHovered ? seg.hoverColor : seg.color}
                strokeWidth={seg.isHovered ? strokeW + 6 : strokeW}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  opacity: total > 0 ? 1 : 0.3,
                  filter: seg.isHovered ? `drop-shadow(0 0 8px ${seg.color}55)` : 'none',
                }}
                onMouseEnter={() => setHoveredIndex(seg.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelect && onSelect(seg.id)}
              />
            );
          })}
        </motion.svg>

        <motion.div
          key={hoveredIndex ?? 'total'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          {hoveredIndex !== null ? (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                {segments[hoveredIndex].label}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold leading-none" style={{ color: segments[hoveredIndex].color }}>
                {formatAmount(segments[hoveredIndex].amount, symbol)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {segments[hoveredIndex].percentage}%
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
                {t.chart.total}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-none tabular-nums">
                {income > 0 ? formatAmount(income, symbol) : '\u2014'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{t.chart.perMonth}</p>
            </>
          )}
        </motion.div>
      </div>
      <p className="mt-3 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500">
        {t.chart.tapHint}
      </p>
    </motion.div>
  );
}
