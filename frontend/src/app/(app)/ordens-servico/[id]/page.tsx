'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { OS_STATUS_COLOR, OS_STATUS_LABEL, PAY_STATUS_COLOR, PAY_STATUS_LABEL, PAYMENT_TERMS_LABEL, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from '@/lib/labels';

export default function OSDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, mutate } = useSWR<any>(`/service-orders/${id}`, fetcher);

  if (!data) return <div>Carregando...</div>;

  async function changeStatus(status: string) {
    await api(`/service-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await mutate();
  }

  async function changeStage(stageId: string, status: string) {
    await api(`/production/stages/${stageId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await mutate();
  }

  const next: Record<string, string[]> = {
    WAITING_APPROVAL: ['WAITING_PRODUCTION', 'CANCELED'],
    WAITING_PRODUCTION: ['IN_PRODUCTION', 'CANCELED'],
    IN_PRODUCTION: ['FINISHED', 'CANCELED'],
    FINISHED: [],
    CANCELED: [],
  };

  return (
    <div>
      <PageHeader
        title={`OS #${String(data.number).padStart(5, '0')}`}
        subtitle={data.client.name}
        actions={
          <div className="flex gap-2">
            {next[data.status].map((s) => (
              <button key={s} className={s === 'CANCELED' ? 'btn-danger' : 'btn-primary'} onClick={() => changeStatus(s)}>
                Mover para {OS_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 space-y-3 lg:col-span-1">
          <div>
            <div className="text-xs text-slate-500 uppercase">Status</div>
            <span className={`badge mt-1 ${OS_STATUS_COLOR[data.status]}`}>{OS_STATUS_LABEL[data.status]}</span>
          </div>
          <Stat label="Total" value={brl(data.totalValue)} />
          <Stat label="Custo" value={brl(data.totalCost)} />
          <Stat label="Margem" value={`${brl(data.margin)} (${Number(data.marginPct).toFixed(1)}%)`} />
          <Stat label="Pagamento" value={PAYMENT_TERMS_LABEL[data.paymentTerms] ?? data.paymentTerms} />
          <Stat label="Parcelas" value={String(data.installments)} />
          <Stat label="Início" value={dt(data.startedAt)} />
          <Stat label="Fim" value={dt(data.finishedAt)} />
          {data.quote && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 uppercase mb-1">Orçamento de origem</div>
              <Link href={`/orcamentos/${data.quote.id}`} className="text-brand-700 hover:underline">
                #{String(data.quote.number).padStart(5, '0')}
              </Link>
            </div>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Descrição</h3>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.description}</p>
        </div>
      </div>

      <section className="card mb-6">
        <h3 className="font-semibold p-4 border-b">Etapas de produção</h3>
        <table className="table w-full">
          <thead><tr><th>Etapa</th><th>Status</th><th>Início</th><th>Fim</th><th /></tr></thead>
          <tbody>
            {data.productionStages.map((s: any) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td><span className={`badge ${STAGE_STATUS_COLOR[s.status]}`}>{STAGE_STATUS_LABEL[s.status]}</span></td>
                <td>{dt(s.startedAt)}</td>
                <td>{dt(s.finishedAt)}</td>
                <td className="space-x-2">
                  {s.status !== 'IN_PROGRESS' && s.status !== 'DONE' && (
                    <button className="text-blue-700 hover:underline text-xs" onClick={() => changeStage(s.id, 'IN_PROGRESS')}>iniciar</button>
                  )}
                  {s.status !== 'DONE' && (
                    <button className="text-emerald-700 hover:underline text-xs" onClick={() => changeStage(s.id, 'DONE')}>concluir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3 className="font-semibold p-4 border-b">Contas a receber</h3>
        <table className="table w-full">
          <thead><tr><th>Parcela</th><th>Vencimento</th><th>Previsto</th><th>Pago</th><th>Status</th><th>Pago em</th></tr></thead>
          <tbody>
            {data.receivables.map((r: any) => (
              <tr key={r.id}>
                <td>{r.installment}/{r.totalInstallments}</td>
                <td>{dt(r.dueDate)}</td>
                <td>{brl(r.expectedAmount)}</td>
                <td>{brl(r.paidAmount)}</td>
                <td><span className={`badge ${PAY_STATUS_COLOR[r.status]}`}>{PAY_STATUS_LABEL[r.status]}</span></td>
                <td>{dt(r.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
