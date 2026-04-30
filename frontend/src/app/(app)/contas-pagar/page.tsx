'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, AlertCircle, Clock, TrendingDown, Repeat } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { PAY_STATUS_COLOR, PAY_STATUS_LABEL, PAYMENT_METHOD_LABEL, RECURRING_FREQUENCY_LABEL } from '@/lib/labels';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isThisWeek(date: Date, today: Date) {
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return date >= today && date <= end;
}

export default function PagarPage() {
  const [filter, setFilter] = useState('');
  const { data, mutate } = useSWR<any[]>(`/payables${filter ? `?status=${filter}` : ''}`, fetcher);
  const { data: allData } = useSWR<any[]>('/payables', fetcher);
  const [createOpen, setCreateOpen] = useState(false);
  const [paying, setPaying] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = (allData ?? []).filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE');
  const dueToday = pending.filter((p) => isSameDay(new Date(p.dueDate), today));
  const dueWeek = pending.filter((p) => {
    const d = new Date(p.dueDate);
    return isThisWeek(d, today) && !isSameDay(d, today);
  });

  const totalToday = dueToday.reduce((s, p) => s + Number(p.expectedAmount), 0);
  const totalWeek  = dueWeek.reduce((s, p) => s + Number(p.expectedAmount), 0);

  async function deletePayable(p: any) {
    if (!confirm(`Excluir "${p.description}"?`)) return;
    try {
      await api(`/payables/${p.id}`, { method: 'DELETE' });
      await mutate();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Despesas, plano de contas e recorrência"
        icon={TrendingDown}
        actions={<button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={15} /> Nova despesa</button>}
      />

      <AnimatePresence>
        {dueToday.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 rounded-2xl border border-rose-200 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgb(254 242 242) 0%, rgb(255 255 255) 80%)' }}
          >
            <span className="absolute inset-x-0 top-0 h-px hairline-danger" />
            <div className="flex items-center gap-2 mb-3 text-rose-700 font-semibold">
              <AlertCircle size={15} className="animate-pulse-glow" />
              <span>Vencendo hoje ({dueToday.length})</span>
              <span className="ml-auto text-sm font-bold tabular">{brl(totalToday)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {dueToday.map((p) => (
                <div key={p.id} className="bg-surface-card border border-rose-200/70 rounded-xl px-3 py-2.5 text-sm
                                          hover:shadow-sm hover:border-rose-300 transition-all">
                  <div className="font-medium text-ink truncate">{p.description}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-rose-600 font-semibold tabular">{brl(p.expectedAmount)}</span>
                    {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                      <button className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                        onClick={() => setPaying(p)}>
                        Pagar →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {dueWeek.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 rounded-2xl border border-amber-200 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgb(255 251 235) 0%, rgb(255 255 255) 80%)' }}
          >
            <span className="absolute inset-x-0 top-0 h-px hairline-warning" />
            <div className="flex items-center gap-2 mb-3 text-amber-700 font-semibold">
              <Clock size={15} />
              <span>Vencendo esta semana ({dueWeek.length})</span>
              <span className="ml-auto text-sm font-bold tabular">{brl(totalWeek)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {dueWeek.map((p) => (
                <div key={p.id} className="bg-surface-card border border-amber-200/70 rounded-xl px-3 py-2.5 text-sm
                                          hover:shadow-sm hover:border-amber-300 transition-all">
                  <div className="font-medium text-ink truncate">{p.description}</div>
                  <div className="text-[11px] text-ink-subtle mt-0.5">{dt(p.dueDate)}</div>
                  <div className="text-amber-700 font-semibold tabular mt-1">{brl(p.expectedAmount)}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'PENDING', 'OVERDUE', 'PAID', 'CANCELED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={filter === s ? 'chip-active' : 'chip'}>
            {s ? PAY_STATUS_LABEL[s] : 'Todos'}
          </button>
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
              <tr>
                <th>Descrição</th><th>Categoria</th><th>Vencimento</th>
                <th className="num">Previsto</th><th className="num">Pago</th><th>Status</th><th>Recorrente</th><th />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => {
                const due = new Date(p.dueDate);
                const isUrgent = (p.status === 'PENDING' || p.status === 'OVERDUE') && due <= new Date(today.getTime() + 86400000 * 2);
                return (
                  <tr key={p.id} className={isUrgent ? 'relative' : ''}>
                    <td className="font-medium relative">
                      {isUrgent && <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-rose-500 rounded-full" />}
                      {p.description}
                    </td>
                    <td className="text-ink-muted text-[12.5px]">{p.category}</td>
                    <td className="text-ink-muted text-[12.5px]">{dt(p.dueDate)}</td>
                    <td className="num font-semibold">{brl(p.expectedAmount)}</td>
                    <td className="num text-ink-muted">{brl(p.paidAmount)}</td>
                    <td><span className={PAY_STATUS_COLOR[p.status]}>{PAY_STATUS_LABEL[p.status]}</span></td>
                    <td>
                      {p.recurring ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
                          <Repeat size={11} /> {RECURRING_FREQUENCY_LABEL[p.recurringFrequency] ?? p.recurringFrequency}
                        </span>
                      ) : <span className="text-ink-subtle">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                          <button className="btn-primary text-[11px] py-1 px-2.5" onClick={() => setPaying(p)}>Pagar</button>
                        )}
                        {p.status !== 'PAID' && (
                          <button className="btn-icon hover:text-brand-600" title="Editar"
                            onClick={() => setEditing(p)}>
                            <Pencil size={14} />
                          </button>
                        )}
                        <button className="btn-icon hover:text-rose-600" title="Excluir"
                          onClick={() => deletePayable(p)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data && data.length === 0 && (
                <tr><td colSpan={8} className="p-0">
                  <EmptyState icon={TrendingDown} title="Nenhuma despesa" description="Adicione despesas para começar." />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <CreatePayableModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={async () => { setCreateOpen(false); await mutate(); }} />
      <EditPayableModal key={editing?.id} target={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await mutate(); }} />
      <PayPayableModal target={paying} onClose={() => setPaying(null)} onPaid={async () => { setPaying(null); await mutate(); }} />
    </div>
  );
}

function CreatePayableModal({ open, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>({
    description: '', category: 'Operacional', dueDate: new Date().toISOString().slice(0, 10),
    expectedAmount: 0, recurring: false, recurringFrequency: 'MONTHLY',
  });
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        expectedAmount: Number(form.expectedAmount),
        recurringFrequency: form.recurring ? form.recurringFrequency : undefined,
      };
      await api('/payables', { method: 'POST', body: JSON.stringify(payload) });
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title="Nova conta a pagar" onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Descrição</label>
          <input className="input" required onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="label">Categoria (plano de contas)</label>
          <input className="input" defaultValue="Operacional" onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))} />
        </div>
        <div>
          <label className="label">Conta / Banco</label>
          <input className="input" onChange={(e) => setForm((f: any) => ({ ...f, account: e.target.value }))} />
        </div>
        <div>
          <label className="label">Vencimento</label>
          <input className="input" type="date" required defaultValue={form.dueDate}
            onChange={(e) => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <div>
          <label className="label">Valor previsto</label>
          <input className="input" type="number" step="0.01" required onChange={(e) => setForm((f: any) => ({ ...f, expectedAmount: e.target.value }))} />
        </div>
        <div className="col-span-2 flex items-center gap-3 p-3 rounded-xl border border-app bg-app-subtle">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-ink">
            <input type="checkbox" onChange={(e) => setForm((f: any) => ({ ...f, recurring: e.target.checked }))} />
            <Repeat size={13} className="text-ink-subtle" /> Recorrente
          </label>
          {form.recurring && (
            <select className="input max-w-xs" defaultValue="MONTHLY"
              onChange={(e) => setForm((f: any) => ({ ...f, recurringFrequency: e.target.value }))}>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensal</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="YEARLY">Anual</option>
            </select>
          )}
        </div>
        <div className="col-span-2">
          <label className="label">Observações</label>
          <textarea className="input" rows={2} onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
        </div>
        {error && (
          <div className="col-span-2 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}

function EditPayableModal({ target, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(target ? {
    description: target.description,
    category: target.category,
    account: target.account ?? '',
    dueDate: new Date(target.dueDate).toISOString().slice(0, 10),
    expectedAmount: target.expectedAmount,
    notes: target.notes ?? '',
  } : {});
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/payables/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, expectedAmount: Number(form.expectedAmount) }),
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={!!target} title="Editar conta a pagar" onClose={onClose} size="lg">
      {target && (
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <input className="input" required value={form.description}
              onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <input className="input" value={form.category}
              onChange={(e) => setForm((f: any) => ({ ...f, category: e.target.value }))} />
          </div>
          <div>
            <label className="label">Conta / Banco</label>
            <input className="input" value={form.account}
              onChange={(e) => setForm((f: any) => ({ ...f, account: e.target.value }))} />
          </div>
          <div>
            <label className="label">Vencimento</label>
            <input className="input" type="date" required value={form.dueDate}
              onChange={(e) => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Valor previsto</label>
            <input className="input" type="number" step="0.01" required value={form.expectedAmount}
              onChange={(e) => setForm((f: any) => ({ ...f, expectedAmount: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes}
              onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && (
            <div className="col-span-2 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Salvar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PayPayableModal({ target, onClose, onPaid }: any) {
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/payables/${target.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ paidAmount: Number(paidAmount), paidAt, paymentMethod }),
      });
      onPaid();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={!!target} title="Registrar pagamento" onClose={onClose}>
      {target && (
        <form onSubmit={submit} className="space-y-3">
          <div className="rounded-xl border border-app bg-app-subtle p-3 text-sm">
            <div className="font-semibold text-ink">{target.description}</div>
            <div className="text-[12.5px] text-ink-muted mt-1">
              Vence {dt(target.dueDate)} · Previsto: <strong className="text-ink tabular">{brl(target.expectedAmount)}</strong>
            </div>
          </div>
          <div>
            <label className="label">Valor pago</label>
            <input className="input" type="number" step="0.01" required
              defaultValue={target.expectedAmount}
              onChange={(e) => setPaidAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Data</label>
            <input className="input" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div>
            <label className="label">Forma</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Confirmar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
