'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo', INACTIVE: 'Inativo', ON_LEAVE: 'Afastado',
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
        subtitle="Equipe operacional - vinculável às OS e etapas"
        actions={<button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Novo</button>}
      />

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead><tr><th>Nome</th><th>Cargo</th><th>Telefone</th><th>Email</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.name}</td>
                <td>{e.role}</td>
                <td>{e.phone ?? '-'}</td>
                <td>{e.email ?? '-'}</td>
                <td>{STATUS_LABEL[e.status]}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <button className="text-slate-500 hover:text-brand-700" title="Editar" onClick={() => { setEditing(e); setOpen(true); }}>
                      <Pencil size={14} />
                    </button>
                    <button className="text-slate-500 hover:text-red-600" title="Excluir" onClick={() => deleteEmployee(e)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-slate-500">Nenhum cadastro</td></tr>}
          </tbody>
        </table>
      </div>

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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
