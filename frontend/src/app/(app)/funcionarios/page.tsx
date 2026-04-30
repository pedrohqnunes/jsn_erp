'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, UserCog, Phone, Mail } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
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
            <thead><tr><th>Nome</th><th>Cargo</th><th>Contato</th><th>Email</th><th>Status</th><th /></tr></thead>
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
                  <td><span className={STATUS_BADGE[e.status]}>{STATUS_LABEL[e.status]}</span></td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-icon hover:text-brand-600" title="Editar" onClick={() => { setEditing(e); setOpen(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon hover:text-rose-600" title="Excluir" onClick={() => deleteEmployee(e)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={6} className="p-0">
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing?.id) {
        await api(`/employees/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await api('/employees', { method: 'POST', body: JSON.stringify(form) });
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title={editing ? 'Editar funcionário' : 'Novo funcionário'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" required defaultValue={editing?.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Cargo</label>
          <input className="input" required defaultValue={editing?.role} onChange={(e) => setForm((f: any) => ({ ...f, role: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefone</label>
            <input className="input" defaultValue={editing?.phone ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" defaultValue={editing?.email ?? ''} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" defaultValue={editing?.status ?? 'ACTIVE'} onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="ON_LEAVE">Afastado</option>
          </select>
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
