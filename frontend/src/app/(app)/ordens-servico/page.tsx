'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
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
      <PageHeader title="Ordens de Serviço" subtitle="Pipeline operacional" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterBtn cur={filter} v="" set={setFilter}>Todas</FilterBtn>
        {Object.entries(OS_STATUS_LABEL).map(([k, v]) => (
          <FilterBtn key={k} cur={filter} v={k} set={setFilter}>{v}</FilterBtn>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr><th>Nº</th><th>Cliente</th><th>Descrição</th><th>Status</th><th>Total</th><th>Margem</th><th>Criada</th><th /></tr>
          </thead>
          <tbody>
            {(data ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/ordens-servico/${o.id}`} className="font-medium text-brand-700 hover:underline">
                    #{String(o.number).padStart(5, '0')}
                  </Link>
                </td>
                <td>{o.client.name}</td>
                <td className="max-w-xs truncate">{o.description}</td>
                <td><span className={`badge ${OS_STATUS_COLOR[o.status]}`}>{OS_STATUS_LABEL[o.status]}</span></td>
                <td>{brl(o.totalValue)}</td>
                <td>{brl(o.margin)} ({Number(o.marginPct).toFixed(1)}%)</td>
                <td>{dt(o.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {o.status !== 'FINISHED' && o.status !== 'CANCELED' && (
                      <button className="text-slate-500 hover:text-brand-700" title="Editar"
                        onClick={() => setEditing(o)}>
                        <Pencil size={14} />
                      </button>
                    )}
                    <button className="text-slate-500 hover:text-red-600" title="Excluir"
                      onClick={() => deleteOS(o)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">Nenhuma OS</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
      className={`btn ${active ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Salvar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
