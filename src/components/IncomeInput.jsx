import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', SAR: 'SAR', AED: 'AED',
  EGP: 'EGP', JPY: '\u00A5', INR: '\u20B9',
};

function InputCard({ icon: Icon, iconBg, iconColor, title, sub, symbol, value, onChange, onBlur, focusBorder, focusRing, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-gray-700/80
        bg-white dark:bg-gray-800/60 shadow-md shadow-gray-200/50 dark:shadow-black/20 backdrop-blur-sm
        hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/40 transition-shadow"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: -6 }}
          className={`p-2 rounded-lg ${iconBg}`}
        >
          <Icon size={18} className={iconColor} />
        </motion.div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{sub}</p>
        </div>
      </div>
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300 dark:text-gray-600
          group-focus-within:text-gray-400 dark:group-focus-within:text-gray-500 transition-colors">
          {symbol}
        </span>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="0.00"
          className={`w-full pl-10 pr-4 py-3.5 text-2xl sm:text-3xl font-extrabold
            bg-gray-50 dark:bg-gray-900/50 rounded-xl
            border-2 border-gray-200 dark:border-gray-700
            ${focusBorder} ${focusRing}
            outline-none transition-all duration-300
            text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700
            hover:border-gray-300 dark:hover:border-gray-600`}
        />
      </div>
    </motion.div>
  );
}

export default function IncomeInput({ income, setIncome, currency, baselineExpenses, setBaselineExpenses, language }) {
  const t = useI18n(language);
  const [inputValue, setInputValue] = useState(income > 0 ? income.toString() : '');
  const [expenseValue, setExpenseValue] = useState(baselineExpenses > 0 ? baselineExpenses.toString() : '');

  useEffect(() => {
    setInputValue(income > 0 ? income.toString() : '');
  }, [income]);

  useEffect(() => {
    setExpenseValue(baselineExpenses > 0 ? baselineExpenses.toString() : '');
  }, [baselineExpenses]);

  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  const handleIncomeSubmit = () => {
    const val = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val >= 0) {
      setIncome(val);
    }
  };

  const handleExpenseSubmit = () => {
    const val = parseFloat(expenseValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(val) && val >= 0) {
      setBaselineExpenses(val);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputCard
          icon={Calculator}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={t.income.incomeTitle}
          sub={t.income.incomeSub}
          symbol={symbol}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleIncomeSubmit}
          focusBorder="focus:border-emerald-500 dark:focus:border-emerald-400"
          focusRing="focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/15"
          index={0}
        />
        <InputCard
          icon={ArrowRight}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          title={t.income.expensesTitle}
          sub={t.income.expensesSub}
          symbol={symbol}
          value={expenseValue}
          onChange={(e) => setExpenseValue(e.target.value)}
          onBlur={handleExpenseSubmit}
          focusBorder="focus:border-blue-500 dark:focus:border-blue-400"
          focusRing="focus:ring-4 focus:ring-blue-500/15 dark:focus:ring-blue-400/15"
          index={1}
        />
      </div>
    </motion.section>
  );
}
