'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Hammer,
  TrendingDown, TrendingUp, UserCog, LogOut, ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

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
  const [user, setUser]   = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex bg-surface">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 flex flex-col"
        style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <Image src="/logo-36.png" alt="JSN" width={30} height={30} className="rounded-lg flex-shrink-0" priority />
            <div>
              <div className="text-[13px] font-semibold text-white leading-none mb-0.5">JSN Pinturas</div>
              <div className="text-[10px] text-white/30 leading-none">Sistema de Gestão</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/20">
                {g.title}
              </div>
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/');
                const Icon   = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={clsx(
                      'group relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg',
                      'text-[13px] transition-all duration-150',
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/40 hover:text-white/75 hover:bg-white/[0.04]',
                    )}
                  >
                    {/* active indicator */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-500" />
                    )}
                    <Icon
                      size={15}
                      strokeWidth={active ? 2 : 1.75}
                      className="flex-shrink-0"
                    />
                    <span className="font-medium truncate">{it.label}</span>
                    {active && (
                      <ChevronRight size={11} className="ml-auto opacity-30" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-6 h-6 rounded-full bg-brand-600/80 flex items-center justify-center text-[10px] text-white font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] text-white/60 truncate leading-tight">{user?.name}</div>
              <div className="text-[10px] text-white/25 truncate leading-tight">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              router.replace('/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg
                       text-[12px] text-white/30 hover:text-white/70 hover:bg-white/[0.04]
                       transition-all duration-150"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-7 py-7">{children}</div>
      </main>
    </div>
  );
}
