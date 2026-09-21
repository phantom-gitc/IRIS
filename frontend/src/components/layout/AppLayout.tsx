import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore, type NavTab } from '../../stores/ui.store';
import bgCosmosDark from '../../assets/iris-bg-dark.jpg';
import bgPrismLight from '../../assets/iris-bg-light.jpg';

export const AppLayout: React.FC = () => {
  const { theme, activeTab, setActiveTab } = useUIStore();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Synchronize route pathname with activeTab
  useEffect(() => {
    const raw = location.pathname.split('/')[1] as NavTab;
    const validTabs: NavTab[] = ['assistant', 'conversations', 'tasks', 'memory', 'settings'];
    if (validTabs.includes(raw)) {
      if (activeTab !== raw) setActiveTab(raw);
    } else if (location.pathname === '/' || location.pathname === '') {
      if (activeTab !== 'assistant') setActiveTab('assistant');
    }
  }, [location.pathname, activeTab, setActiveTab]);

  return (
    <div
      className={`fixed inset-0 h-screen max-h-screen w-screen max-w-screen overflow-hidden flex font-['Poppins'] antialiased select-none relative transition-colors duration-500 ${
        isDark ? 'bg-[#04060a] text-slate-100' : 'bg-[#ffffff] text-slate-900'
      }`}
    >
      {/* 100% Seamless Atmospheric Depth Canvas */}
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700 bg-cover bg-center bg-no-repeat ${
          isDark ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${bgCosmosDark})`,
        }}
      />
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700 bg-cover bg-center bg-no-repeat ${
          !isDark ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${bgPrismLight})`,
        }}
      />

      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative z-10">
        <TopBar />
        <main className="flex-1 flex flex-col items-center justify-between px-8 py-2 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
