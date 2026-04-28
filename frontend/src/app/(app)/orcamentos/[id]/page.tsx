'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, apiBlob, openBlob, brl, dt, fetcher, normalizePhone } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from '@/lib/labels';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, mutate } = useSWR<any>(`/quotes/${id}`, fetcher);
  const [convertOpen, setConvertOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!data) return <div>Carregando...</div>;

  async function reject() {
    if (!confirm('Rejeitar este orçamento?')) return;
    await api(`/quotes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'REJECTED' }) });
    await mutate();
  }

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const blob = await apiBlob(`/quotes/${id}/pdf`);
      openBlob(blob, `orcamento-${String(data.number).padStart(5, '0')}.pdf`);
    } catch (e: any) {
      alert(`Erro ao gerar PDF: ${e.message}`);
    } finally {
      setPdfLoading(false);
    }
  }

  function shareWhatsApp() {
    const phone = normalizePhone(data.client?.phone);
    if (!phone) {
      alert('Este cliente não possui telefone cadastrado.');
      return;
    }
    const num = String(data.number).padStart(5, '0');
    const validUntil = data.validUntil ? dt(data.validUntil) : null;
    const lines = [
      `Olá, ${data.client.name}!`,
      ``,
      `Segue o orçamento *#${num}* da JSN Pintura Eletrostática:`,
      ``,
      ...data.items.map((it: any) => `• ${it.description} (${Number(it.quantity)}x) — ${brl(it.totalPrice)}`),
      ``,
      `*Total: ${brl(data.totalValue)}*`,
      validUntil ? `Válido até: ${validUntil}` : null,
    ].filter((l) => l !== null).join('\n');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines)}`;
    window.open(url, '_blank', 'noopener');
  }

  return (
    <div>
      <PageHeader
        title={`Orçamento #${String(data.number).padStart(5, '0')}`}
        subtitle={data.client.name}
        actions={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={shareWhatsApp}>
              WhatsApp
            </button>
            <button className="btn-ghost" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? 'Gerando...' : 'PDF'}
            </button>
            {data.status === 'PENDING' && (
              <>
                <button className="btn-ghost" onClick={reject}>Rejeitar</button>
                <button className="btn-primary" onClick={() => setConvertOpen(true)}>Aprovar e gerar OS</button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Itens</h3>
          <table className="table w-full">
            <thead><tr><th>Descrição</th><th>Qtd</th><th>Vlr unit.</th><th>Custo</th><th>Total</th></tr></thead>
            <tbody>
              {data.items.map((it: any) => (
                <tr key={it.id}>
                  <td>{it.description}</td>
                  <td>{Number(it.quantity)}</td>
                  <td>{brl(it.unitPrice)}</td>
                  <td>{brl(it.totalCost)}</td>
                  <td>{brl(it.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-5 space-y-3">
          <div>
            <div className="text-xs text-slate-500 uppercase">Status</div>
            <span className={`badge ${QUOTE_STATUS_COLOR[data.status]} mt-1`}>{QUOTE_STATUS_LABEL[data.status]}</span>
          </div>
          <Stat label="Total" value={brl(data.totalValue)} />
          <Stat label="Custo" value={brl(data.totalCost)} />
          <Stat label="Margem" value={`${brl(data.margin)} (${Number(data.marginPct).toFixed(1)}%)`} />
          <Stat label="Emitido" value={dt(data.issuedAt)} />
          {data.validUntil && <Stat label="Válido até" value={dt(data.validUntil)} />}
          {data.serviceOrder && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 uppercase mb-1">OS gerada</div>
              <Link href={`/ordens-servico/${data.serviceOrder.id}`} className="text-brand-700 hover:underline">
                #{String(data.serviceOrder.number).padStart(5, '0')}
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConvertModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        onConverted={async (osId: string) => {
          setConvertOpen(false);
          router.push(`/ordens-servico/${osId}`);
        }}
        quoteId={id as string}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ConvertModal({ open, onClose, onConverted, quoteId }: any) {
  const [paymentTerms, setPaymentTerms] = useState<'CASH' | 'INSTALLMENTS' | 'ON_DELIVERY'>('CASH');
  const [installments, setInstallments] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const os = await api<any>(`/quotes/${quoteId}/convert`, {
        method: 'POST',
        body: JSON.stringify({
          paymentTerms,
          installments: paymentTerms === 'INSTALLMENTS' ? Number(installments) : 1,
          firstDueDate,
        }),
      });
      onConverted(os.id);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title="Aprovar e gerar OS" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Forma de pagamento</label>
          <select className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as any)}>
            <option value="CASH">À vista</option>
            <option value="INSTALLMENTS">Parcelado</option>
            <option value="ON_DELIVERY">Na entrega</option>
          </select>
        </div>
        {paymentTerms === 'INSTALLMENTS' && (
          <div>
            <label className="label">Nº de parcelas</label>
            <input className="input" type="number" min={1} value={installments} onChange={(e) => setInstallments(Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="label">1º vencimento</label>
          <input className="input" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Confirmar</button>
        </div>
      </form>
    </Modal>
  );
}
