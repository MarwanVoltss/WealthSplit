import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, DollarSign, Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';

export default function Login({ language, setLanguage }) {
  const t = useI18n(language);
  const { signUp, logIn, recallCredentials, clearRemembered, isFirebaseConfigured } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  // Pre-fill remembered credentials so the user never has to retype them.
  useEffect(() => {
    const saved = recallCredentials();
    if (saved) {
      setEmail(saved.email || '');
      setPassword(saved.password || '');
    }
  }, [recallCredentials]);

  const mapError = (e) => {
    const code = e?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
      return t.auth.errorInvalid;
    if (code === 'auth/email-already-in-use') return t.auth.errorTaken;
    if (code === 'auth/invalid-email') return t.auth.errorInvalid;
    return t.auth.errorGeneric;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await logIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      if (!keepMeSignedIn) {
        clearRemembered();
      }
    } catch (err) {
      setError(mapError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient blobs (static radial gradients — no blur filter, no per-frame re-raster) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 70%)' }}
        />
      </div>

      {/* Language toggle */}
      <div className="absolute top-5 right-5 z-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:shadow-md transition-all"
        >
          <Languages size={16} className="text-emerald-600 dark:text-emerald-400" />
          {language === 'en' ? 'العربية' : 'English'}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
            className="relative p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/30 mb-4"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 70%)' }}
            />
            <DollarSign size={28} className="relative text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            WealthSplit
          </h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
            {t.header.subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800/60 backdrop-blur-sm shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-6 sm:p-8">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl mb-6">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                ${mode === 'login'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              {t.auth.loginBtn}
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                ${mode === 'signup'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              {t.auth.signupBtn}
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
            {mode === 'login' ? t.auth.loginSub : t.auth.signupSub}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.auth.email}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50
                  border-2 border-gray-200 dark:border-gray-700
                  focus:border-emerald-500 dark:focus:border-emerald-400
                  focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/15
                  outline-none transition-all duration-300
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.auth.password}
                className="w-full pl-11 pr-11 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-900/50
                  border-2 border-gray-200 dark:border-gray-700
                  focus:border-emerald-500 dark:focus:border-emerald-400
                  focus:ring-4 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/15
                  outline-none transition-all duration-300
                  text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepMeSignedIn}
                  onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600
                    focus:ring-emerald-500 dark:focus:ring-emerald-400 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {t.auth.keepMe}
                </span>
              </label>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-gradient-to-r from-emerald-500 to-teal-600
                text-white text-sm font-bold shadow-lg shadow-emerald-500/25
                hover:shadow-emerald-500/40 hover:brightness-105
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-300 cursor-pointer"
            >
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {submitting ? (mode === 'login' ? t.auth.loginBtn + '…' : t.auth.signupBtn + '…') : (mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn)}
            </motion.button>
          </form>

          {/* Switch link */}
          <div className="mt-5 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.auth.noAccount}{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  {t.auth.createOne}
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.auth.haveAccount}{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  {t.auth.signInInstead}
                </button>
              </p>
            )}
          </div>
        </div>

        {!isFirebaseConfigured && (
          <MickNote text={t.auth.demoNote} />
        )}
      </motion.div>
    </div>
  );
}

function MickNote({ text }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="mt-4 text-center text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2"
    >
      {text}
    </motion.p>
  );
}
