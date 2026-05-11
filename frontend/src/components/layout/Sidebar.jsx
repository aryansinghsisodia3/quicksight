import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ImageIcon,
  Video,
  Camera,
  PieChart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggleCollapsed }) {
  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/image', icon: ImageIcon, label: 'Image Detection' },
    { to: '/video', icon: Video, label: 'Video Detection' },
    { to: '/webcam', icon: Camera, label: 'Webcam' },
    { to: '/analytics', icon: PieChart, label: 'Analytics' },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-800 bg-gray-950 shadow-xl transition-all duration-300 dark:border-white/5 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`flex h-16 shrink-0 items-center border-b border-gray-800 px-4 dark:border-white/5 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!collapsed && (
          <span className="bg-gradient-to-r text-xl from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            QuickSight{' '}
            <span className="whitespace-nowrap text-xl font-bold tracking-tight text-white">
              AI
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              title={collapsed ? link.label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/40'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <Icon
                size={22}
                className="shrink-0 opacity-90 transition-transform duration-300 group-hover:scale-105"
                strokeWidth={2}
              />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
