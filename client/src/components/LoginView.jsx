import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Plane } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
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
    if (!username || !password) {
      toast.warning('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-brand-800/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <img
            src="https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png"
            alt="Cholamandal Cargo Connections Logo"
            className="inline-block w-16 h-16 object-contain rounded-2xl bg-white p-1 shadow-xl shadow-brand-600/30 mb-4"
          />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            CHOLAMANDAL CARGO CONNECTIONS
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Air Waybill & Cargo Invoice Generation Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
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
                  Sign In to Dashboard
                </Button>
              </div>
            </form>

            {/* Quick Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Demo Accounts Quick-Fill
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'admin123')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium text-center transition active:scale-95"
                >
                  <span className="block font-semibold text-white">Admin</span>
                  <span className="text-[10px] text-slate-400">admin / admin123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('operator', 'operator123')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium text-center transition active:scale-95"
                >
                  <span className="block font-semibold text-white">Operator</span>
                  <span className="text-[10px] text-slate-400">operator / operator123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('accounts', 'accounts123')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium text-center transition active:scale-95"
                >
                  <span className="block font-semibold text-white">Accounts</span>
                  <span className="text-[10px] text-slate-400">accounts / accounts123</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('operations', 'operations123')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium text-center transition active:scale-95"
                >
                  <span className="block font-semibold text-white">Operations</span>
                  <span className="text-[10px] text-slate-400">operations / operations123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
