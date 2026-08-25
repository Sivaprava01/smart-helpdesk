import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <TopHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
