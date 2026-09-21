import React from 'react';
import {
  Home,
  MessageSquare,
  CheckSquare,
  Database,
  Settings,
  PanelLeftClose,
  LogOut,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, type NavTab } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { authApi } from '../../services/api/auth.api';
import logoImg from '../../assets/Logo - Png.png';

interface NavItem {
  id: NavTab;
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'assistant', label: 'Assistant', path: '/assistant', icon: Home },
  { id: 'conversations', label: 'Conversations', path: '/conversations', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { id: 'memory', label: 'Memory', path: '/memory', icon: Database },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, isSidebarExpanded, toggleSidebar, theme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isDark = theme === 'dark';

  const { user } = useAuthStore();
  const displayName = user?.name || 'IRIS User';
  const initials = displayName.charAt(0).toUpperCase();
  const subtitle = user?.email || 'Authenticated';

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await authApi.logout();
    navigate('/login');
  };

  return (
    <aside
      className={`h-screen flex flex-col justify-between select-none z-30 shrink-0 transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'w-64 p-5' : 'w-20 p-3 items-center'
      } ${
        isDark
          ? 'bg-[#07090e]/95 border-r border-white/5'
          : 'bg-white/95 border-r border-slate-200/80 shadow-sm'
      }`}
    >
      {/* Brand Header - Clicking on Logo triggers sidebar collapse/expand */}
      <div className="w-full">
        <div
          onClick={toggleSidebar}
          role="button"
          tabIndex={0}
          title={isSidebarExpanded ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
          className={`relative flex items-center gap-3.5 py-2.5 mb-5 rounded-2xl cursor-pointer transition-all duration-200 group ${
            isSidebarExpanded
              ? 'px-2 hover:bg-white/[0.04]'
              : 'justify-center p-2 hover:bg-white/[0.06]'
          }`}
        >
          <div className="relative">
            <img
              src={logoImg}
              alt="IRIS Logo"
              className="w-8 h-10 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-transform group-hover:scale-105"
            />
            {/* Indicator badge on logo */}
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
          </div>

          {isSidebarExpanded && (
            <div className="flex-1 overflow-hidden transition-opacity duration-200">
              <div className="flex items-center justify-between">
                <h1
                  className={`text-xl font-bold tracking-wider font-['Poppins'] ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  IRIS
                </h1>
                <PanelLeftClose
                  className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
              </div>
              <p
                className={`text-[11px] font-normal tracking-wide truncate ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Think. Do. With You.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 w-full" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const path = item.path;
            const isActive =
              location.pathname === path ||
              (path === '/assistant' && (location.pathname === '/' || location.pathname === '')) ||
              location.pathname.startsWith(path + '/') ||
              activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(path);
                }}
                title={item.label}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                  isSidebarExpanded
                    ? 'gap-3.5 px-3.5 py-2.5'
                    : 'justify-center p-3'
                } ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-indigo-400'
                        : 'text-indigo-600'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                />
                {isSidebarExpanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Section */}
      <div
        className={`w-full pt-3 border-t ${
          isDark ? 'border-white/5' : 'border-slate-200/80'
        }`}
      >
        <div
          onClick={() => navigate('/settings')}
          role="button"
          tabIndex={0}
          className={`w-full flex items-center rounded-xl transition cursor-pointer group ${
            isSidebarExpanded
              ? 'justify-between p-2 hover:bg-white/[0.04]'
              : 'justify-center p-2 hover:bg-white/[0.06]'
          }`}
          title={`${displayName} (${subtitle})`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold shadow-inner ${
                isDark
                  ? 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white border border-white/10'
                  : 'bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              {initials}
            </div>
            {isSidebarExpanded && (
              <div className="text-left truncate">
                <p
                  className={`text-sm font-medium leading-tight truncate ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {displayName}
                </p>
                <p
                  className={`text-[11px] truncate ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            )}
          </div>
          {isSidebarExpanded && (
            <button
              onClick={handleLogout}
              title="Sign out of IRIS"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
