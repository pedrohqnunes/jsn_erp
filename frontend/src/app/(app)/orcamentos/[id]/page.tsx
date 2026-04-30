'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, MessageCircle, Download, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, apiBlob, openBlob, brl, dt, fetcher, normalizePhone } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import MarginBar from '@/components/ui/MarginBar';
import ProgressRing from '@/components/ui/ProgressRing';
import { QUOTE_STATUS_COLOR, QUOTE_STATUS_LABEL } from '@/lib/labels';

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, mutate } = useSWR<any>(`/quotes/${id}`, fetcher);
  const [convertOpen, setConvertOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!data) return <div className="text-ink-subtle text-sm">Carregando...</div>;

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

  const marginPct = Number(data.marginPct) || 0;

  return (
    <div>
      <PageHeader
        title={`Orçamento #${String(data.number).padStart(5, '0')}`}
        subtitle={data.client.name}
        icon={FileText}
        actions={
          <div className="flex gap-2 flex-wrap">
            <button className="btn-ghost" onClick={shareWhatsApp}>
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button className="btn-ghost" onClick={downloadPdf} disabled={pdfLoading}>
              <Download size={14} /> {pdfLoading ? 'Gerando...' : 'PDF'}
            </button>
            {data.status === 'PENDING' && (
              <>
                <button className="btn-ghost" onClick={reject}>
                  <X size={14} /> Rejeitar
                </button>
                <button className="btn-primary" onClick={() => setConvertOpen(true)}>
                  <CheckCircle2 size={14} /> Aprovar e gerar OS
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="card overflow-hidden lg:col-span-2"
        >
          <div className="px-5 py-4 border-b border-app flex items-center justify-between">
            <h3 className="section-title">Itens</h3>
            <span className="text-[11px] text-ink-subtle">{data.items.length} {data.items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead><tr><th>Descrição</th><th className="num">Qtd</th><th className="num">Vlr unit.</th><th className="num">Custo</th><th className="num">Total</th></tr></thead>
              <tbody>
                {data.items.map((it: any) => (
                  <tr key={it.id}>
                    <td className="font-medium">{it.description}</td>
                    <td className="num text-ink-muted">{Number(it.quantity)}</td>
                    <td className="num">{brl(it.unitPrice)}</td>
                    <td className="num text-ink-muted">{brl(it.totalCost)}</td>
                    <td className="num font-semibold">{brl(it.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="card p-5 relative overflow-hidden"
        >
          <span className="absolute inset-x-0 top-0 h-px hairline-brand opacity-80" />
          <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-1.5">Status</div>
          <div className="mb-5"><span className={QUOTE_STATUS_COLOR[data.status]}>{QUOTE_STATUS_LABEL[data.status]}</span></div>

          <div className="flex items-center gap-4 mb-5">
            <ProgressRing
              size={68} strokeWidth={6}
              value={Math.max(0, Math.min(100, marginPct))}
              tone={marginPct >= 30 ? 'success' : marginPct >= 15 ? 'warning' : 'danger'}
              label={
                <div className="text-center">
                  <div className="text-[14px] font-bold tabular text-ink leading-none">{marginPct.toFixed(0)}%</div>
                  <div className="text-[8px] text-ink-subtle leading-none mt-0.5 uppercase">margem</div>
                </div>
              }
            />
            <div>
              <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Total</div>
              <div className="text-xl font-bold text-ink tabular leading-tight">{brl(data.totalValue)}</div>
              <div className="text-[11px] text-emerald-600 tabular mt-0.5">+{brl(data.margin)} margem</div>
            </div>
          </div>

          <div className="space-y-2">
            <Stat label="Custo" value={brl(data.totalCost)} mono />
            <Stat label="Emitido" value={dt(data.issuedAt)} />
            {data.validUntil && <Stat label="Válido até" value={dt(data.validUntil)} />}
          </div>

          {data.serviceOrder && (
            <div className="mt-4 pt-3 border-t border-app">
              <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold mb-1.5">OS gerada</div>
              <Link
                href={`/ordens-servico/${data.serviceOrder.id}`}
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold tabular text-sm group"
              >
                #{String(data.serviceOrder.number).padStart(5, '0')}
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </motion.div>
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

function Stat({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div className="flex justify-between text-[12.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-medium text-ink ${mono ? 'tabular' : ''}`}>{value}</span>
    </div>
  );
}

function ConvertModal({ open, onClose, onConverted, quoteId }: any) {
  const [paymentTerms, setPaymentTerms] = useState<'CASH' | 'INSTALLMENTS' | 'ON_DELIVERY'>('CASH');
  const [installments, setInstallments] = useState(1);
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [customDates, setCustomDates] = useState(false);
  const [dueDates, setDueDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleInstallmentsChange(n: number) {
    setInstallments(n);
    setDueDates(Array.from({ length: n }, (_, i) => {
      const d = new Date(firstDueDate);
      d.setMonth(d.getMonth() + i);
      return d.toISOString().slice(0, 10);
    }));
  }

  function handleFirstDueDateChange(v: string) {
    setFirstDueDate(v);
    if (!customDates) {
      setDueDates(Array.from({ length: installments }, (_, i) => {
        const d = new Date(v);
        d.setMonth(d.getMonth() + i);
        return d.toISOString().slice(0, 10);
      }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const numInstallments = paymentTerms === 'INSTALLMENTS' ? Number(installments) : 1;
      const os = await api<any>(`/quotes/${quoteId}/convert`, {
        method: 'POST',
        body: JSON.stringify({
          paymentTerms,
          installments: numInstallments,
          firstDueDate,
          customDueDates: customDates && paymentTerms === 'INSTALLMENTS' ? dueDates : undefined,
        }),
      });
      onConverted(os.id);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title="Aprovar e gerar OS" subtitle="Defina os termos de pagamento" onClose={onClose}>
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
            <input className="input" type="number" min={1} value={installments}
              onChange={(e) => handleInstallmentsChange(Number(e.target.value))} />
          </div>
        )}

        {paymentTerms !== 'INSTALLMENTS' || !customDates ? (
          <div>
            <label className="label">1º vencimento</label>
            <input className="input" type="date" value={firstDueDate}
              onChange={(e) => handleFirstDueDateChange(e.target.value)} />
          </div>
        ) : null}

        {paymentTerms === 'INSTALLMENTS' && installments > 1 && (
          <label className="flex items-center gap-2 text-sm cursor-pointer text-ink">
            <input type="checkbox" checked={customDates} onChange={(e) => {
              setCustomDates(e.target.checked);
              if (e.target.checked) {
                setDueDates(Array.from({ length: installments }, (_, i) => {
                  const d = new Date(firstDueDate);
                  d.setMonth(d.getMonth() + i);
                  return d.toISOString().slice(0, 10);
                }));
              }
            }} />
            Personalizar datas de vencimento por parcela
          </label>
        )}

        {customDates && paymentTerms === 'INSTALLMENTS' && (
          <div className="space-y-2 p-3 rounded-xl border border-app bg-app-subtle">
            <div className="text-[11px] text-ink-subtle uppercase tracking-wider font-semibold">Datas por parcela</div>
            {Array.from({ length: installments }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[12.5px] text-ink-muted w-20">Parcela {i + 1}</span>
                <input className="input" type="date" required
                  value={dueDates[i] ?? ''}
                  onChange={(e) => {
                    const copy = [...dueDates];
                    copy[i] = e.target.value;
                    setDueDates(copy);
                  }} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Confirmar</button>
        </div>
      </form>
    </Modal>
  );
}
