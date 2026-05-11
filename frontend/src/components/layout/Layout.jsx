import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 transition-all duration-300 dark:bg-black dark:text-gray-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}
      >
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
