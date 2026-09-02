import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();

  const validateField = (field, val) => {
    if (field === 'username') {
      const trimmed = (val ?? '').trim();
      if (!trimmed) {
        return 'Admin username is required.';
      }
      if (trimmed.length < 3) {
        return 'Username must be at least 3 characters.';
      }
    }
    if (field === 'password') {
      const trimmed = val ?? '';
      if (!trimmed) {
        return 'Admin password is required.';
      }
      if (trimmed.length < 4) {
        return 'Password must be at least 4 characters.';
      }
    }
    return '';
  };

  const validateAll = (userVal, passVal) => {
    const newErrors = {};
    const uErr = validateField('username', userVal);
    const pErr = validateField('password', passVal);
    if (uErr) newErrors.username = uErr;
    if (pErr) newErrors.password = pErr;
    return newErrors;
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    if (formError) setFormError('');
    if (touched.username || errors.username) {
      const err = validateField('username', val);
      setErrors((prev) => ({ ...prev, username: err }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (formError) setFormError('');
    if (touched.password || errors.password) {
      const err = validateField('password', val);
      setErrors((prev) => ({ ...prev, password: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === 'username' ? username : password;
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationErrors = validateAll(username, password);
    setTouched({ username: true, password: true });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please enter valid login credentials.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome to Admin Portal!');
    } catch (err) {
      const msg = err.message || 'Invalid admin credentials.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrors({});
    setTouched({});
    setFormError('');
    toast.info('Admin credentials auto-filled.');
  };

  const hasUserError = !!(touched.username && errors.username);
  const hasPassError = !!(touched.password && errors.password);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow Decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header with Enhanced Large Logo */}
        <div className="text-center">
          <div className="inline-block relative mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2.5 sm:p-3 shadow-2xl shadow-brand-500/25 ring-4 ring-brand-500/20 flex items-center justify-center mx-auto transition-transform duration-300 hover:scale-105">
              <img
                src="https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png"
                alt="Cholamandal Cargo Connections Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase">
            CHOLAMANDAL CARGO CONNECTIONS
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-brand-950/80 border border-brand-800/50 rounded-full text-brand-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>Admin Authentication Portal</span>
          </div>
        </div>

        {/* Admin Login Box */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Form level error alert */}
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="flex-1 font-medium">{formError}</span>
                </div>
              )}

              {/* Username Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                      hasUserError ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={() => handleBlur('username')}
                    placeholder="Enter admin username"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm transition outline-none ${
                      hasUserError
                        ? 'bg-rose-950/20 border border-rose-500/80 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500'
                        : 'bg-slate-800/80 border border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  />
                </div>
                {hasUserError && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 font-medium animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.username}</span>
                  </p>
                )}
              </div>

              {/* Password Field with Eye Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                      hasPassError ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter admin password"
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm transition outline-none ${
                      hasPassError
                        ? 'bg-rose-950/20 border border-rose-500/80 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500'
                        : 'bg-slate-800/80 border border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    )}
                  </button>
                </div>
                {hasPassError && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1.5 font-medium animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full py-3 font-semibold shadow-lg shadow-brand-600/30"
                >
                  Sign In as Admin
                </Button>
              </div>
            </form>

            {/* Admin-Only Autofill Button */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                <span>Fill Admin Credentials</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
