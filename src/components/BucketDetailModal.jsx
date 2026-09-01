import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, TrendingUp, TrendingDown, RefreshCw, Wallet, Clock, PiggyBank,
  Percent, ArrowUpRight, ArrowDownRight, Sparkles, Plus, Pencil, Trash2,
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

function uid() {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Deterministic pseudo-random stream so seeded figures stay stable across
// renders within a session, then jittered on each refresh tick.
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

// ---- Default starter items: shown until the user takes manual control ----
// growth = {id, name, kind, principal}; essentials = {id, label, category, amount};
// rewards = {id, label, amount}. On first add/edit/delete the whole list becomes the user's.

function defaultGrowthItems(t, amount) {
  return [
    { id: uid(), name: t.detail.stocks, kind: 'index', principal: Math.round(amount * 0.5) },
    { id: uid(), name: t.detail.bonds, kind: 'fund', principal: Math.round(amount * 0.2) },
    { id: uid(), name: t.detail.crypto, kind: 'crypto', principal: Math.round(amount * 0.15) },
    { id: uid(), name: t.detail.funds, kind: 'fund', principal: Math.round(amount * 0.15) },
  ];
}

function defaultEssentialsItems(t, amount) {
  return [
    { id: uid(), label: t.detail.rent, category: t.detail.rent, amount: Math.round(amount * 0.45) },
    { id: uid(), label: t.detail.utilities, category: t.detail.utilities, amount: Math.round(amount * 0.15) },
    { id: uid(), label: t.detail.groceries, category: t.detail.groceries, amount: Math.round(amount * 0.22) },
    { id: uid(), label: t.detail.subscriptions, category: t.detail.subscriptions, amount: Math.round(amount * 0.08) },
  ];
}

function defaultRewardItems(t, amount) {
  return [
    { id: uid(), label: t.detail.dining, amount: Math.round(amount * 0.4) },
    { id: uid(), label: t.detail.entertainment, amount: Math.round(amount * 0.3) },
    { id: uid(), label: t.detail.travel, amount: Math.round(amount * 0.2) },
    { id: uid(), label: t.detail.hobbies, amount: Math.round(amount * 0.1) },
  ];
}

// Seeded simulated market move for one growth asset, jittered per refresh tick.
function assetPct(name, kind, refresh) {
  const base = kind === 'crypto' ? 18 : kind === 'index' ? 8.5 : 6;
  const rng = mulberry32(
    seedFrom(`asset-${name}-${kind}`) + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0)
  );
  const jitter = (rng() - 0.5) * (kind === 'crypto' ? 6 : 1.6);
  return +(base + jitter).toFixed(2);
}

function stabilityData(amount, baselineExpenses, refresh) {
  const rng = mulberry32(seedFrom('stability') + (refresh ? Math.floor(refresh / REFRESH_INTERVAL) : 0));
  const targetMonths = 5;
  const monthsCovered = baselineExpenses > 0 ? amount / baselineExpenses : 0;
  const targetAmount = baselineExpenses * targetMonths;
  const remaining = Math.max(targetAmount - amount, 0);
  const progress = Math.min((monthsCovered / targetMonths) * 100, 100);
  const cushion = remaining > 0 ? -remaining : amount - targetAmount;
  const jut = (rng() - 0.5) * 0.0002;
  return {
    monthsCovered: +(monthsCovered + jut).toFixed(2),
    targetMonths,
    targetAmount,
    remaining,
    progress,
    cushion: +cushion.toFixed(0),
  };
}

// ---- Reusable bits ----

function ListHeader({ title, buttonLabel, onAdd, color }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40">
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-2 py-1 text-white transition-colors hover:brightness-95 cursor-pointer"
          style={{ backgroundColor: color }}
        >
          <Plus size={12} /> {buttonLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({ text, onAdd, buttonLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-6 text-center space-y-3"
    >
      <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-500 transition-colors cursor-pointer"
      >
        <Plus size={12} /> {buttonLabel}
      </button>
    </motion.div>
  );
}

function Row({ icon: Icon, iconColor, label, sub, right, rightColor, onEdit, onDelete, editLabel, deleteLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {right && <p className={`text-sm font-bold ${rightColor || 'text-gray-900 dark:text-white'}`}>{right}</p>}
        {onEdit && (
          <button
            onClick={onEdit}
            aria-label={editLabel}
            title={editLabel}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label={deleteLabel}
            title={deleteLabel}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        )}
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

function ItemForm({ language, fields, values, errors, onChange, onSave, onCancel, submitLabel }) {
  const t = useI18n(language);
  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={(e) => { e.preventDefault(); onSave(); }}
      className="mb-3 rounded-xl border border-emerald-200 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-900/10 p-3 space-y-2.5"
    >
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400">{f.label}</label>
          {f.type === 'select' ? (
            <select
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
            >
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              type={f.type || 'text'}
              inputMode={f.inputMode}
              placeholder={f.placeholder}
              value={values[f.key] || ''}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:border-emerald-500"
            />
          )}
          {errors[f.key] && <p className="text-[11px] font-medium text-red-500">{errors[f.key]}</p>}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 py-1.5 hover:bg-emerald-500 transition-colors cursor-pointer"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 text-sm font-semibold px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
        >
          {t.detail.cancel}
        </button>
      </div>
    </motion.form>
  );
}

export default function BucketDetailModal({
  bucket, amount, currency, language, baselineExpenses, items, onUpdateItems, onClose,
}) {
  const t = useI18n(language);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const [refreshTick, setRefreshTick] = useState(() => Date.now());
  const [live, setLive] = useState(true);
  const [editing, setEditing] = useState(null); // null = none; {item: null} = adding; {item} = editing
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const isTracker = bucket.id === 'stability';
  const addLabel = bucket.id === 'growth' ? t.detail.addAsset : bucket.id === 'essentials' ? t.detail.addExpense : t.detail.addGoal;

  // Simulated auto-refresh: update financial figures periodically (10 min).
  useEffect(() => {
    const id = setInterval(() => setRefreshTick(Date.now()), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const defaults = useMemo(() => {
    switch (bucket.id) {
      case 'growth': return defaultGrowthItems(t, amount);
      case 'essentials': return defaultEssentialsItems(t, amount);
      case 'rewards': return defaultRewardItems(t, amount);
      default: return [];
    }
  }, [bucket.id, t, amount]);

  const listItems = useMemo(
    () => (isTracker ? [] : (items ?? defaults)),
    [isTracker, items, defaults]
  );

  const commit = useCallback((next) => {
    onUpdateItems(next);
    setEditing(null);
    setForm({});
    setErrors({});
  }, [onUpdateItems]);

  const kindLabel = (k) => (k === 'index' ? t.detail.typeIndex : k === 'fund' ? t.detail.typeFund : t.detail.typeCrypto);

  const formFields = useMemo(() => {
    switch (bucket.id) {
      case 'growth':
        return [
          { key: 'name', label: t.detail.assetName, placeholder: t.detail.assetName },
          { key: 'kind', label: t.detail.assetType, type: 'select', options: [
            { value: 'index', label: t.detail.typeIndex },
            { value: 'fund', label: t.detail.typeFund },
            { value: 'crypto', label: t.detail.typeCrypto },
          ] },
          { key: 'principal', label: t.detail.principal, type: 'number', inputMode: 'decimal', placeholder: '0.00' },
        ];
      case 'essentials':
        return [
          { key: 'label', label: t.detail.itemName, placeholder: t.detail.itemName },
          { key: 'category', label: t.detail.category, placeholder: t.detail.category },
          { key: 'amount', label: t.detail.amountField, type: 'number', inputMode: 'decimal', placeholder: '0.00' },
        ];
      case 'rewards':
        return [
          { key: 'label', label: t.detail.itemName, placeholder: t.detail.itemName },
          { key: 'amount', label: t.detail.amountField, type: 'number', inputMode: 'decimal', placeholder: '0.00' },
        ];
      default:
        return [];
    }
  }, [bucket.id, t]);

  const validate = (values) => {
    const errs = {};
    const nameKey = bucket.id === 'growth' ? 'name' : 'label';
    const amountKey = bucket.id === 'growth' ? 'principal' : 'amount';
    if (!values[nameKey]?.trim()) errs[nameKey] = t.detail.itemName;
    const num = parseFloat(values[amountKey]);
    if (!(num > 0)) errs[amountKey] = t.detail.amountField;
    return errs;
  };

  const startAdd = () => {
    setEditing({ item: null });
    setForm(bucket.id === 'growth' ? { kind: 'index' } : {});
    setErrors({});
  };

  const startEdit = (item) => {
    setEditing({ item });
    setForm({ ...item });
    setErrors({});
  };

  const cancelForm = () => {
    setEditing(null);
    setForm({});
    setErrors({});
  };

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editing?.item === null) {
      const base = { id: uid() };
      const item = bucket.id === 'growth'
        ? { ...base, name: form.name.trim(), kind: form.kind || 'index', principal: parseFloat(form.principal) }
        : bucket.id === 'essentials'
          ? { ...base, label: form.label.trim(), category: (form.category || '').trim() || form.label.trim(), amount: parseFloat(form.amount) }
          : { ...base, label: form.label.trim(), amount: parseFloat(form.amount) };
      commit([...listItems, item]);
    } else if (editing?.item) {
      const next = listItems.map((it) => {
        if (it.id !== editing.item.id) return it;
        if (bucket.id === 'growth') return { ...it, name: form.name.trim(), kind: form.kind || it.kind, principal: parseFloat(form.principal) };
        if (bucket.id === 'essentials') return { ...it, label: form.label.trim(), category: (form.category || '').trim() || form.label.trim(), amount: parseFloat(form.amount) };
        return { ...it, label: form.label.trim(), amount: parseFloat(form.amount) };
      });
      commit(next);
    }
  };

  const handleDelete = (item) => {
    commit(listItems.filter((it) => it.id !== item.id));
  };

  // ---- Per-bucket computations ----
  const growth = useMemo(() => {
    if (bucket.id !== 'growth') return null;
    const rows = listItems.map((it) => {
      const pct = assetPct(it.name, it.kind, refreshTick);
      const value = it.principal * (1 + pct / 100);
      return { ...it, pct, value, pl: value - it.principal };
    });
    const invested = rows.reduce((s, i) => s + i.principal, 0);
    const pl = rows.reduce((s, i) => s + i.pl, 0);
    const pct = invested > 0 ? (pl / invested) * 100 : 0;
    return { rows, invested, pl, pct };
  }, [bucket.id, listItems, refreshTick]);

  const expenses = useMemo(() => {
    if (bucket.id !== 'essentials') return null;
    const spent = listItems.reduce((s, i) => s + (+i.amount || 0), 0);
    const remaining = amount - spent;
    const usedPct = amount > 0 ? (spent / amount) * 100 : 0;
    return { rows: listItems, spent, remaining, usedPct };
  }, [bucket.id, listItems, amount]);

  const rewards = useMemo(() => {
    if (bucket.id !== 'rewards') return null;
    const spent = listItems.reduce((s, i) => s + (+i.amount || 0), 0);
    const remaining = amount - spent;
    const usedPct = amount > 0 ? (spent / amount) * 100 : 0;
    return { rows: listItems, spent, remaining, usedPct };
  }, [bucket.id, listItems, amount]);

  const stability = useMemo(() => {
    if (bucket.id !== 'stability') return null;
    return stabilityData(amount, baselineExpenses, refreshTick);
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
        const up = growth.pct >= 0;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.investedLabel} tone="neutral" value={formatAmount(growth.invested, symbol)} />
              <StatChip icon={up ? TrendingUp : TrendingDown} label={t.detail.totalPl} tone={up ? 'up' : 'down'} value={`${up ? '+' : '-'}${formatAmount(Math.abs(growth.pl), symbol)}`} />
              <StatChip icon={Percent} label={up ? t.detail.gain : t.detail.loss} tone={up ? 'up' : 'down'} value={`${up ? '+' : ''}${growth.pct.toFixed(1)}%`} />
            </div>
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <ListHeader
                title={t.detail.portfolio}
                buttonLabel={t.detail.addAsset}
                onAdd={editing ? null : startAdd}
                color={bucket.color}
              />
              <div className="px-4 pb-3">
                {editing?.item === null && (
                  <AnimatePresence initial={false}>
                    <ItemForm
                      language={language}
                      fields={formFields}
                      values={form}
                      errors={errors}
                      onChange={handleChange}
                      onSave={handleSave}
                      onCancel={cancelForm}
                      submitLabel={addLabel}
                    />
                  </AnimatePresence>
                )}
                {growth.rows.length === 0 ? (
                  <EmptyState text={t.detail.emptyList} onAdd={startAdd} buttonLabel={t.detail.addAsset} />
                ) : (
                  growth.rows.map((it) => {
                    const rowUp = it.pl >= 0;
                    const isEditing = editing?.item?.id === it.id;
                    return (
                      <div key={it.id}>
                        <Row
                          icon={rowUp ? ArrowUpRight : ArrowDownRight}
                          iconColor={{ bg: rowUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', fg: rowUp ? '#10b981' : '#ef4444' }}
                          label={it.name}
                          sub={`${kindLabel(it.kind)} \u00B7 ${rowUp ? '+' : ''}${it.pct.toFixed(1)}%`}
                          right={`${formatAmount(it.value, symbol)} \u00B7 ${rowUp ? '+' : ''}${formatAmount(it.pl, symbol)}`}
                          rightColor={rowUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}
                          onEdit={() => startEdit(it)}
                          onDelete={() => handleDelete(it)}
                          editLabel={`${t.detail.editItem} ${it.name}`}
                          deleteLabel={`${t.detail.deleteItem} ${it.name}`}
                        />
                        {isEditing && (
                          <AnimatePresence initial={false}>
                            <ItemForm
                              language={language}
                              fields={formFields}
                              values={form}
                              errors={errors}
                              onChange={handleChange}
                              onSave={handleSave}
                              onCancel={cancelForm}
                              submitLabel={t.detail.save}
                            />
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      }
      case 'essentials': {
        const over = expenses.usedPct > 100;
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <ListHeader
                title={t.detail.transactions}
                buttonLabel={t.detail.addExpense}
                onAdd={editing ? null : startAdd}
                color={bucket.color}
              />
              <div className="px-4 pb-3">
                {editing?.item === null && (
                  <AnimatePresence initial={false}>
                    <ItemForm
                      language={language}
                      fields={formFields}
                      values={form}
                      errors={errors}
                      onChange={handleChange}
                      onSave={handleSave}
                      onCancel={cancelForm}
                      submitLabel={addLabel}
                    />
                  </AnimatePresence>
                )}
                {expenses.rows.length === 0 ? (
                  <EmptyState text={t.detail.emptyList} onAdd={startAdd} buttonLabel={t.detail.addExpense} />
                ) : (
                  expenses.rows.map((it) => {
                    const isEditing = editing?.item?.id === it.id;
                    return (
                      <div key={it.id}>
                        <Row
                          icon={it.amount > amount / (expenses.rows.length || 1) ? TrendingDown : TrendingUp}
                          iconColor={{ bg: 'rgba(245,158,11,0.12)', fg: '#f59e0b' }}
                          label={it.label}
                          sub={it.category}
                          right={formatAmount(it.amount, symbol)}
                          rightColor={it.amount > amount / (expenses.rows.length || 1) ? 'text-amber-600 dark:text-amber-400' : undefined}
                          onEdit={() => startEdit(it)}
                          onDelete={() => handleDelete(it)}
                          editLabel={`${t.detail.editItem} ${it.label}`}
                          deleteLabel={`${t.detail.deleteItem} ${it.label}`}
                        />
                        {isEditing && (
                          <AnimatePresence initial={false}>
                            <ItemForm
                              language={language}
                              fields={formFields}
                              values={form}
                              errors={errors}
                              onChange={handleChange}
                              onSave={handleSave}
                              onCancel={cancelForm}
                              submitLabel={t.detail.save}
                            />
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.budget} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={Clock} label={t.detail.spent} tone="amber" value={formatAmount(expenses.spent, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.remaining} tone={expenses.remaining > 0 ? 'up' : 'down'} value={formatAmount(expenses.remaining, symbol)} />
            </div>
            {over && (
              <p className="text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {`${t.detail.used} ${Math.round(expenses.usedPct)}%\u2014${t.detail.spent} exceeds ${t.detail.budget}`}
              </p>
            )}
          </div>
        );
      }
      case 'rewards': {
        const over = rewards.usedPct > 100;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <StatChip icon={Wallet} label={t.detail.budget} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.remaining} tone={rewards.remaining > 0 ? 'up' : 'down'} value={formatAmount(rewards.remaining, symbol)} />
            </div>
            <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-white dark:bg-gray-800/40 overflow-hidden">
              <ListHeader
                title={t.detail.joyGoals}
                buttonLabel={t.detail.addGoal}
                onAdd={editing ? null : startAdd}
                color={bucket.color}
              />
              <div className="px-4 pb-3">
                {editing?.item === null && (
                  <AnimatePresence initial={false}>
                    <ItemForm
                      language={language}
                      fields={formFields}
                      values={form}
                      errors={errors}
                      onChange={handleChange}
                      onSave={handleSave}
                      onCancel={cancelForm}
                      submitLabel={addLabel}
                    />
                  </AnimatePresence>
                )}
                {rewards.rows.length === 0 ? (
                  <EmptyState text={t.detail.emptyList} onAdd={startAdd} buttonLabel={t.detail.addGoal} />
                ) : (
                  rewards.rows.map((it) => {
                    const isEditing = editing?.item?.id === it.id;
                    return (
                      <div key={it.id}>
                        <Row
                          icon={Sparkles}
                          iconColor={{ bg: 'rgba(139,92,246,0.12)', fg: '#8b5cf6' }}
                          label={it.label}
                          sub={`${t.detail.used} ${amount > 0 ? Math.round((it.amount / amount) * 100) : 0}%`}
                          right={`${formatAmount(it.amount, symbol)} ${t.detail.left}`}
                          rightColor="text-violet-600 dark:text-violet-400"
                          onEdit={() => startEdit(it)}
                          onDelete={() => handleDelete(it)}
                          editLabel={`${t.detail.editItem} ${it.label}`}
                          deleteLabel={`${t.detail.deleteItem} ${it.label}`}
                        />
                        {isEditing && (
                          <AnimatePresence initial={false}>
                            <ItemForm
                              language={language}
                              fields={formFields}
                              values={form}
                              errors={errors}
                              onChange={handleChange}
                              onSave={handleSave}
                              onCancel={cancelForm}
                              submitLabel={t.detail.save}
                            />
                          </AnimatePresence>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {over && (
              <p className="text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {`${t.detail.used} ${Math.round(rewards.usedPct)}%\u2014${t.detail.spent} exceeds ${t.detail.budget}`}
              </p>
            )}
          </div>
        );
      }
      case 'stability': {
        const noBaseline = !baselineExpenses || baselineExpenses <= 0;
        const full = stability.remaining <= 0 && !noBaseline;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center py-3">
              <div className="text-center">
                <motion.p
                  key={stability.monthsCovered}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-extrabold text-gray-900 dark:text-white tabular-nums"
                >
                  {noBaseline ? '\u2014' : stability.monthsCovered}
                </motion.p>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                  {t.detail.monthsCovered}
                </p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
              <motion.div
                key={Math.round(stability.progress)}
                initial={{ width: 0 }}
                animate={{ width: `${stability.progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-blue-500"
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500">
              <span>0</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {t.detail.target} {stability.targetMonths} {t.stability.mo}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatChip icon={Wallet} label={t.detail.savedFund} tone="neutral" value={formatAmount(amount, symbol)} />
              <StatChip icon={PiggyBank} label={t.detail.targetFund} tone={full ? 'up' : 'blue'} value={noBaseline ? '\u2014' : formatAmount(stability.targetAmount, symbol)} />
              <StatChip
                icon={full ? TrendingUp : Clock}
                label={full ? t.detail.cushion : t.detail.toTarget}
                tone={full ? 'up' : noBaseline ? 'amber' : 'down'}
                value={noBaseline ? '\u2014' : full ? `+${formatAmount(stability.cushion, symbol)}` : formatAmount(stability.remaining, symbol)}
              />
            </div>
            <p className={`text-xs font-medium rounded-lg px-3 py-2 ${full ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : noBaseline ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}`}>
              {full ? t.detail.fullyFundedMsg : noBaseline ? t.detail.enterExpensesMsg : t.detail.buildingMsg}
            </p>
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
              {`${live ? t.detail.liveData : t.detail.stale} \u00B7 ${t.detail.updatedAt} ${lastUpdated()} \u00B7 ${t.detail.autoRefresh}`}
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