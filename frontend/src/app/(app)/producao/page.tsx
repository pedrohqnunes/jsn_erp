'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Clock, Box } from 'lucide-react';
import { api, brl, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from '@/lib/labels';

export default function ProducaoPage() {
  const { data, mutate } = useSWR<any>('/production/board', fetcher);

  if (!data) {
    return (
      <div>
        <PageHeader title="Produção" subtitle="Fila operacional — kanban por OS" icon={Hammer} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map(i => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-40 mb-4 rounded-md" />
              <div className="space-y-3">
                {[0,1,2].map(j => <div key={j} className="skeleton h-24 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  async function moveStage(stageId: string, status: string) {
    await api(`/production/stages/${stageId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await mutate();
  }

  const totalWaiting = data.WAITING_PRODUCTION.reduce((s: number, os: any) => s + Number(os.totalValue), 0);
  const totalInProd  = data.IN_PRODUCTION.reduce((s: number, os: any) => s + Number(os.totalValue), 0);

  return (
    <div>
      <PageHeader title="Produção" subtitle="Fila operacional — kanban por OS" icon={Hammer} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Column
          title="Aguardando produção"
          tone="amber"
          icon={Clock}
          items={data.WAITING_PRODUCTION}
          totalValue={totalWaiting}
          moveStage={moveStage}
        />
        <Column
          title="Em produção"
          tone="brand"
          icon={Hammer}
          items={data.IN_PRODUCTION}
          totalValue={totalInProd}
          moveStage={moveStage}
        />
      </div>
    </div>
  );
}

const TONE = {
  amber: {
    headerBg:  'bg-amber-500/10 border-amber-500/25',
    headerDot: 'bg-amber-500',
    iconWrap:  'bg-amber-500/15 text-amber-500 ring-amber-500/25',
    accent:    'hairline-warning',
  },
  brand: {
    headerBg:  'bg-brand-500/10 border-brand-500/25',
    headerDot: 'bg-brand-500',
    iconWrap:  'bg-brand-500/15 text-brand-500 ring-brand-500/25',
    accent:    'hairline-brand',
  },
};

function Column({
  title, tone, icon: Icon, items, totalValue, moveStage,
}: { title: string; tone: 'amber' | 'brand'; icon: any; items: any[]; totalValue: number; moveStage: (id: string, s: string) => Promise<void> }) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card relative overflow-hidden p-0"
    >
      <span className={`absolute inset-x-0 top-0 h-px ${t.accent} opacity-90`} />

      {/* column header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${t.headerBg}`}>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex w-8 h-8 rounded-lg items-center justify-center ring-1 ring-inset ${t.iconWrap}`}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
          <div>
            <div className="section-title">{title}</div>
            <div className="text-[11px] text-ink-subtle">
              {items.length} {items.length === 1 ? 'OS' : 'OS'} · <span className="tabular">{brl(totalValue)}</span>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full
                         bg-surface-card text-ink-muted ring-1 ring-app text-[12px] font-semibold tabular">
          {items.length}
        </span>
      </div>

      <div className="p-4 space-y-3 min-h-[140px]">
        <AnimatePresence>
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <EmptyState icon={Box} title="Vazio" description="Nenhuma OS nesta fase." />
            </motion.div>
          )}
          {items.map((os: any, i: number) => (
            <motion.div
              key={os.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="group relative rounded-xl border border-app bg-surface-card hover:shadow-pop hover:border-brand-500/40
                         transition-all duration-200 p-4 overflow-hidden"
            >
              {/* priority left ribbon */}
              <span className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${tone === 'amber' ? 'bg-amber-400' : 'bg-brand-500'}`} />

              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/ordens-servico/${os.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-700 tabular text-[14px]"
                >
                  OS #{String(os.number).padStart(5, '0')}
                </Link>
                <span className="text-[12px] font-bold tabular text-ink">{brl(os.totalValue)}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="avatar w-6 h-6 text-[10px]">{(os.client.name ?? '?').slice(0, 2).toUpperCase()}</span>
                <span className="text-[12.5px] text-ink-muted truncate">{os.client.name}</span>
              </div>

              <div className="space-y-1.5">
                {os.productionStages.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-md hover:bg-app-subtle transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={STAGE_STATUS_COLOR[s.status]}>{STAGE_STATUS_LABEL[s.status]}</span>
                      <span className="text-ink truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {s.status !== 'IN_PROGRESS' && s.status !== 'DONE' && (
                        <button className="btn-primary text-[11px] py-1 px-2.5" onClick={() => moveStage(s.id, 'IN_PROGRESS')}>Iniciar</button>
                      )}
                      {s.status !== 'DONE' && (
                        <button className="btn-success text-[11px] py-1 px-2.5" onClick={() => moveStage(s.id, 'DONE')}>Concluir</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
