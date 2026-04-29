'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from '@/lib/labels';

export default function OrcamentosPage() {
  const { data, mutate } = useSWR<any[]>('/quotes', fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function deleteQuote(q: any) {
    if (!confirm(`Excluir orçamento #${String(q.number).padStart(5, '0')}?`)) return;
    try {
      await api(`/quotes/${q.id}`, { method: 'DELETE' });
      await mutate();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Pipeline comercial - itens, custo e margem"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo orçamento
          </button>
        }
      />

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Nº</th><th>Cliente</th><th>Status</th>
              <th>Total</th><th>Margem</th><th>Emitido</th><th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((q) => (
              <tr key={q.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/orcamentos/${q.id}`} className="font-medium text-brand-700 hover:underline">
                    #{String(q.number).padStart(5, '0')}
                  </Link>
                </td>
                <td>{q.client.name}</td>
                <td><span className={`badge ${QUOTE_STATUS_COLOR[q.status]}`}>{QUOTE_STATUS_LABEL[q.status]}</span></td>
                <td>{brl(q.totalValue)}</td>
                <td>{brl(q.margin)} ({Number(q.marginPct).toFixed(1)}%)</td>
                <td>{dt(q.issuedAt)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {q.status === 'PENDING' && (
                      <button className="text-slate-500 hover:text-brand-700" title="Editar"
                        onClick={() => { setEditing(q); setOpen(true); }}>
                        <Pencil size={14} />
                      </button>
                    )}
                    <button className="text-slate-500 hover:text-red-600" title="Excluir"
                      onClick={() => deleteQuote(q)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Sem orçamentos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <QuoteModal
        key={editing?.id ?? 'new'}
        open={open}
        editing={editing}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSaved={async () => { setOpen(false); setEditing(null); await mutate(); }}
      />
    </div>
  );
}

function QuoteModal({ open, editing, onClose, onSaved }: any) {
  const { data: clients } = useSWR<any[]>(open ? '/clients' : null, fetcher);
  const [clientId, setClientId] = useState(editing?.clientId ?? '');
  const [validUntil, setValidUntil] = useState(
    editing?.validUntil ? new Date(editing.validUntil).toISOString().slice(0, 10) : ''
  );
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [items, setItems] = useState<any[]>(
    editing?.items?.length
      ? editing.items.map((it: any) => ({
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unitCost: it.unitCost ?? 0,
        }))
      : [{ description: '', quantity: 1, unitPrice: 0, unitCost: 0 }]
  );
  const [error, setError] = useState<string | null>(null);

  const totalValue = items.reduce((a, it) => a + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);
  const totalCost = items.reduce((a, it) => a + Number(it.quantity || 0) * Number(it.unitCost || 0), 0);
  const margin = totalValue - totalCost;
  const marginPct = totalValue > 0 ? (margin / totalValue) * 100 : 0;

  function update(i: number, field: string, value: any) {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    setItems(copy);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        clientId,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          unitCost: Number(it.unitCost ?? 0),
        })),
      };
      if (editing?.id) {
        await api(`/quotes/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/quotes', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title={editing ? 'Editar orçamento' : 'Novo orçamento'} onClose={onClose} size="xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cliente</label>
            <select className="input" required value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Selecione...</option>
              {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Válido até</label>
            <input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Itens</h4>
            <button type="button" className="btn-ghost text-xs"
              onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, unitCost: 0 }])}>
              + Adicionar item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Descrição</th><th>Qtd</th><th>Vlr unit.</th>
                  <th>Custo unit.</th><th>Total</th><th />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td><input className="input" required value={it.description}
                      onChange={(e) => update(i, 'description', e.target.value)} /></td>
                    <td className="w-24"><input className="input" type="number" step="0.001" min="0" required
                      value={it.quantity} onChange={(e) => update(i, 'quantity', e.target.value)} /></td>
                    <td className="w-32"><input className="input" type="number" step="0.01" min="0" required
                      value={it.unitPrice} onChange={(e) => update(i, 'unitPrice', e.target.value)} /></td>
                    <td className="w-32"><input className="input" type="number" step="0.01" min="0"
                      value={it.unitCost} onChange={(e) => update(i, 'unitCost', e.target.value)} /></td>
                    <td className="w-32">{brl(Number(it.quantity || 0) * Number(it.unitPrice || 0))}</td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="text-red-600 hover:underline text-xs"
                          onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                          remover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
          <div><div className="text-xs text-slate-500">Total</div><div className="font-semibold">{brl(totalValue)}</div></div>
          <div><div className="text-xs text-slate-500">Custo</div><div className="font-semibold">{brl(totalCost)}</div></div>
          <div><div className="text-xs text-slate-500">Margem</div><div className="font-semibold">{brl(margin)} ({marginPct.toFixed(1)}%)</div></div>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
