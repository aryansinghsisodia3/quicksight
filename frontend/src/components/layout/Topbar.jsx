import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

export default function Topbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/image':
        return 'Image Detection';
      case '/video':
        return 'Video Detection';
      case '/webcam':
        return 'Live Webcam';
      case '/analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-6 backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-[#0f0f0f]/95">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">
          Dashboard
        </p>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white md:text-2xl">
          {getPageTitle()}
        </h1>
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-gray-700 transition-all duration-300 hover:border-blue-500/40 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-blue-500/50 dark:hover:bg-gray-800"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun size={22} className="text-amber-400" />
        ) : (
          <Moon size={22} className="text-blue-600" />
        )}
      </button>
    </header>
  );
}
