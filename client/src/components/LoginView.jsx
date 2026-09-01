import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome to Admin Portal!');
    } catch (err) {
      toast.error(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    toast.info('Admin credentials auto-filled.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Background Glow Decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <img
            src="https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png"
            alt="Cholamandal Cargo Connections Logo"
            className="inline-block w-16 h-16 object-contain rounded-2xl bg-white p-1 shadow-xl shadow-brand-600/30 mb-4"
          />
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  />
                </div>
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
