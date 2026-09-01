import { motion } from 'framer-motion';
import { Sun, Moon, DollarSign, Languages, LogOut, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20AC', name: 'Euro' },
  { code: 'GBP', symbol: '\u00A3', name: 'British Pound' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound' },
  { code: 'JPY', symbol: '\u00A5', name: 'Japanese Yen' },
  { code: 'INR', symbol: '\u20B9', name: 'Indian Rupee' },
];

const btnBase = `
  relative flex items-center gap-2
  rounded-xl bg-white dark:bg-gray-800/80
  border border-gray-200 dark:border-gray-700
  shadow-sm hover:shadow-md
  text-sm font-semibold text-gray-700 dark:text-gray-200
  hover:border-gray-300 dark:hover:border-gray-600
  transition-all duration-300 cursor-pointer
  active:scale-95`;

export default function Header({ theme, toggleTheme, currency, setCurrency, language, setLanguage, user, onLogout }) {
  const t = useI18n(language);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 mb-8 sm:mb-10 flex-wrap"
    >
      <div className="flex items-center gap-3">
        {/* Animated logo */}
        <motion.div
          whileHover={{ rotate: -8, scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="relative p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-xl"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)' }}
          />
          <DollarSign size={24} className="relative text-white" strokeWidth={2.5} />
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
          >
            WealthSplit
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tracking-wide uppercase"
          >
            {t.header.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* User + logout */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          title={user?.email}
          className={`${btnBase} px-3 py-2 max-w-[180px]`}
          aria-label="Sign out"
        >
          <User size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="truncate text-xs max-w-[120px]">{user?.email}</span>
          <LogOut size={14} className="text-red-400 flex-shrink-0" />
        </motion.button>

        {/* Language toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className={`${btnBase} px-3 py-2`}
          aria-label="Toggle language"
        >
          <Languages size={16} className="text-emerald-600 dark:text-emerald-400" />
          {language === 'en' ? 'العربية' : 'English'}
        </motion.button>

        {/* Currency select */}
        <div className="relative">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={`appearance-none pl-8 pr-3 py-2 ${btnBase.replace('cursor-pointer', '')} cursor-pointer`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
          <DollarSign
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
        </div>

        {/* Theme toggle with rotating icon */}
        <motion.button
          whileTap={{ scale: 0.9, rotate: 180 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700
            shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer
            hover:border-gray-300 dark:hover:border-gray-600 active:scale-95"
          aria-label="Toggle theme"
        >
          <motion.div
            key={theme}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
          >
            {theme === 'light'
              ? <Sun size={18} className="text-amber-500" />
              : <Moon size={18} className="text-indigo-300" />}
          </motion.div>
        </motion.button>
      </div>
    </motion.header>
  );
}
