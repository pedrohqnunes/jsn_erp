'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import MarginBar from '@/components/ui/MarginBar';
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

  const total = (data ?? []).length;
  const aprovados = (data ?? []).filter(q => q.status === 'APPROVED').length;
  const pendentes = (data ?? []).filter(q => q.status === 'PENDING').length;
  const rejeitados = (data ?? []).filter(q => q.status === 'REJECTED').length;

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Pipeline comercial — itens, custo e margem"
        icon={FileText}
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={15} /> Novo orçamento
          </button>
        }
      />

      {data && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <SmallStat label="Total" value={total} tone="brand" />
          <SmallStat label="Aprovados" value={aprovados} tone="success" />
          <SmallStat label="Pendentes" value={pendentes} tone="warning" />
          <SmallStat label="Rejeitados" value={rejeitados} tone="danger" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Nº</th><th>Cliente</th><th>Status</th>
                <th className="num">Total</th><th>Margem</th><th>Emitido</th><th />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/orcamentos/${q.id}`} className="font-semibold text-brand-600 hover:text-brand-700 tabular">
                      #{String(q.number).padStart(5, '0')}
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="avatar w-7 h-7">{(q.client.name ?? '?').slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium text-ink">{q.client.name}</span>
                    </div>
                  </td>
                  <td><span className={QUOTE_STATUS_COLOR[q.status]}>{QUOTE_STATUS_LABEL[q.status]}</span></td>
                  <td className="num font-semibold">{brl(q.totalValue)}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <MarginBar pct={Number(q.marginPct)} />
                      <span className="text-[11px] text-ink-subtle tabular whitespace-nowrap">{brl(q.margin)}</span>
                    </div>
                  </td>
                  <td className="text-ink-muted text-[12.5px]">{dt(q.issuedAt)}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      {q.status === 'PENDING' && (
                        <button className="btn-icon hover:text-brand-600" title="Editar"
                          onClick={() => { setEditing(q); setOpen(true); }}>
                          <Pencil size={14} />
                        </button>
                      )}
                      <button className="btn-icon hover:text-rose-600" title="Excluir"
                        onClick={() => deleteQuote(q)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Sem orçamentos ainda"
                      description="Comece criando seu primeiro orçamento."
                      action={
                        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
                          <Plus size={15} /> Novo orçamento
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

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

function SmallStat({ label, value, tone }: { label: string; value: number; tone: 'brand' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    brand:   { dot: 'bg-brand-500',   text: 'text-ink' },
    success: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
    warning: { dot: 'bg-amber-500',   text: 'text-amber-600' },
    danger:  { dot: 'bg-rose-500',    text: 'text-rose-600' },
  };
  return (
    <div className="card p-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${colors[tone].dot}`} />
        <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted">{label}</span>
      </div>
      <span className={`text-lg font-bold tabular ${colors[tone].text}`}>{value}</span>
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
      <form onSubmit={submit} className="space-y-5">
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
            <h4 className="text-[13px] font-semibold text-ink">Itens</h4>
            <button type="button" className="btn-ghost text-[11px] py-1 px-2"
              onClick={() => setItems([...items, { description: '', quantity: 1, unitPrice: 0, unitCost: 0 }])}>
              <Plus size={12} /> Adicionar item
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-app">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Descrição</th><th>Qtd</th><th>Vlr unit.</th>
                  <th>Custo unit.</th><th className="num">Total</th><th />
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
                    <td className="num font-semibold">{brl(Number(it.quantity || 0) * Number(it.unitPrice || 0))}</td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="btn-icon hover:text-rose-600"
                          onClick={() => setItems(items.filter((_, idx) => idx !== i))} title="Remover">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-app bg-app-subtle">
          <div>
            <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Total</div>
            <div className="text-lg font-bold text-ink tabular mt-1">{brl(totalValue)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Custo</div>
            <div className="text-lg font-bold text-ink-muted tabular mt-1">{brl(totalCost)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Margem</div>
            <div className="text-lg font-bold text-emerald-600 tabular mt-1">{brl(margin)}</div>
            <MarginBar pct={marginPct} className="mt-1.5" />
          </div>
        </div>

        <div>
          <label className="label">Observações</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
    </Modal>
  );
}
