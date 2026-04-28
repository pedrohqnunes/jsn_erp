'use client';

import useSWR from 'swr';
import { fetcher, brl } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { OS_STATUS_LABEL } from '@/lib/labels';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

type Overview = { financeiro: any; operacional: any; comercial: any; estrategico: any };

const CHART_STYLE = { fontSize: 11, fontFamily: 'var(--font-inter), Inter, sans-serif' };

export default function DashboardPage() {
  const { data }     = useSWR<Overview>('/dashboard/overview', fetcher);
  const { data: top } = useSWR<any[]>('/dashboard/top-clients', fetcher);

  if (!data) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral integrada do negócio" />

      {/* ── KPIs ── */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="A receber"
          value={brl(data.financeiro.contasReceberPendente)}
          sub="pendente"
          color="blue"
        />
        <KpiCard
          title="Em atraso"
          value={brl(data.financeiro.contasReceberAtrasado)}
          sub="receber"
          color="red"
        />
        <KpiCard
          title="A pagar"
          value={brl(data.financeiro.contasPagarPendente)}
          sub="pendente"
          color="amber"
        />
        <KpiCard
          title="Saldo do mês"
          value={brl(data.financeiro.saldoMes)}
          sub={data.financeiro.saldoMes >= 0 ? 'positivo' : 'negativo'}
          color={data.financeiro.saldoMes >= 0 ? 'emerald' : 'red'}
        />
      </section>

      {/* ── Gráficos ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Fluxo de caixa — AreaChart */}
        <div className="card p-5">
          <div className="mb-4">
            <div className="section-title">Fluxo de caixa</div>
            <div className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.financeiro.fluxoCaixa6Meses} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v: any) => [brl(Number(v))]}
              />
              <Legend iconType="circle" iconSize={7} />
              <Area type="monotone" dataKey="received" name="Recebido" stroke="#10b981" strokeWidth={2} fill="url(#gReceived)" dot={false} />
              <Area type="monotone" dataKey="paid"     name="Pago"     stroke="#ef4444" strokeWidth={2} fill="url(#gPaid)"     dot={false} />
              <Area type="monotone" dataKey="net"      name="Líquido"  stroke="#3b82f6" strokeWidth={2} fill="url(#gNet)"      dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Previsão — BarChart */}
        <div className="card p-5">
          <div className="mb-4">
            <div className="section-title">Previsão de caixa</div>
            <div className="text-xs text-slate-400 mt-0.5">Próximos 6 meses</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.financeiro.previsao6Meses} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14} barGap={4}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                formatter={(v: any) => [brl(Number(v))]}
              />
              <Legend iconType="circle" iconSize={7} />
              <Bar dataKey="toReceive" name="A receber" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="toPay"     name="A pagar"   fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Métricas ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Operacional">
          <MetricRow label="OS finalizadas (mês)"   value={String(data.operacional.osFinalizadasMes)} />
          <MetricRow label="Tempo médio produção"    value={`${data.operacional.tempoMedioProducaoDias} dias`} />
          <div className="divider my-3" />
          {Object.entries(data.operacional.ordensPorStatus).map(([k, v]: any) => (
            <div key={k} className="flex justify-between text-xs py-0.5">
              <span className="text-slate-400">{OS_STATUS_LABEL[k] ?? k}</span>
              <span className="font-semibold text-slate-700 tabular">{v}</span>
            </div>
          ))}
        </MetricCard>

        <MetricCard title="Comercial">
          <MetricRow label="Total de orçamentos" value={String(data.comercial.totalOrcamentos)} />
          <MetricRow label="Aprovados"           value={String(data.comercial.orcamentosAprovados)} />
          <div className="divider my-3" />
          <div className="mt-1">
            <div className="text-xs text-slate-400 mb-1.5">Taxa de conversão</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{data.comercial.taxaConversao}</span>
              <span className="text-sm text-slate-400 mb-0.5">%</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full"
                style={{ width: `${data.comercial.taxaConversao}%`, transition: 'width 0.6s ease' }}
              />
            </div>
          </div>
        </MetricCard>

        <MetricCard title="Estratégico (mês)">
          <MetricRow label="Receita"      value={brl(data.estrategico.receitaMes)} mono />
          <MetricRow label="Custo"        value={brl(data.estrategico.custoMes)}   mono />
          <div className="divider my-3" />
          <MetricRow label="Margem"       value={brl(data.estrategico.margemMes)}  mono />
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Margem média</span>
              <span className="font-semibold text-emerald-600">{data.estrategico.margemMediaPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(data.estrategico.margemMediaPct, 100)}%` }}
              />
            </div>
          </div>
        </MetricCard>
      </section>

      {/* ── Top clientes ── */}
      <section className="card">
        <div className="px-5 pt-5 pb-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <div className="section-title">Top clientes</div>
            <div className="text-xs text-slate-400 mt-0.5">Ordenado por receita total</div>
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
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xs text-slate-300 tabular w-4 text-right">{i + 1}</span>
                      <span className="font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="num text-slate-600">{c.orders}</td>
                  <td className="num">{brl(c.total)}</td>
                  <td className="num text-slate-600">{brl(c.ticketMedio)}</td>
                  <td className="num">
                    <span className="text-emerald-600 font-semibold">{brl(c.margin)}</span>
                  </td>
                </tr>
              ))}
              {(!top || top.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                    Nenhuma OS finalizada ainda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-xs text-slate-400">Carregando dashboard...</span>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, color }: { title: string; value: string; sub: string; color: string }) {
  const accent: Record<string, string> = {
    blue:    'text-blue-600',
    red:     'text-red-500',
    amber:   'text-amber-600',
    emerald: 'text-emerald-600',
  };
  const dot: Record<string, string> = {
    blue:    'bg-blue-500',
    red:     'bg-red-500',
    amber:   'bg-amber-500',
    emerald: 'bg-emerald-500',
  };
  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dot[color]}`} />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className={`text-2xl font-bold tracking-tight ${accent[color]}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1 capitalize">{sub}</div>
    </div>
  );
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="section-title mb-4">{title}</div>
      {children}
    </div>
  );
}

function MetricRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-surface-border/60 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-sm font-semibold text-slate-900 ${mono ? 'tabular' : ''}`}>{value}</span>
    </div>
  );
}
