import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Home, PartyPopper, Info } from 'lucide-react';
import Header from '@/components/Header';
import IncomeInput from '@/components/IncomeInput';
import DonutChart from '@/components/DonutChart';
import BucketCard from '@/components/BucketCard';
import StabilityTracker from '@/components/StabilityTracker';
import Login from '@/components/Login';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';

// Lazy-loaded: only fetched when the user actually opens a breakdown.
const BucketDetailModal = lazy(() => import('@/components/BucketDetailModal'));

function makeBuckets(t) {
  return [
    {
      id: 'growth',
      label: t.buckets.growth,
      percentage: 25,
      icon: TrendingUp,
      color: '#10b981',
      hoverColor: '#059669',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
      tip: t.buckets.growthTip,
      tips: t.buckets.growthTips,
    },
    {
      id: 'essentials',
      label: t.buckets.essentials,
      percentage: 50,
      icon: Home,
      color: '#f59e0b',
      hoverColor: '#d97706',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      borderColor: 'border-amber-200/60 dark:border-amber-800/40',
      tip: t.buckets.essentialsTip,
      tips: t.buckets.essentialsTips,
    },
    {
      id: 'stability',
      label: t.buckets.stability,
      percentage: 15,
      icon: Shield,
      color: '#3b82f6',
      hoverColor: '#2563eb',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200/60 dark:border-blue-800/40',
      tip: t.buckets.stabilityTip,
      tips: t.buckets.stabilityTips,
    },
    {
      id: 'rewards',
      label: t.buckets.joy,
      percentage: 10,
      icon: PartyPopper,
      color: '#8b5cf6',
      hoverColor: '#7c3aed',
      bgColor: 'bg-violet-50 dark:bg-violet-900/30',
      borderColor: 'border-violet-200/60 dark:border-violet-800/40',
      tip: t.buckets.joyTip,
      tips: t.buckets.joyTips,
    },
  ];
}

export default function App() {
  const { user, loading, userData, saveData, logOut } = useAuth();

  // Default settings (also the initial values before any saved data arrives)
  const DEFAULT_SETTINGS = {
    income: 0,
    baselineExpenses: 0,
    currency: 'USD',
    theme: 'light',
    language: 'en',
  };
  const saved = userData.data || DEFAULT_SETTINGS;

  const [income, setIncome] = useState(saved.income ?? 0);
  const [baselineExpenses, setBaselineExpenses] = useState(saved.baselineExpenses ?? 0);
  const [currency, setCurrency] = useState(saved.currency ?? 'USD');
  const [theme, setTheme] = useState(saved.theme ?? 'light');
  const [language, setLanguage] = useState(saved.language ?? 'en');
  const [selectedBucketId, setSelectedBucketId] = useState(null);
  const [bucketItems, setBucketItems] = useState(saved.bucketItems ?? {});

  const t = useI18n(language);

  // Sync state when the loaded user data arrives.
  // Depends on userData.data (not just the loading flip) so a demo/local restore
  // that lands after the initial default-state render still hydrates the app,
  // instead of the save effect persisting defaults over the stored profile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userData.data) {
      setIncome(userData.data.income ?? 0);
      setBaselineExpenses(userData.data.baselineExpenses ?? 0);
      setCurrency(userData.data.currency ?? 'USD');
      setTheme(userData.data.theme ?? 'light');
      setLanguage(userData.data.language ?? 'en');
      setBucketItems(userData.data.bucketItems ?? {});
    }
  }, [userData.data]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    saveData({ income, baselineExpenses, currency, theme, language, bucketItems });
  }, [income, baselineExpenses, currency, theme, language, bucketItems, saveData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Direction stays LTR (English layout) regardless of language — only text translates.
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const buckets = useCallback(() => makeBuckets(t), [t]);

  // ---- Auth gate ----
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-4 border-emerald-200 dark:border-gray-700 border-t-emerald-500"
        />
      </div>
    );
  }

  if (!user) {
    return <Login language={language} setLanguage={setLanguage} />;
  }

  const B = buckets();

  const displayBuckets = B.map((b) => ({
    ...b,
    amount: income * (b.percentage / 100),
  }));

  const stabilityAmount = income * 0.15;

  const hasData = income > 0;

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
      {/* Decorative ambient blobs (static radial gradients — no blur filter, no per-frame re-raster) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          currency={currency}
          setCurrency={setCurrency}
          language={language}
          setLanguage={setLanguage}
          user={user}
          onLogout={logOut}
        />

        <IncomeInput
          income={income}
          setIncome={setIncome}
          currency={currency}
          baselineExpenses={baselineExpenses}
          setBaselineExpenses={setBaselineExpenses}
          language={language}
        />

        {hasData ? (
          <>
            {/* Chart + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="lg:col-span-2 rounded-2xl border border-gray-200/80 dark:border-gray-700/80
                  bg-white dark:bg-gray-800/60 shadow-sm backdrop-blur-sm p-5 sm:p-6"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
                  {t.chart.heading}
                </h3>
                <DonutChart buckets={displayBuckets} currency={currency} income={income} language={language} onSelect={setSelectedBucketId} />

                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {displayBuckets.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.06 }}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {b.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Stability Tracker */}
              <div className="lg:col-span-3">
                <StabilityTracker
                  stabilityAmount={stabilityAmount}
                  baselineExpenses={baselineExpenses}
                  currency={currency}
                  language={language}
                />

                {/* Quick rule reference */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 }}
                  className="mt-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80
                    bg-white dark:bg-gray-800/60 shadow-sm backdrop-blur-sm p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={15} className="text-gray-400 dark:text-gray-500" />
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t.stability.ruleTitle}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {t.stability.ruleText}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Bucket Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayBuckets.map((b, i) => (
                <BucketCard
                  key={b.id}
                  icon={b.icon}
                  label={b.label}
                  percentage={b.percentage}
                  amount={b.amount}
                  color={b.color}
                  bgColor={b.bgColor}
                  borderColor={b.borderColor}
                  tip={b.tip}
                  tips={b.tips}
                  currency={currency}
                  language={language}
                  delay={0.05 + i * 0.05}
                  onSelect={() => setSelectedBucketId(b.id)}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center py-16 text-center relative"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-900/60 dark:to-teal-900/60
                flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6"
            >
              <motion.div whileHover={{ rotate: -10, scale: 1.1 }}>
                <TrendingUp size={36} className="text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t.empty.title}
            </h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
              {t.empty.text}
            </p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-8 mt-8 border-t border-gray-100 dark:border-gray-800/60"
        >
          <p className="text-xs text-gray-400 dark:text-gray-600">
            {t.footer} — {new Date().getFullYear()}
          </p>
        </motion.footer>
      </div>

      {/* Bucket detail modal (lazy) */}
      {selectedBucketId && (
        <Suspense fallback={null}>
          <BucketDetailModal
            bucket={B.find((b) => b.id === selectedBucketId)}
            amount={income * ((B.find((b) => b.id === selectedBucketId)?.percentage ?? 0) / 100)}
            currency={currency}
            language={language}
            baselineExpenses={baselineExpenses}
            items={bucketItems[selectedBucketId]}
            onUpdateItems={(items) => setBucketItems((prev) => ({ ...prev, [selectedBucketId]: items }))}
            onClose={() => setSelectedBucketId(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
