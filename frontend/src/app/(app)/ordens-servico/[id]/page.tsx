'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, Play, Check, ArrowRight } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import MarginBar from '@/components/ui/MarginBar';
import {
  OS_STATUS_COLOR, OS_STATUS_LABEL, PAY_STATUS_COLOR, PAY_STATUS_LABEL,
  PAYMENT_TERMS_LABEL, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL,
} from '@/lib/labels';

export default function OSDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, mutate } = useSWR<any>(`/service-orders/${id}`, fetcher);

  if (!data) return <div className="text-ink-subtle text-sm">Carregando...</div>;

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

  const totalStages = data.productionStages.length;
  const doneStages = data.productionStages.filter((s: any) => s.status === 'DONE').length;
  const stageProgress = totalStages > 0 ? (doneStages / totalStages) * 100 : 0;

  return (
    <div>
      <PageHeader
        title={`OS #${String(data.number).padStart(5, '0')}`}
        subtitle={data.client.name}
        icon={ClipboardList}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 space-y-3 lg:col-span-1 relative overflow-hidden"
        >
          <span className="absolute inset-x-0 top-0 h-px hairline-brand opacity-80" />
          <div>
            <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Status</div>
            <span className={`mt-1.5 inline-flex ${OS_STATUS_COLOR[data.status]}`}>{OS_STATUS_LABEL[data.status]}</span>
          </div>
          <Stat label="Total" value={brl(data.totalValue)} mono strong />
          <Stat label="Custo" value={brl(data.totalCost)} mono />
          <div>
            <div className="flex justify-between text-[12.5px] mb-1.5">
              <span className="text-ink-muted">Margem</span>
              <span className="font-semibold text-emerald-600 tabular">{brl(data.margin)} ({Number(data.marginPct).toFixed(1)}%)</span>
            </div>
            <MarginBar pct={Number(data.marginPct)} showLabel={false} />
          </div>
          <div className="divider" />
          <Stat label="Pagamento" value={PAYMENT_TERMS_LABEL[data.paymentTerms] ?? data.paymentTerms} />
          <Stat label="Parcelas" value={String(data.installments)} />
          <Stat label="Início" value={dt(data.startedAt)} />
          <Stat label="Fim" value={dt(data.finishedAt)} />
          {data.quote && (
            <div className="pt-3 border-t border-app">
              <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-1.5">Orçamento de origem</div>
              <Link
                href={`/orcamentos/${data.quote.id}`}
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold tabular text-sm group"
              >
                #{String(data.quote.number).padStart(5, '0')}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="section-title">Descrição</h3>
            {totalStages > 0 && (
              <div className="text-right">
                <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Progresso etapas</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-ink tabular">{doneStages}/{totalStages}</span>
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border-soft))' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stageProgress}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{data.description}</p>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="card mb-5 overflow-hidden"
      >
        <h3 className="section-title px-5 py-4 border-b border-app">Etapas de produção</h3>
        <table className="table w-full">
          <thead><tr><th>Etapa</th><th>Status</th><th>Início</th><th>Fim</th><th /></tr></thead>
          <tbody>
            {data.productionStages.map((s: any) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td><span className={STAGE_STATUS_COLOR[s.status]}>{STAGE_STATUS_LABEL[s.status]}</span></td>
                <td className="text-ink-muted text-[12.5px]">{dt(s.startedAt)}</td>
                <td className="text-ink-muted text-[12.5px]">{dt(s.finishedAt)}</td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    {s.status !== 'IN_PROGRESS' && s.status !== 'DONE' && (
                      <button className="btn-icon hover:text-brand-600" title="Iniciar"
                        onClick={() => changeStage(s.id, 'IN_PROGRESS')}>
                        <Play size={13} />
                      </button>
                    )}
                    {s.status !== 'DONE' && (
                      <button className="btn-icon hover:text-emerald-600" title="Concluir"
                        onClick={() => changeStage(s.id, 'DONE')}>
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <h3 className="section-title px-5 py-4 border-b border-app">Contas a receber</h3>
        <table className="table w-full">
          <thead><tr><th>Parcela</th><th>Vencimento</th><th className="num">Previsto</th><th className="num">Pago</th><th>Status</th><th>Pago em</th></tr></thead>
          <tbody>
            {data.receivables.map((r: any) => (
              <tr key={r.id}>
                <td className="font-medium">{r.installment}/{r.totalInstallments}</td>
                <td className="text-ink-muted text-[12.5px]">{dt(r.dueDate)}</td>
                <td className="num">{brl(r.expectedAmount)}</td>
                <td className="num text-ink-muted">{brl(r.paidAmount)}</td>
                <td><span className={PAY_STATUS_COLOR[r.status]}>{PAY_STATUS_LABEL[r.status]}</span></td>
                <td className="text-ink-muted text-[12.5px]">{dt(r.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>
    </div>
  );
}

function Stat({ label, value, mono, strong }: { label: string; value: any; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between text-[12.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className={`${strong ? 'font-bold' : 'font-medium'} text-ink ${mono ? 'tabular' : ''}`}>{value}</span>
    </div>
  );
}
