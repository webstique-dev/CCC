import React from 'react';
import { Plane, Plus, LogOut, User, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenUpload }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-navy-950 text-white shadow-md border-b border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png"
              alt="Cholamandal Cargo Connections Logo"
              className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 shadow-md shadow-brand-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  CHOLAMANDAL CARGO CONNECTIONS
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-semibold px-2 py-0.5 bg-brand-900/60 text-brand-300 border border-brand-700/50 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-brand-400" /> IATA 14-03-8229
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Tax Invoice & Air Waybill Conversion Portal
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onOpenUpload}
              className="font-semibold shadow-lg shadow-brand-600/30"
            >
              <span className="hidden sm:inline">Add Invoice</span>
              <span className="sm:hidden">Upload</span>
            </Button>

            <div className="h-6 w-px bg-navy-800 hidden sm:block" />

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">
                  {user?.full_name || user?.username || 'Administrator'}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  Administrator
                </span>
              </div>

              <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-navy-900 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
