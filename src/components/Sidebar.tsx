"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Sparkles,
  Activity,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/oportunidades', label: 'Oportunidades', icon: Activity },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Vortex<span className="text-indigo-400">AI</span>
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-1">
        <Link
          href="/configuracoes"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            pathname === '/configuracoes'
              ? 'bg-indigo-500/10 text-indigo-400 font-medium'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-5 h-5" />
          Configurações
        </Link>
        <a
          href="/api/auth/logout"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </a>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Botão hambúrguer - mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#121215] border border-white/10 text-gray-400 hover:text-white transition-colors shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#121215] border-r border-white/10 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 bg-[#121215] border-r border-white/10 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  );
}
