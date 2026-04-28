'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api, brl, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from '@/lib/labels';

export default function ProducaoPage() {
  const { data, mutate } = useSWR<any>('/production/board', fetcher);

  if (!data) return <div>Carregando...</div>;

  async function moveStage(stageId: string, status: string) {
    await api(`/production/stages/${stageId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await mutate();
  }

  return (
    <div>
      <PageHeader title="Produção" subtitle="Fila operacional - kanban por OS" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Column title="Aguardando produção" items={data.WAITING_PRODUCTION} moveStage={moveStage} />
        <Column title="Em produção" items={data.IN_PRODUCTION} moveStage={moveStage} />
      </div>
    </div>
  );
}

function Column({ title, items, moveStage }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-slate-700">{title} <span className="text-slate-400 text-sm">({items.length})</span></h3>
      <div className="space-y-3">
        {items.length === 0 && <div className="card p-4 text-sm text-slate-500 text-center">Vazio</div>}
        {items.map((os: any) => (
          <div key={os.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <Link href={`/ordens-servico/${os.id}`} className="font-semibold text-brand-700 hover:underline">
                OS #{String(os.number).padStart(5, '0')}
              </Link>
              <span className="text-xs text-slate-500">{brl(os.totalValue)}</span>
            </div>
            <div className="text-sm text-slate-700 mb-3">{os.client.name}</div>
            <div className="space-y-1.5">
              {os.productionStages.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${STAGE_STATUS_COLOR[s.status]} text-[10px]`}>{STAGE_STATUS_LABEL[s.status]}</span>
                    <span>{s.name}</span>
                  </div>
                  <div className="space-x-2">
                    {s.status !== 'IN_PROGRESS' && s.status !== 'DONE' && (
                      <button className="text-blue-700 hover:underline" onClick={() => moveStage(s.id, 'IN_PROGRESS')}>▶</button>
                    )}
                    {s.status !== 'DONE' && (
                      <button className="text-emerald-700 hover:underline" onClick={() => moveStage(s.id, 'DONE')}>✓</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
