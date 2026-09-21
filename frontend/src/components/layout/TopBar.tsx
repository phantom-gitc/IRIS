import React from 'react';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { useRealtimeStore } from '../../stores/realtime.store';

interface TopBarProps {
  onOpenCommandBar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandBar }) => {
  const { theme, toggleTheme, setCommandBarOpen } = useUIStore();
  const { connectionState } = useRealtimeStore();
  const isDark = theme === 'dark';

  const handleSearchClick = () => {
    if (onOpenCommandBar) onOpenCommandBar();
    setCommandBarOpen(true);
  };

  return (
    <header className="w-full h-14 px-8 flex items-center justify-between z-20 shrink-0">
      {/* Search Input Pill */}
      <button
        onClick={handleSearchClick}
        className={`w-72 h-9 px-4 rounded-full border text-xs flex items-center justify-between transition group shadow-sm ${
          isDark
            ? 'bg-slate-900/60 hover:bg-slate-900/90 border-white/5 hover:border-white/10 text-slate-400'
            : 'bg-white/90 hover:bg-white border-slate-200 text-slate-600'
        }`}
        aria-label="Search or run command"
      >
        <div className="flex items-center gap-2.5">
          <Search
            className={`w-3.5 h-3.5 transition-colors ${
              isDark
                ? 'text-slate-500 group-hover:text-slate-300'
                : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Search anything...
          </span>
        </div>
        <kbd
          className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${
            isDark
              ? 'bg-slate-800/80 text-slate-400 border-white/5'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          ⌘ K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition shadow-sm ${
            isDark
              ? 'bg-slate-900/60 hover:bg-slate-800 border-white/5 text-amber-300'
              : 'bg-white/90 hover:bg-slate-50 border-slate-200 text-indigo-600'
          }`}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <button
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition relative shadow-sm ${
            isDark
              ? 'bg-slate-900/60 hover:bg-slate-800 border-white/5 text-slate-400 hover:text-slate-200'
              : 'bg-white/90 hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 ring-2 ring-[#07090e]" />
        </button>

        {/* Connection Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs shadow-sm ${
            isDark
              ? 'bg-slate-900/60 border-white/5 text-slate-300'
              : 'bg-white/90 border-slate-200 text-slate-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                : connectionState === 'CONNECTING' || connectionState === 'RECONNECTING'
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse'
                : 'bg-slate-500'
            }`}
          />
          <span className="font-medium text-xs">
            {connectionState === 'CONNECTED'
              ? 'Online'
              : connectionState === 'CONNECTING'
              ? 'Connecting'
              : connectionState === 'RECONNECTING'
              ? 'Reconnecting'
              : 'Standby'}
          </span>
        </div>
      </div>
    </header>
  );
};
