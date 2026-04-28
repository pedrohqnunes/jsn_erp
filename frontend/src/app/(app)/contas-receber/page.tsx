'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { api, brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { PAY_STATUS_COLOR, PAY_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/labels';

export default function ReceberPage() {
  const [filter, setFilter] = useState('');
  const { data, mutate } = useSWR<any[]>(`/receivables${filter ? `?status=${filter}` : ''}`, fetcher);
  const [paying, setPaying] = useState<any>(null);

  return (
    <div>
      <PageHeader title="Contas a Receber" subtitle="Geradas automaticamente a partir das OS" />

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
              <th>Cliente</th><th>OS</th><th>Parcela</th><th>Vencimento</th>
              <th>Previsto</th><th>Pago</th><th>Status</th><th>Forma</th><th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.serviceOrder.client.name}</td>
                <td>#{String(r.serviceOrder.number).padStart(5, '0')}</td>
                <td>{r.installment}/{r.totalInstallments}</td>
                <td>{dt(r.dueDate)}</td>
                <td>{brl(r.expectedAmount)}</td>
                <td>{brl(r.paidAmount)}</td>
                <td><span className={`badge ${PAY_STATUS_COLOR[r.status]}`}>{PAY_STATUS_LABEL[r.status]}</span></td>
                <td>{r.paidAt ? PAYMENT_METHOD_LABEL[r.paymentMethod] : '-'}</td>
                <td>
                  {(r.status === 'PENDING' || r.status === 'OVERDUE') && (
                    <button className="btn-primary text-xs" onClick={() => setPaying(r)}>Receber</button>
                  )}
                </td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={9} className="text-center py-6 text-slate-500">Nada por aqui</td></tr>}
          </tbody>
        </table>
      </div>

      <PayModal target={paying} onClose={() => setPaying(null)} onPaid={async () => { setPaying(null); await mutate(); }} />
    </div>
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
          <div className="text-sm text-slate-600">
            <div>Cliente: <strong>{target.serviceOrder?.client?.name}</strong></div>
            <div>Parcela {target.installment}/{target.totalInstallments} - vence {dt(target.dueDate)}</div>
            <div>Previsto: <strong>{brl(target.expectedAmount)}</strong></div>
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
