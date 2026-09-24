"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Radar,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/oportunidades', label: 'Mercado', icon: Radar },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-white/20 bg-white/5 text-sm font-bold text-white">
          V
        </div>
        <div className="leading-none">
          <span className="block text-[15px] font-semibold text-white">VortexAI</span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-[#96a098]">Operações</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-[4px] p-1.5 text-[#aeb6af] hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navegação principal">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737d75]">Navegação</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`relative flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium ${
                isActive
                  ? 'bg-white/10 text-white before:absolute before:left-0 before:h-5 before:w-0.5 before:bg-[#7fc3aa]'
                  : 'text-[#aeb6af] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 p-3">
        <Link
          href="/configuracoes"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm ${
            pathname === '/configuracoes'
              ? 'bg-white/10 font-medium text-white'
              : 'text-[#aeb6af] hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
          Configurações
        </Link>
        <a
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm text-[#c7aaa3] hover:bg-white/[0.06] hover:text-[#f1c1b5]"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
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
        className="fixed left-4 top-3 z-50 rounded-[5px] border border-[#39413b] bg-[#1e2420] p-2.5 text-[#c9cec9] hover:text-white md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-black/20 bg-[#1e2420] transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Sidebar desktop */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-black/20 bg-[#1e2420] md:flex">
        <SidebarContent />
      </aside>
    </>
  );
}
