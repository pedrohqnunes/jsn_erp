'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { OS_STATUS_COLOR, OS_STATUS_LABEL, QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from '@/lib/labels';

export default function ClientHistory() {
  const { id } = useParams<{ id: string }>();
  const { data } = useSWR<any>(`/clients/${id}/history`, fetcher);

  if (!data) return <div>Carregando...</div>;

  return (
    <div>
      <PageHeader title={data.client.name} subtitle="Histórico completo" />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card label="Orçamentos" value={data.stats.totalOrcamentos} />
        <Card label="OS finalizadas" value={data.stats.osFinalizadas} />
        <Card label="Total faturado" value={brl(data.stats.totalFaturado)} />
        <Card label="Ticket médio" value={brl(data.stats.ticketMedio)} />
      </section>

      <section className="card mb-6">
        <h3 className="font-semibold p-4 border-b">Orçamentos</h3>
        <table className="table w-full">
          <thead><tr><th>#</th><th>Status</th><th>Total</th><th>Margem</th><th>Emitido</th></tr></thead>
          <tbody>
            {data.quotes.map((q: any) => (
              <tr key={q.id}>
                <td>
                  <Link href={`/orcamentos/${q.id}`} className="text-brand-700 hover:underline">
                    #{String(q.number).padStart(5, '0')}
                  </Link>
                </td>
                <td><span className={`badge ${QUOTE_STATUS_COLOR[q.status]}`}>{QUOTE_STATUS_LABEL[q.status]}</span></td>
                <td>{brl(q.totalValue)}</td>
                <td>{brl(q.margin)}</td>
                <td>{dt(q.issuedAt)}</td>
              </tr>
            ))}
            {data.quotes.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-500">Nenhum</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3 className="font-semibold p-4 border-b">Ordens de serviço</h3>
        <table className="table w-full">
          <thead><tr><th>#</th><th>Status</th><th>Total</th><th>Margem</th><th>Recebido</th><th>Emitido</th></tr></thead>
          <tbody>
            {data.serviceOrders.map((o: any) => {
              const recebido = (o.receivables ?? []).reduce((a: number, r: any) => a + Number(r.paidAmount), 0);
              return (
                <tr key={o.id}>
                  <td>
                    <Link href={`/ordens-servico/${o.id}`} className="text-brand-700 hover:underline">
                      #{String(o.number).padStart(5, '0')}
                    </Link>
                  </td>
                  <td><span className={`badge ${OS_STATUS_COLOR[o.status]}`}>{OS_STATUS_LABEL[o.status]}</span></td>
                  <td>{brl(o.totalValue)}</td>
                  <td>{brl(o.margin)} ({Number(o.marginPct).toFixed(1)}%)</td>
                  <td>{brl(recebido)}</td>
                  <td>{dt(o.createdAt)}</td>
                </tr>
              );
            })}
            {data.serviceOrders.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-500">Nenhuma</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500 uppercase">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
