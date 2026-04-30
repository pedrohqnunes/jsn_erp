'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Hammer,
  TrendingDown, TrendingUp, UserCog, LogOut,
  ChevronsLeft, ChevronsRight, Search, Bell, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ui/ThemeToggle';

const NAV = [
  { href: '/dashboard',      label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/clientes',       label: 'Clientes',           icon: Users },
  { href: '/orcamentos',     label: 'Orçamentos',         icon: FileText },
  { href: '/ordens-servico', label: 'Ordens de Serviço',  icon: ClipboardList },
  { href: '/producao',       label: 'Produção',           icon: Hammer },
  { href: '/contas-receber', label: 'Contas a Receber',   icon: TrendingUp },
  { href: '/contas-pagar',   label: 'Contas a Pagar',     icon: TrendingDown },
  { href: '/funcionarios',   label: 'Funcionários',       icon: UserCog },
];

const GROUPS = [
  { title: 'Visão Geral', items: NAV.slice(0, 1) },
  { title: 'Comercial',   items: NAV.slice(1, 4) },
  { title: 'Operacional', items: NAV.slice(4, 5) },
  { title: 'Financeiro',  items: NAV.slice(5, 7) },
  { title: 'Equipe',      items: NAV.slice(7) },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]           = useState<any>(null);
  const [ready, setReady]         = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    const c = localStorage.getItem('sidebar-collapsed');
    if (c === '1') setCollapsed(true);
    setReady(true);

    /* hydrate theme early to avoid flash */
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  }, [router]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
  }

  if (!ready) return null;

  const activePage = NAV.find(n => pathname === n.href || pathname.startsWith(n.href + '/'));

  return (
    <div className="min-h-screen flex bg-app">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 236 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="relative flex-shrink-0 flex flex-col z-30"
        style={{
          background: 'linear-gradient(180deg, #0F1320 0%, #0A0E18 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ambient brand glow at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44
                        bg-gradient-to-b from-brand-500/[0.10] via-brand-500/[0.04] to-transparent" />

        {/* Logo */}
        <div className="relative px-3.5 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <Image src="/logo-36.png" alt="JSN" width={32} height={32}
                className="rounded-lg ring-1 ring-white/10" priority />
              <span className="absolute -inset-1 rounded-xl bg-brand-500/20 blur-md -z-10" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <div className="text-[13px] font-semibold text-white leading-none mb-1 tracking-tight">JSN Pinturas</div>
                  <div className="text-[10px] text-white/35 leading-none">Sistema de Gestão</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30"
                  >
                    {g.title}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const active = pathname === it.href || pathname.startsWith(it.href + '/');
                  const Icon   = it.icon;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      title={collapsed ? it.label : undefined}
                      className={clsx(
                        'group relative flex items-center gap-3 px-3 py-2 rounded-lg',
                        'text-[13px] font-medium transition-colors duration-200',
                        active ? 'text-white' : 'text-white/55 hover:text-white',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-white/[0.07]
                                     ring-1 ring-white/[0.08] backdrop-blur-sm"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      {!active && (
                        <span className="absolute inset-0 rounded-lg opacity-0
                                         group-hover:opacity-100 group-hover:bg-white/[0.04]
                                         transition-opacity duration-200" />
                      )}
                      {active && (
                        <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-full
                                         bg-gradient-to-b from-brand-300 to-brand-600
                                         shadow-[0_0_10px_2px] shadow-brand-500/45" />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.25 : 1.85}
                        className="relative flex-shrink-0"
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.18 }}
                            className="relative truncate"
                          >
                            {it.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="relative px-2.5 py-3 border-t border-white/[0.05]">
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-2 py-1.5 mb-2 rounded-lg
                       text-[11px] text-white/35 hover:text-white/85 hover:bg-white/[0.04]
                       transition-all duration-200"
          >
            {collapsed
              ? <ChevronsRight size={14} />
              : <><ChevronsLeft size={13} /><span className="font-medium">Recolher</span></>}
          </button>

          {/* User row */}
          <div className={clsx('flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg', collapsed && 'justify-center')}>
            <div className="relative flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700
                              flex items-center justify-center text-[11px] text-white font-semibold
                              ring-1 ring-white/15 shadow-[0_2px_8px_rgba(99,102,241,0.35)]">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400
                               ring-2 ring-[#0A0E18]" />
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  className="min-w-0 flex-1"
                >
                  <div className="text-[12px] text-white/85 truncate font-medium leading-tight">{user?.name}</div>
                  <div className="text-[10px] text-white/35 truncate leading-tight">{user?.email}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    router.replace('/login');
                  }}
                  className="p-1.5 rounded-md text-white/35 hover:text-rose-300 hover:bg-rose-500/10
                             transition-all duration-200"
                  title="Sair"
                >
                  <LogOut size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Main column (topbar + content) ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 glass border-b border-app">
          <div className="flex items-center gap-3 px-6 h-14 max-w-[1480px] mx-auto w-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] min-w-0">
              <Sparkles size={13} className="text-brand-500" />
              <span className="text-ink-muted">JSN</span>
              <span className="text-ink-subtle">/</span>
              <span className="font-semibold text-ink truncate">{activePage?.label ?? 'Dashboard'}</span>
            </div>

            {/* Search (decorative — wires to nothing yet) */}
            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
                            border border-app bg-surface-card text-[12.5px] text-ink-subtle
                            hover:border-brand-500/40 transition-colors w-[280px] cursor-pointer">
              <Search size={13} />
              <span>Buscar...</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-app-subtle border border-app text-ink-subtle">⌘K</span>
            </div>

            <button className="btn-icon" title="Notificações">
              <Bell size={15} />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto app-page-bg">
          <div className="max-w-[1480px] mx-auto px-6 py-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
