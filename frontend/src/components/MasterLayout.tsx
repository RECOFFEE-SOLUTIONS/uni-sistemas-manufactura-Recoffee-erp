"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface MasterLayoutProps {
  children: React.ReactNode;
}

export default function MasterLayout({ children }: MasterLayoutProps) {
  // Estado inicial del Sidebar colapsado por defecto (WI-8.01)
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isAuthPage = pathname === "/login" || pathname.startsWith("/auth");

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-800 dark:text-slate-100">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Minimalista Colapsado por Defecto */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container Desplazable */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <Navbar onToggleSidebar={() => {
          if (window.innerWidth < 1024) {
            setMobileOpen((prev) => !prev);
          } else {
            setCollapsed((prev) => !prev);
          }
        }} />
        <main className="p-4 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
