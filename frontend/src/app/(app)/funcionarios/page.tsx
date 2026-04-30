'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCog, Phone, Mail, DollarSign } from 'lucide-react';
import { api, brl, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', ON_LEAVE: 'Afastado',
};
const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'badge badge-success',
  INACTIVE: 'badge badge-muted',
  ON_LEAVE: 'badge badge-warning',
};

export default function FuncionariosPage() {
  const { data, mutate } = useSWR<any[]>('/employees', fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function deleteEmployee(e: any) {
    if (!confirm(`Excluir funcionário "${e.name}"?`)) return;
    try {
      await api(`/employees/${e.id}`, { method: 'DELETE' });
      await mutate();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div>
      <PageHeader
        title="Funcionários"
        subtitle="Equipe operacional — vinculável às OS e etapas"
        icon={UserCog}
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={15} /> Novo</button>}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead><tr><th>Nome</th><th>Cargo</th><th>Contato</th><th>Email</th><th className="num">Salário</th><th>Pagamento</th><th>Status</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="avatar w-8 h-8">{(e.name ?? '?').slice(0, 2).toUpperCase()}</span>
                      <span className="font-medium text-ink">{e.name}</span>
                    </div>
                  </td>
                  <td className="text-ink-muted">{e.role}</td>
                  <td className="text-ink-muted text-[12.5px]">
                    {e.phone ? (
                      <span className="inline-flex items-center gap-1.5"><Phone size={11} className="text-ink-subtle" /> {e.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="text-ink-muted text-[12.5px]">
                    {e.email ? (
                      <span className="inline-flex items-center gap-1.5"><Mail size={11} className="text-ink-subtle" /> {e.email}</span>
                    ) : '—'}
                  </td>
                  <td className="num font-semibold">
                    {e.salary ? brl(e.salary) : <span className="text-ink-subtle">—</span>}
                  </td>
                  <td className="text-ink-muted text-[12.5px]">
                    {e.salaryPayDay ? (
                      <span className="inline-flex items-center gap-1.5">
                        <DollarSign size={11} className="text-ink-subtle" /> Dia {e.salaryPayDay}
                      </span>
                    ) : '—'}
                  </td>
                  <td><span className={STATUS_BADGE[e.status]}>{STATUS_LABEL[e.status]}</span></td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-ghost text-[11px] py-1 px-2.5" onClick={() => { setEditing(e); setOpen(true); }}>Editar</button>
                      <button className="btn-danger text-[11px] py-1 px-2.5" onClick={() => deleteEmployee(e)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={8} className="p-0">
                  <EmptyState icon={UserCog} title="Nenhum cadastro" description="Adicione um funcionário para começar." />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <FormModal key={editing?.id ?? 'new'} open={open} editing={editing} onClose={() => setOpen(false)} onSaved={async () => { setOpen(false); await mutate(); }} />
    </div>
  );
}

function FormModal({ open, editing, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ?? { status: 'ACTIVE' });
  const [error, setError] = useState<string | null>(null);

  function field(key: string, val: any) {
    setForm((f: any) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
        salaryPayDay: form.salaryPayDay ? Number(form.salaryPayDay) : undefined,
      };
      if (editing?.id) {
        await api(`/employees/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/employees', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  const hasSalary = !!form.salary && Number(form.salary) > 0;

  return (
    <Modal open={open} title={editing ? 'Editar funcionário' : 'Novo funcionário'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" required defaultValue={editing?.name} onChange={(e) => field('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Cargo</label>
          <input className="input" required defaultValue={editing?.role} onChange={(e) => field('role', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefone</label>
            <input className="input" defaultValue={editing?.phone ?? ''} onChange={(e) => field('phone', e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" defaultValue={editing?.email ?? ''} onChange={(e) => field('email', e.target.value)} />
          </div>
        </div>

        {/* Salário */}
        <div className="rounded-xl border border-app bg-app-subtle p-3 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">Custo / Folha de pagamento</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Salário (R$)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={editing?.salary ?? ''}
                onChange={(e) => field('salary', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Dia de pagamento</label>
              <input
                className="input"
                type="number"
                min="1"
                max="28"
                placeholder="Ex: 5"
                disabled={!hasSalary}
                defaultValue={editing?.salaryPayDay ?? ''}
                onChange={(e) => field('salaryPayDay', e.target.value)}
              />
            </div>
          </div>
          {hasSalary && (
            <p className="text-[11px] text-ink-subtle">
              Uma conta a pagar recorrente mensal será criada automaticamente em <strong className="text-ink">Contas a Pagar → Folha de Pagamento</strong>.
            </p>
          )}
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input" defaultValue={editing?.status ?? 'ACTIVE'} onChange={(e) => field('status', e.target.value)}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ON_LEAVE">Afastado</option>
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
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
