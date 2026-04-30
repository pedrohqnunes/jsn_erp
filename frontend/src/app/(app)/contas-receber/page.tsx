'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, XCircle, TrendingUp } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { PAY_STATUS_COLOR, PAY_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/labels';

export default function ReceberPage() {
  const [filter, setFilter] = useState('');
  const { data, mutate } = useSWR<any[]>(`/receivables${filter ? `?status=${filter}` : ''}`, fetcher);
  const [paying, setPaying] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);

  async function cancel(r: any) {
    if (!confirm(`Cancelar parcela ${r.installment}/${r.totalInstallments} de ${r.serviceOrder?.client?.name}?`)) return;
    try {
      await api(`/receivables/${r.id}/cancel`, { method: 'PATCH' });
      await mutate();
    } catch (e: any) { alert(e.message); }
  }

  return (
    <div>
      <PageHeader
        title="Contas a Receber"
        subtitle="Geradas automaticamente a partir das OS"
        icon={TrendingUp}
      />

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
                <th>Cliente</th><th>OS</th><th>Parcela</th><th>Vencimento</th>
                <th className="num">Previsto</th><th className="num">Pago</th><th>Status</th><th>Forma</th><th />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="avatar w-7 h-7">{(r.serviceOrder.client.name ?? '?').slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium text-ink">{r.serviceOrder.client.name}</span>
                    </div>
                  </td>
                  <td className="text-brand-600 font-semibold tabular">#{String(r.serviceOrder.number).padStart(5, '0')}</td>
                  <td className="text-ink-muted text-[12.5px]">{r.installment}/{r.totalInstallments}</td>
                  <td className="text-ink-muted text-[12.5px]">{dt(r.dueDate)}</td>
                  <td className="num font-semibold">{brl(r.expectedAmount)}</td>
                  <td className="num text-ink-muted">{brl(r.paidAmount)}</td>
                  <td><span className={PAY_STATUS_COLOR[r.status]}>{PAY_STATUS_LABEL[r.status]}</span></td>
                  <td className="text-ink-muted text-[12.5px]">{r.paidAt ? PAYMENT_METHOD_LABEL[r.paymentMethod] : '—'}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      {(r.status === 'PENDING' || r.status === 'OVERDUE') && (
                        <>
                          <button className="btn-primary text-[11px] py-1 px-2.5" onClick={() => setPaying(r)}>Receber</button>
                          <button className="btn-icon hover:text-brand-600" title="Editar"
                            onClick={() => setEditing(r)}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn-icon hover:text-rose-600" title="Cancelar"
                            onClick={() => cancel(r)}>
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={9} className="p-0">
                  <EmptyState icon={TrendingUp} title="Nada por aqui" description="Parcelas são criadas automaticamente quando uma OS é gerada." />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <EditReceivableModal key={editing?.id} target={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await mutate(); }} />
      <PayModal target={paying} onClose={() => setPaying(null)} onPaid={async () => { setPaying(null); await mutate(); }} />
    </div>
  );
}

function EditReceivableModal({ target, onClose, onSaved }: any) {
  const [dueDate, setDueDate] = useState(target ? new Date(target.dueDate).toISOString().slice(0, 10) : '');
  const [expectedAmount, setExpectedAmount] = useState(target?.expectedAmount ?? 0);
  const [notes, setNotes] = useState(target?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/receivables/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ dueDate, expectedAmount: Number(expectedAmount), notes: notes || undefined }),
      });
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={!!target} title="Editar parcela" onClose={onClose}>
      {target && (
        <form onSubmit={submit} className="space-y-3">
          <div className="rounded-xl border border-app bg-app-subtle p-3 text-sm">
            <div className="text-[12.5px] text-ink-muted">Parcela <strong className="text-ink">{target.installment}/{target.totalInstallments}</strong></div>
            <div className="text-[12.5px] text-ink-muted mt-0.5">Cliente: <strong className="text-ink">{target.serviceOrder?.client?.name}</strong></div>
          </div>
          <div>
            <label className="label">Vencimento</label>
            <input className="input" type="date" required value={dueDate}
              onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Valor previsto</label>
            <input className="input" type="number" step="0.01" required value={expectedAmount}
              onChange={(e) => setExpectedAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={notes}
              onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Salvar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PayModal({ target, onClose, onPaid }: any) {
  const [paidAmount, setPaidAmount] = useState<number>(target?.expectedAmount ?? 0);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [bank, setBank] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api(`/receivables/${target.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          paidAmount: Number(paidAmount),
          paidAt,
          paymentMethod,
          bank: bank || undefined,
        }),
      });
      onPaid();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={!!target} title="Registrar recebimento" onClose={onClose}>
      {target && (
        <form onSubmit={submit} className="space-y-3">
          <div className="rounded-xl border border-app bg-app-subtle p-3 text-sm">
            <div className="font-semibold text-ink">{target.serviceOrder?.client?.name}</div>
            <div className="text-[12.5px] text-ink-muted mt-1">
              Parcela {target.installment}/{target.totalInstallments} · vence {dt(target.dueDate)}
            </div>
            <div className="text-[12.5px] text-ink-muted mt-0.5">
              Previsto: <strong className="text-ink tabular">{brl(target.expectedAmount)}</strong>
            </div>
          </div>
          <div>
            <label className="label">Valor recebido</label>
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
          <div>
            <label className="label">Banco / Conta</label>
            <input className="input" value={bank} onChange={(e) => setBank(e.target.value)} />
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
