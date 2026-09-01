import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getTodayFormatted() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function parseDateString(str) {
  if (!str) return null;
  const s = String(str).trim();

  // Try DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    const dt = new Date(year, month, day);
    if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day) {
      return dt;
    }
  }

  // Try YYYY-MM-DD
  m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const dt = new Date(year, month, day);
    if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day) {
      return dt;
    }
  }

  // Try DD-MMM-YYYY (e.g. 01-SEP-2024)
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  m = s.match(/^(\d{1,2})[\-\/\s]([A-Za-z]{3})[\-\/\s](\d{4})$/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const monStr = m[2].toLowerCase();
    const year = parseInt(m[3], 10);
    if (monthMap[monStr] !== undefined) {
      const month = monthMap[monStr];
      const dt = new Date(year, month, day);
      if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day) {
        return dt;
      }
    }
  }

  return null;
}

export function formatDateToDDMMYYYY(date) {
  if (!date || isNaN(date.getTime())) return '';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function DatePicker({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'DD/MM/YYYY',
  error,
  className = '',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef(null);

  // Sync or set default today
  useEffect(() => {
    if (value) {
      const parsed = parseDateString(value);
      if (parsed) {
        const formatted = formatDateToDDMMYYYY(parsed);
        setInputValue(formatted);
        setViewDate(parsed);
      } else {
        setInputValue(value);
      }
    } else {
      const today = getTodayFormatted();
      setInputValue(today);
      if (onChange) onChange(today);
      setViewDate(new Date());
    }
  }, [value]);

  // Close calendar popup on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);

    const parsed = parseDateString(text);
    if (parsed) {
      setViewDate(parsed);
      if (onChange) onChange(formatDateToDDMMYYYY(parsed));
    } else {
      if (onChange) onChange(text);
    }
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const formatted = formatDateToDDMMYYYY(newDate);
    setInputValue(formatted);
    setViewDate(newDate);
    setIsOpen(false);
    if (onChange) onChange(formatted);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10);
    setViewDate(new Date(viewDate.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value, 10);
    setViewDate(new Date(newYear, viewDate.getMonth(), 1));
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const formatted = formatDateToDDMMYYYY(today);
    setInputValue(formatted);
    setViewDate(today);
    setIsOpen(false);
    if (onChange) onChange(formatted);
  };

  // Generate day grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const selectedDate = parseDateString(inputValue);
  const isSelectedDay = (d) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    );
  };

  const isTodayDay = (d) => {
    const now = new Date();
    return (
      now.getFullYear() === year &&
      now.getMonth() === month &&
      now.getDate() === d
    );
  };

  // Year options: current year - 10 to current year + 5
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 10; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={`space-y-1 relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl font-medium bg-white border transition focus:outline-none focus:ring-2 ${
            error
              ? 'border-rose-400 bg-rose-50/60 focus:ring-rose-400'
              : 'border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-brand-500'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
        />

        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 transition"
          tabIndex={-1}
        >
          <CalendarIcon className="w-4 h-4 text-brand-600" />
        </button>
      </div>

      {error && <p className="text-[10px] font-medium text-rose-600">{error}</p>}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header Navigation */}
          <div className="flex items-center justify-between gap-1 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <select
                value={month}
                onChange={handleMonthChange}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name.slice(0, 3)}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={handleYearChange}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const isSelected = isSelectedDay(d);
              const isToday = isTodayDay(d);

              return (
                <button
                  key={`day-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg font-medium text-xs transition ${
                    isSelected
                      ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/30'
                      : isToday
                      ? 'bg-brand-50 text-brand-700 font-bold border border-brand-300'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Format: DD/MM/YYYY</span>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded-md hover:bg-brand-50 transition"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
