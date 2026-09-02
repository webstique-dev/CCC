import React, { useState, useRef, useEffect } from 'react';
import { Plus, LogOut, User, ChevronDown, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { ConfirmationModal } from './ui';
import { useAuth } from '../context/AuthContext';

const LOGO_SRC = '/logo.png';
const CLOUDINARY_FALLBACK_LOGO = 'https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png';

export function Navbar({ onOpenUpload }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleInitiateLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy-950 text-white shadow-md border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo Only (Left Side) */}
            <div className="flex items-center shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-1 shadow-md shadow-brand-500/20 flex items-center justify-center transition-transform hover:scale-105">
                <img
                  src={LOGO_SRC}
                  onError={(e) => {
                    if (e.currentTarget.src !== CLOUDINARY_FALLBACK_LOGO) {
                      e.currentTarget.src = CLOUDINARY_FALLBACK_LOGO;
                    }
                  }}
                  alt="Cholamandal Cargo Connections Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={onOpenUpload}
                className="font-semibold shadow-lg shadow-brand-600/30 text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5"
              >
                <span className="hidden sm:inline">Add Invoice</span>
                <span className="sm:hidden">Upload</span>
              </Button>

              <div className="h-6 w-px bg-navy-800" />

              {/* User Profile with Dropdown Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-2 sm:gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl transition-all select-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${
                    dropdownOpen
                      ? 'bg-navy-900 text-white ring-1 ring-brand-500/30'
                      : 'text-slate-300 hover:bg-navy-900/80 hover:text-white'
                  }`}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  title="Account Menu"
                >
                  {/* Avatar Icon */}
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>

                  {/* Name & Role (Tablet+) */}
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[110px] md:max-w-[140px]">
                      {user?.full_name || user?.username || 'Administrator'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Administrator
                    </span>
                  </div>

                  {/* Dropdown Chevron */}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180 text-brand-400' : ''
                    }`}
                  />
                </button>

                {/* Account Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl py-2 z-50 animate-fade-in divide-y divide-slate-800/80">
                    {/* Account Header inside Dropdown */}
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-600/90 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">
                          {user?.full_name || user?.username || 'Administrator'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-300 bg-brand-950/90 px-1.5 py-0.5 rounded border border-brand-800/50">
                            <ShieldCheck className="w-2.5 h-2.5 text-brand-400" /> Admin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Menu Items */}
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={handleInitiateLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-xl transition-colors duration-150 group text-left"
                      >
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 group-hover:text-rose-300 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">Sign Out</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-rose-200/80">
                            Exit administrator session
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Reusable Confirmation Modal for Sign Out */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out of Admin Portal?"
        message="Are you sure you want to end your administrator session? You will need to sign in again to access and manage cargo invoices."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="danger"
        icon={LogOut}
        confirmIcon={LogOut}
      />
    </>
  );
}
