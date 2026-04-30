'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import MarginBar from '@/components/ui/MarginBar';
import { OS_STATUS_COLOR, OS_STATUS_LABEL } from '@/lib/labels';

export default function OSListPage() {
  const [filter, setFilter] = useState<string>('');
  const { data, mutate } = useSWR<any[]>(`/service-orders${filter ? `?status=${filter}` : ''}`, fetcher);
  const [editing, setEditing] = useState<any>(null);

  async function deleteOS(o: any) {
    if (!confirm(`Excluir OS #${String(o.number).padStart(5, '0')}?`)) return;
    try {
      await api(`/service-orders/${o.id}`, { method: 'DELETE' });
      await mutate();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Pipeline operacional"
        icon={ClipboardList}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterBtn cur={filter} v="" set={setFilter}>Todas</FilterBtn>
        {Object.entries(OS_STATUS_LABEL).map(([k, v]) => (
          <FilterBtn key={k} cur={filter} v={k} set={setFilter}>{v}</FilterBtn>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr><th>Nº</th><th>Cliente</th><th>Descrição</th><th>Status</th><th className="num">Total</th><th>Margem</th><th>Criada</th><th /></tr>
            </thead>
            <tbody>
              {(data ?? []).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/ordens-servico/${o.id}`} className="font-semibold text-brand-600 hover:text-brand-700 tabular">
                      #{String(o.number).padStart(5, '0')}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="avatar w-7 h-7">{(o.client.name ?? '?').slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium text-ink">{o.client.name}</span>
                    </div>
                  </td>
                  <td className="max-w-xs truncate text-ink-muted">{o.description}</td>
                  <td><span className={OS_STATUS_COLOR[o.status]}>{OS_STATUS_LABEL[o.status]}</span></td>
                  <td className="num font-semibold">{brl(o.totalValue)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <MarginBar pct={Number(o.marginPct)} />
                      <span className="text-[11px] text-ink-subtle tabular whitespace-nowrap">{brl(o.margin)}</span>
                    </div>
                  </td>
                  <td className="text-ink-muted text-[12.5px]">{dt(o.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      {o.status !== 'FINISHED' && o.status !== 'CANCELED' && (
                        <button className="btn-ghost text-[11px] py-1 px-2.5" onClick={() => setEditing(o)}>Editar</button>
                      )}
                      <button className="btn-danger text-[11px] py-1 px-2.5" onClick={() => deleteOS(o)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState icon={ClipboardList} title="Nenhuma OS" description="Aprove um orçamento para gerar uma OS." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <EditOSModal
        key={editing?.id}
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => { setEditing(null); await mutate(); }}
      />
    </div>
  );
}

function FilterBtn({ cur, v, set, children }: any) {
  const active = cur === v;
  return (
    <button
      onClick={() => set(v)}
      className={active ? 'chip-active' : 'chip'}
    >
      {children}
    </button>
  );
}

function EditOSModal({ target, onClose, onSaved }: any) {
  const [description, setDescription] = useState(target?.description ?? '');
  const [notes, setNotes] = useState(target?.productionNotes ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/service-orders/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ description, productionNotes: notes || undefined }),
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={!!target} title="Editar OS" onClose={onClose}>
      {target && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Descrição</label>
            <textarea className="input" rows={3} required value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Notas de produção</label>
            <textarea className="input" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Salvar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
