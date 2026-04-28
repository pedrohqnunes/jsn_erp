'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { PAY_STATUS_COLOR, PAY_STATUS_LABEL, PAYMENT_METHOD_LABEL, RECURRING_FREQUENCY_LABEL } from '@/lib/labels';

export default function PagarPage() {
  const [filter, setFilter] = useState('');
  const { data, mutate } = useSWR<any[]>(`/payables${filter ? `?status=${filter}` : ''}`, fetcher);
  const [createOpen, setCreateOpen] = useState(false);
  const [paying, setPaying] = useState<any>(null);

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        subtitle="Despesas, plano de contas e recorrência"
        actions={<button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Nova despesa</button>}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'PENDING', 'OVERDUE', 'PAID', 'CANCELED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn ${filter === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>
            {s ? PAY_STATUS_LABEL[s] : 'Todos'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Descrição</th><th>Categoria</th><th>Vencimento</th>
              <th>Previsto</th><th>Pago</th><th>Status</th><th>Recorrente</th><th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.description}</td>
                <td>{p.category}</td>
                <td>{dt(p.dueDate)}</td>
                <td>{brl(p.expectedAmount)}</td>
                <td>{brl(p.paidAmount)}</td>
                <td><span className={`badge ${PAY_STATUS_COLOR[p.status]}`}>{PAY_STATUS_LABEL[p.status]}</span></td>
                <td>{p.recurring ? (RECURRING_FREQUENCY_LABEL[p.recurringFrequency] ?? p.recurringFrequency) : '-'}</td>
                <td>
                  {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                    <button className="btn-primary text-xs" onClick={() => setPaying(p)}>Pagar</button>
                  )}
                </td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-slate-500">Nenhuma despesa</td></tr>}
          </tbody>
        </table>
      </div>

      <CreatePayableModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={async () => { setCreateOpen(false); await mutate(); }} />
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
        <div className="col-span-2 flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" onChange={(e) => setForm((f: any) => ({ ...f, recurring: e.target.checked }))} />
            Recorrente
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
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
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
          <div className="text-sm text-slate-600">
            <div><strong>{target.description}</strong></div>
            <div>Vence {dt(target.dueDate)} • Previsto: <strong>{brl(target.expectedAmount)}</strong></div>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" type="submit">Confirmar</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
