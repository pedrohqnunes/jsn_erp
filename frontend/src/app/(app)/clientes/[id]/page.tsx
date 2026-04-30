'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, FileText, ClipboardList, Wallet, Receipt } from 'lucide-react';
import { brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import EmptyState from '@/components/ui/EmptyState';
import { OS_STATUS_COLOR, OS_STATUS_LABEL, QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from '@/lib/labels';

export default function ClientHistory() {
  const { id } = useParams<{ id: string }>();
  const { data } = useSWR<any>(`/clients/${id}/history`, fetcher);

  if (!data) return <div className="text-ink-subtle text-sm">Carregando...</div>;

  return (
    <div>
      <PageHeader title={data.client.name} subtitle="Histórico completo" icon={User} />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard index={0} title="Orçamentos" value={String(data.stats.totalOrcamentos)} tone="brand" icon={FileText} />
        <KpiCard index={1} title="OS finalizadas" value={String(data.stats.osFinalizadas)} tone="success" icon={ClipboardList} />
        <KpiCard index={2} title="Total faturado" value={brl(data.stats.totalFaturado)} tone="brand" icon={Wallet} />
        <KpiCard index={3} title="Ticket médio" value={brl(data.stats.ticketMedio)} tone="neutral" icon={Receipt} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="card mb-6 overflow-hidden"
      >
        <h3 className="section-title px-5 py-4 border-b border-app">Orçamentos</h3>
        <table className="table w-full">
          <thead><tr><th>#</th><th>Status</th><th className="num">Total</th><th className="num">Margem</th><th>Emitido</th></tr></thead>
          <tbody>
            {data.quotes.map((q: any) => (
              <tr key={q.id}>
                <td>
                  <Link href={`/orcamentos/${q.id}`} className="text-brand-600 hover:text-brand-700 font-semibold tabular">
                    #{String(q.number).padStart(5, '0')}
                  </Link>
                </td>
                <td><span className={QUOTE_STATUS_COLOR[q.status]}>{QUOTE_STATUS_LABEL[q.status]}</span></td>
                <td className="num font-semibold">{brl(q.totalValue)}</td>
                <td className="num text-emerald-600 font-semibold">{brl(q.margin)}</td>
                <td className="text-ink-muted text-[12.5px]">{dt(q.issuedAt)}</td>
              </tr>
            ))}
            {data.quotes.length === 0 && <tr><td colSpan={5} className="p-0"><EmptyState icon={FileText} title="Nenhum orçamento" /></td></tr>}
          </tbody>
        </table>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <h3 className="section-title px-5 py-4 border-b border-app">Ordens de serviço</h3>
        <table className="table w-full">
          <thead><tr><th>#</th><th>Status</th><th className="num">Total</th><th className="num">Margem</th><th className="num">Recebido</th><th>Emitido</th></tr></thead>
          <tbody>
            {data.serviceOrders.map((o: any) => {
              const recebido = (o.receivables ?? []).reduce((a: number, r: any) => a + Number(r.paidAmount), 0);
              return (
                <tr key={o.id}>
                  <td>
                    <Link href={`/ordens-servico/${o.id}`} className="text-brand-600 hover:text-brand-700 font-semibold tabular">
                      #{String(o.number).padStart(5, '0')}
                    </Link>
                  </td>
                  <td><span className={OS_STATUS_COLOR[o.status]}>{OS_STATUS_LABEL[o.status]}</span></td>
                  <td className="num font-semibold">{brl(o.totalValue)}</td>
                  <td className="num text-emerald-600 font-semibold">{brl(o.margin)} ({Number(o.marginPct).toFixed(1)}%)</td>
                  <td className="num">{brl(recebido)}</td>
                  <td className="text-ink-muted text-[12.5px]">{dt(o.createdAt)}</td>
                </tr>
              );
            })}
            {data.serviceOrders.length === 0 && <tr><td colSpan={6} className="p-0"><EmptyState icon={ClipboardList} title="Nenhuma OS" /></td></tr>}
          </tbody>
        </table>
      </motion.section>
    </div>
  );
}
