'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import { fetcher, brl, dt } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import ChartCard from '@/components/ui/ChartCard';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import MarginBar from '@/components/ui/MarginBar';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle,
  LayoutDashboard, Calendar, AlertCircle, Trophy, Target, Crown,
} from 'lucide-react';

type Overview = { financeiro: any; operacional: any; comercial: any; estrategico: any };

const CHART_STYLE = { fontSize: 11, fontFamily: 'var(--font-inter), Inter, sans-serif' };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DashboardPage() {
  const { data }            = useSWR<Overview>('/dashboard/overview', fetcher);
  const { data: top }       = useSWR<any[]>('/dashboard/top-clients', fetcher);
  const { data: payables }  = useSWR<any[]>('/payables', fetcher);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const pendingPayables = (payables ?? []).filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const dueToday = pendingPayables.filter((p) => isSameDay(new Date(p.dueDate), today));
  const dueWeek  = pendingPayables.filter((p) => {
    const d = new Date(p.dueDate);
    return d >= today && d <= weekEnd && !isSameDay(d, today);
  });
  const totalToday = dueToday.reduce((s, p) => s + Number(p.expectedAmount), 0);
  const totalWeek  = dueWeek.reduce((s, p) => s + Number(p.expectedAmount), 0);

  if (!data) return <LoadingState />;

  /* compute delta vs previous period (best effort using fluxoCaixa6Meses) */
  const flux = data.financeiro.fluxoCaixa6Meses ?? [];
  const lastNet = flux[flux.length - 1]?.net ?? 0;
  const prevNet = flux[flux.length - 2]?.net ?? 0;
  const netDelta = prevNet !== 0 ? ((lastNet - prevNet) / Math.abs(prevNet)) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral integrada do negócio"
        icon={LayoutDashboard}
      />

      {/* ── KPIs ── */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          index={0}
          title="A receber"
          value={brl(data.financeiro.contasReceberPendente)}
          sub="pendente este mês"
          tone="brand"
          icon={TrendingUp}
        />
        <KpiCard
          index={1}
          title="Em atraso"
          value={brl(data.financeiro.contasReceberAtrasado)}
          sub="receber"
          tone="danger"
          icon={AlertTriangle}
        />
        <KpiCard
          index={2}
          title="A pagar"
          value={brl(data.financeiro.contasPagarPendente)}
          sub="pendente"
          tone="warning"
          icon={TrendingDown}
        />
        <KpiCard
          index={3}
          title="Saldo do mês"
          value={brl(data.financeiro.saldoMes)}
          sub={data.financeiro.saldoMes >= 0 ? 'positivo' : 'negativo'}
          tone={data.financeiro.saldoMes >= 0 ? 'success' : 'danger'}
          icon={Wallet}
          delta={netDelta}
        />
      </section>

      {/* ── Gráficos ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Fluxo de caixa" subtitle="Últimos 6 meses" delay={0.05} height={232}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={flux} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgb(var(--border-soft))" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [brl(Number(v))]} cursor={{ stroke: 'rgb(99 102 241 / 0.3)', strokeWidth: 1 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} />
              <Area type="monotone" dataKey="received" name="Recebido" stroke="#10b981" strokeWidth={2.2} fill="url(#gReceived)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="paid"     name="Pago"     stroke="#ef4444" strokeWidth={2.2} fill="url(#gPaid)"     dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="net"      name="Líquido"  stroke="#6366f1" strokeWidth={2.4} fill="url(#gNet)"      dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Previsão de caixa" subtitle="Próximos 6 meses" delay={0.1} height={232}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.financeiro.previsao6Meses} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={14} barGap={4}>
              <defs>
                <linearGradient id="gReceiveBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="gPayBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgb(var(--border-soft))" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={CashForecastTooltip} cursor={{ fill: 'rgb(99 102 241 / 0.06)' }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ paddingTop: 8 }} />
              <Bar dataKey="toReceive" name="A receber" fill="url(#gReceiveBar)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="toPay"     name="A pagar"   fill="url(#gPayBar)"     radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* ── Métricas ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Contas a Pagar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 relative overflow-hidden"
        >
          <span className="absolute inset-x-0 top-0 h-px hairline-warning opacity-80" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/25 items-center justify-center">
                <Calendar size={15} strokeWidth={2.25} />
              </span>
              <span className="section-title">Contas a Pagar</span>
            </div>
          </div>

          {/* Hoje */}
          <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-rose-500">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-glow" />
                Hoje
              </span>
              <span className="text-[11px] text-ink-subtle">{dueToday.length} conta{dueToday.length !== 1 ? 's' : ''}</span>
            </div>
            {dueToday.length === 0 ? (
              <p className="text-xs text-ink-subtle italic">Sem vencimentos hoje 🎉</p>
            ) : (
              <>
                <div className="space-y-1.5 mb-2">
                  {dueToday.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <span className="text-ink truncate max-w-[140px]">{p.description}</span>
                      <span className="font-semibold text-rose-500 tabular ml-2">{brl(p.expectedAmount)}</span>
                    </div>
                  ))}
                  {dueToday.length > 3 && <p className="text-[11px] text-ink-subtle">+{dueToday.length - 3} mais...</p>}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-rose-500/20">
                  <span className="text-[11px] text-ink-subtle">Total hoje</span>
                  <span className="text-sm font-bold text-rose-500 tabular">{brl(totalToday)}</span>
                </div>
              </>
            )}
          </div>

          {/* Esta semana */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Esta semana
              </span>
              <span className="text-[11px] text-ink-subtle">{dueWeek.length} conta{dueWeek.length !== 1 ? 's' : ''}</span>
            </div>
            {dueWeek.length === 0 ? (
              <p className="text-xs text-ink-subtle italic">Nenhum vencimento esta semana</p>
            ) : (
              <>
                <div className="space-y-1.5 mb-2">
                  {dueWeek.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs">
                      <div className="min-w-0">
                        <div className="text-ink truncate max-w-[130px]">{p.description}</div>
                        <div className="text-ink-subtle">{dt(p.dueDate)}</div>
                      </div>
                      <span className="font-semibold text-amber-500 tabular ml-2">{brl(p.expectedAmount)}</span>
                    </div>
                  ))}
                  {dueWeek.length > 3 && <p className="text-[11px] text-ink-subtle">+{dueWeek.length - 3} mais...</p>}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-500/25">
                  <span className="text-[11px] text-ink-subtle">Total semana</span>
                  <span className="text-sm font-bold text-amber-500 tabular">{brl(totalWeek)}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Comercial */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 relative overflow-hidden"
        >
          <span className="absolute inset-x-0 top-0 h-px hairline-brand opacity-80" />
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex w-8 h-8 rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 items-center justify-center">
              <Target size={15} strokeWidth={2.25} />
            </span>
            <span className="section-title">Comercial</span>
          </div>
          <MetricRow label="Total de orçamentos" value={String(data.comercial.totalOrcamentos)} />
          <MetricRow label="Aprovados" value={String(data.comercial.orcamentosAprovados)} />
          <div className="divider my-3" />
          <div className="text-xs text-ink-muted mb-1.5">Taxa de conversão</div>
          <div className="flex items-end gap-2 mb-2.5">
            <span className="text-[28px] font-semibold text-ink tracking-tight tabular leading-none">{data.comercial.taxaConversao}</span>
            <span className="text-sm text-ink-subtle mb-0.5">%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border-soft))' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.comercial.taxaConversao}%` }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            />
          </div>
        </motion.div>

        {/* Estratégico */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 relative overflow-hidden"
        >
          <span className="absolute inset-x-0 top-0 h-px hairline-success opacity-80" />
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 items-center justify-center">
              <Trophy size={15} strokeWidth={2.25} />
            </span>
            <span className="section-title">Estratégico (mês)</span>
          </div>
          <MetricRow label="Receita" value={brl(data.estrategico.receitaMes)} mono />
          <MetricRow label="Custo" value={brl(data.estrategico.custoMes)} mono />
          <div className="divider my-3" />
          <MetricRow label="Margem" value={brl(data.estrategico.margemMes)} mono strong />
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-ink-muted">Margem média</span>
              <span className="font-semibold text-emerald-600 tabular">{data.estrategico.margemMediaPct}%</span>
            </div>
            <MarginBar pct={data.estrategico.margemMediaPct} showLabel={false} />
          </div>
        </motion.div>
      </section>

      {/* ── Top clientes ── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="px-5 pt-5 pb-4 border-b border-app flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex w-8 h-8 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-500/20 items-center justify-center">
              <Crown size={15} strokeWidth={2.25} />
            </span>
            <div>
              <div className="section-title">Top clientes</div>
              <div className="text-xs text-ink-subtle mt-0.5">Ordenado por receita total</div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="num">OS</th>
                <th className="num">Total faturado</th>
                <th className="num">Ticket médio</th>
                <th className="num">Margem</th>
              </tr>
            </thead>
            <tbody>
              {(top ?? []).map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className={`avatar w-7 h-7 ${i === 0 ? 'ring-1 ring-amber-400/40' : ''}`}>
                        {(c.name ?? '?').slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-ink truncate flex items-center gap-1.5">
                          {c.name}
                          {i === 0 && <Crown size={11} className="text-amber-500" />}
                        </div>
                        <div className="text-[11px] text-ink-subtle">#{i + 1}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num text-ink-muted">{c.orders}</td>
                  <td className="num font-semibold">{brl(c.total)}</td>
                  <td className="num text-ink-muted">{brl(c.ticketMedio)}</td>
                  <td className="num">
                    <span className="text-emerald-600 font-semibold">{brl(c.margin)}</span>
                  </td>
                </tr>
              ))}
              {(!top || top.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState icon={Crown} title="Sem dados ainda" description="Finalize uma OS para ver o ranking de clientes." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}

/* ── Sub-components ── */

function CashForecastTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const toReceive = payload.find((p: any) => p.dataKey === 'toReceive');
  const toPay     = payload.find((p: any) => p.dataKey === 'toPay');
  const net       = (Number(toReceive?.value ?? 0) - Number(toPay?.value ?? 0));
  return (
    <div className="rounded-xl border border-app bg-surface-card shadow-modal px-3.5 py-3 min-w-[180px]"
         style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle mb-2.5">{label}</p>
      {toReceive && (
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-[12px] text-ink-muted">A receber</span>
          </div>
          <span className="text-[12.5px] font-semibold text-emerald-500 tabular">{brl(Number(toReceive.value))}</span>
        </div>
      )}
      {toPay && (
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
            <span className="text-[12px] text-ink-muted">A pagar</span>
          </div>
          <span className="text-[12.5px] font-semibold text-rose-500 tabular">{brl(Number(toPay.value))}</span>
        </div>
      )}
      <div className="border-t border-app pt-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${net >= 0 ? 'bg-brand-500' : 'bg-rose-400'}`} />
          <span className="text-[12px] text-ink-muted">Líquido</span>
        </div>
        <span className={`text-[12.5px] font-bold tabular ${net >= 0 ? 'text-brand-500' : 'text-rose-400'}`}>{brl(net)}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div>
      <div className="mb-7 flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="xl" />
        <div className="space-y-1.5">
          <Skeleton width={160} height={22} />
          <Skeleton width={220} height={12} />
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[0,1,2,3].map(i => (
          <div key={i} className="card p-5">
            <Skeleton width={100} height={12} className="mb-4" />
            <Skeleton width={120} height={28} className="mb-2" />
            <Skeleton width={80} height={11} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5"><Skeleton height={232} rounded="lg" /></div>
        <div className="card p-5"><Skeleton height={232} rounded="lg" /></div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-app-soft last:border-0">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`text-sm ${strong ? 'font-bold' : 'font-semibold'} text-ink ${mono ? 'tabular' : ''}`}>{value}</span>
    </div>
  );
}
