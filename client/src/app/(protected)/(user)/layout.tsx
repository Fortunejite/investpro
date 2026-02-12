'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar - only on larger screens */}
        <div className="hidden lg:block">
          <Sidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          />
        </div>

        {/* Main content */}
        <main className={`flex-1 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300 overflow-x-hidden`}>
          <div className="container mx-auto px-4 py-6 max-w-6xl w-full">
            <div className="max-w-full overflow-x-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
