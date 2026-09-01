import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, RefreshCw, Wallet, Clock, PiggyBank,
  Percent, ArrowUpRight, ArrowDownRight, Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', SAR: 'SAR', AED: 'AED',
  EGP: 'EGP', JPY: '\u00A5', INR: '\u20B9',
};

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

function formatAmount(val, symbol, compact = true) {
  if (compact) {
    if (val >= 1000000) return `${symbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${symbol}${(val / 1000).toFixed(1)}K`;
  }
  return `${symbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

// Deterministic pseudo-random stream so each bucket's detail data is stable
// across renders within a session, then jittered on each refresh tick.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seedFrom = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// ---- Simulated refreshable datasets per bucket ----

function growthData(amount, refresh) {
  const rng = mulberry32(seedFrom('growth') + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0));
  const assets = [
    { key: 'stocks', label: 'stocks', weight: 0.5, kind: 'index' },
    { key: 'bonds', label: 'bonds', weight: 0.2, kind: 'fund' },
    { key: 'crypto', label: 'crypto', weight: 0.15, kind: 'crypto' },
    { key: 'funds', label: 'funds', weight: 0.15, kind: 'fund' },
  ];
  const items = assets.map((a) => {
    const allocated = amount * a.weight;
    const basePct = (a.kind === 'crypto' ? 18 : a.kind === 'index' ? 8.5 : a.kind === 'fund' ? 6 : 4.5);
    const jitter = (rng() - 0.5) * (a.kind === 'crypto' ? 6 : 1.6);
    const pct = +(basePct + jitter).toFixed(1);
    const pl = allocated * (pct / 100);
    return { ...a, allocated, pct, pl };
  });
  const totalPl = items.reduce((s, i) => s + i.pl, 0);
  const totalPct = amount > 0 ? (totalPl / amount) * 100 : 0;
  return { items, totalPl, totalPct };
}

function expensesData(amount, baselines, refresh) {
  const rng = mulberry32(seedFrom('expenses') + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0));
  const cats = [
    { key: 'rent', label: 'rent', def: 0.45 },
    { key: 'utilities', label: 'utilities', def: 0.15 },
    { key: 'groceries', label: 'groceries', def: 0.22 },
    { key: 'subscriptions', label: 'subscriptions', def: 0.08 },
  ];
  // bill labels
  const billPool = {
    rent: ['Rent / Mortgage', 'Lease'],
    utilities: ['Electricity', 'Water', 'Internet', 'Mobile'],
    groceries: ['Supermarket', 'Groceries', 'Weekly Market'],
    subscriptions: ['Streaming', 'Cloud', 'Gym', 'Apps'],
  };
  const catsSum = cats.reduce((s, c) => s + c.def, 0);
  const items = cats.map((c) => {
    const alloc = amount * (c.def / catsSum);
    const jitter = (rng() - 0.45) * 0.12;
    const spent = alloc * (0.55 + jitter);
    const label = billPool[c.key][Math.min(billPool[c.key].length - 1, Math.floor(rng() * billPool[c.key].length))];
    return { ...c, allocated: alloc, spent, remaining: alloc - spent, transactionLabel: label };
  });
  const spent = items.reduce((s, i) => s + i.spent, 0);
  const remaining = amount - spent;
  const usedPct = amount > 0 ? (spent / amount) * 100 : 0;
  return { items, spent, remaining, usedPct };
}

function stabilityData(amount, baselineExpenses, refresh) {
  const rng = mulberry32(seedFrom('stability') + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0));
  const targetMonths = 5;
  const monthsCovered = baselineExpenses > 0 ? amount / baselineExpenses : 0;
  const targetAmount = baselineExpenses * targetMonths;
  const remaining = Math.max(targetAmount - amount, 0);
  const progress = Math.min((monthsCovered / targetMonths) * 100, 100);
  const cushion = remaining > 0 ? -remaining : amount - targetAmount; // excess beyond target
  const jut = (rng() - 0.5) * 0.0002; // micro drift
  return {
    monthsCovered: +(monthsCovered + jut).toFixed(2),
    targetMonths,
    targetAmount,
    remaining,
    progress,
    cushion: +cushion.toFixed(0),
  };
}

function joyData(amount, refresh) {
  const rng = mulberry32(seedFrom('joy') + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0));
  const goals = [
    { key: 'dining', label: 'dining', def: 0.4 },
    { key: 'entertainment', label: 'entertainment', def: 0.3 },
    { key: 'travel', label: 'travel', def: 0.2 },
    { key: 'hobbies', label: 'hobbies', def: 0.1 },
  ];
  const sum = goals.reduce((s, g) => s + g.def, 0);
  const items = goals.map((g) => {
    const alloc = amount * (g.def / sum);
    const jitter = (rng() - 0.4) * 0.2;
    const spent = alloc * Math.max(0.15, Math.min(1, 0.5 + jitter));
    return { ...g, allocated: alloc, spent, remaining: alloc - spent, spentPct: Math.round((spent / alloc) * 100) };
  });
  const remaining = amount - items.reduce((s, i) => s + i.spent, 0);
  return { items, remaining, usedPct: amount > 0 ? (items.reduce((s, i) => s + i.spent, 0) / amount) * 100 : 0 };
}

// ---- Reusable bits ----

function SegmentedBar({ segments }) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/50">
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${s.pct}%`, backgroundColor: s.color }} title={s.tooltip} />
      ))}
    </div>
  );
}

function Row({ icon: Icon, iconColor, label, sub, right, rightColor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/40 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-lg" style={{ backgroundColor: iconColor.bg }}>
          <Icon size={15} style={{ color: iconColor.fg }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{label}</p>
          {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{sub}</p>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${rightColor || 'text-gray-900 dark:text-white'}`}>{right}</p>
      </div>
    </motion.div>
  );
}

function StatChip({ icon: Icon, label, value, tone }) {
  const tones = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-500',
    neutral: 'text-gray-900 dark:text-white',
    blue: 'text-blue-600 dark:text-blue-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} className={tones[tone] || 'text-gray-400 dark:text-gray-500'} />
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      </div>
      <p className={`text-base font-extrabold tabular-nums ${tones[tone] || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

export default function BucketDetailModal({ bucket, amount, currency, language, baselineExpenses, onClose }) {
  const t = useI18n(language);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const [refreshTick, setRefreshTick] = useState(() => Date.now());
  const [live, setLive] = useState(true);

  // Simulated auto-refresh: update financial figures periodically (10 min).
  useEffect(() => {
    const id = setInterval(() => {
      setRefreshTick(Date.now());
    }, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const d = useMemo(() => {
    switch (bucket.id) {
      case 'growth': return growthData(amount, refreshTick);
      case 'essentials': return expensesData(amount, baselineExpenses, refreshTick);
      case 'stability': return stabilityData(amount, baselineExpenses, refreshTick);
      case 'rewards': return joyData(amount, refreshTick);
      default: return {};
    }
  }, [bucket.id, amount, baselineExpenses, refreshTick]);

  const lastUpdated = useCallback(() => {
    return new Date(refreshTick).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  }, [refreshTick, language]);

  const forceRefresh = useCallback(() => {
    setRefreshTick(Date.now());
    setLive(true);
  }, []);

  const Icon = bucket.icon;
  const IconColor = bucket.color;

  const renderBody = () => {
    switch (bucket.id) {
      case 'growth': {
        const up = d.totalPct >= 0;
        return (
          <div className="space-y-4">
            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.managed} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={up ? TrendingUp : TrendingDown} label={t.detail.totalPl} tone={up ? 'up' : 'down'} value={formatAmount(Math.abs(d.totalPl), symbol)} />
              <StatChip icon={Percent} label={up ? t.detail.gain : t.detail.loss} tone={up ? 'up' : 'down'} value={`${d.totalPct >= 0 ? '+' : ''}${d.totalPct.toFixed(1)}%`} />
            </div>

            {/* Allocations */}
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.detail.portfolio}</p>
              </div>
              <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700/40">
                {d.items.map((it, i) => {
                  const up = it.pl >= 0;
                  return (
                    <Row
                      key={it.key}
                      index={i}
                      icon={up ? ArrowUpRight : ArrowDownRight}
                      iconColor={{ bg: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', fg: up ? '#10b981' : '#ef4444' }}
                      label={t.detail[it.label]}
                      sub={`${t.detail.alloc} ${Math.round(it.weight * 100)}% · ${up ? '+' : ''}${it.pct.toFixed(1)}%`}
                      right={`${formatAmount(it.allocated, symbol)} · ${up ? '+' : ''}${formatAmount(it.pl, symbol)}`}
                      rightColor={up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
      case 'essentials': {
        return (
          <div className="space-y-4">
            <SegmentedBar
              segments={d.items.map((it) => ({
                pct: (it.allocated / (amount || 1)) * 100,
                color: bucket.color,
              }))}
            />
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.budget} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={Clock} label={t.detail.spent} tone="amber" value={formatAmount(d.spent, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.remaining} tone={d.remaining > 0 ? 'up' : 'down'} value={formatAmount(d.remaining, symbol)} />
            </div>
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.detail.transactions}</p>
              </div>
              <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700/40">
                {d.items.map((it, i) => (
                  <Row
                    key={it.key}
                    index={i}
                    icon={it.spent > it.allocated ? TrendingDown : TrendingUp}
                    iconColor={{ bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' }}
                    label={t.detail[it.label]}
                    sub={it.transactionLabel}
                    right={`${formatAmount(it.spent, symbol)} / ${formatAmount(it.allocated, symbol)}`}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }
      case 'stability': {
        const noBaseline = !baselineExpenses || baselineExpenses <= 0;
        const full = d.remaining <= 0 && !noBaseline;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-3">
              <div className="text-center">
                <motion.p
                  key={d.monthsCovered}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-extrabold text-gray-900 dark:text-white tabular-nums"
                >
                  {noBaseline ? '\u2014' : d.monthsCovered}
                </motion.p>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                  {t.detail.monthsCovered}
                </p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                key={Math.round(d.progress)}
                initial={{ width: 0 }}
                animate={{ width: `${d.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-blue-500"
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
              <span>0</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {t.detail.target} {d.targetMonths} {t.stability.mo}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.savedFund} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.targetFund} tone={full ? 'up' : 'blue'} value={noBaseline ? '\u2014' : formatAmount(d.targetAmount, symbol)} />
              <StatChip
                icon={full ? TrendingUp : Clock}
                label={full ? t.detail.cushion : t.detail.toTarget}
                tone={full ? 'up' : noBaseline ? 'amber' : 'down'}
                value={noBaseline ? '\u2014' : full ? `+${formatAmount(d.cushion, symbol)}` : formatAmount(d.remaining, symbol)}
              />
            </div>
            <p className={`text-xs font-medium rounded-lg px-3 py-2 ${full ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : noBaseline ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}`}>
              {full ? t.detail.fullyFundedMsg : noBaseline ? t.detail.enterExpensesMsg : t.detail.buildingMsg}
            </p>
          </div>
        );
      }
      case 'rewards': {
        return (
          <div className="space-y-4">
            <SegmentedBar
              segments={d.items.map((it) => ({
                pct: (it.allocated / (amount || 1)) * 100,
                color: bucket.color,
              }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <StatChip icon={Wallet} label={t.detail.budget} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.remaining} tone={d.remaining > 0 ? 'up' : 'down'} value={formatAmount(d.remaining, symbol)} />
            </div>
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.detail.joyGoals}</p>
              </div>
              <div className="px-4 divide-y divide-gray-100 dark:divide-gray-700/40">
                {d.items.map((it, i) => (
                  <Row
                    key={it.key}
                    index={i}
                    icon={Sparkles}
                    iconColor={{ bg: 'rgba(139,92,246,0.12)', fg: '#8b5cf6' }}
                    label={t.detail[it.label]}
                    sub={`${t.detail.used} ${it.spentPct}%`}
                    right={`${formatAmount(it.remaining, symbol)} ${t.detail.left}`}
                    rightColor="text-violet-600 dark:text-violet-400"
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-gray-200/80 dark:border-gray-700/80
            bg-white dark:bg-gray-800/95 shadow-2xl backdrop-blur-xl"
        >
          {/* Colored top accent */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${bucket.color}, transparent)` }} />

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 pt-5 pb-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.6, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `${bucket.color}1f` }}
              >
                <Icon size={20} style={{ color: IconColor }} />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{bucket.label}</h2>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${bucket.color}1f`, color: bucket.color }}>
                    {bucket.percentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatAmount(amount, symbol)} {t.detail.perMonth}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/60 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">{renderBody()}</div>

          {/* Footer: live refresh status */}
          <div className="sticky bottom-0 flex items-center justify-between px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {live ? t.detail.liveData : t.detail.stale} · {t.detail.updatedAt} {lastUpdated()} · {t.detail.autoRefresh}
            </div>
            <button
              onClick={forceRefresh}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              {t.detail.refresh}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
