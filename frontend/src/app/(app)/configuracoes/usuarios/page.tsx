'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, Shield, User } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', USER: 'Usuário' };
const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'badge badge-warning',
  USER:  'badge badge-muted',
};

function initials(name: string) {
  return (name ?? '?').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
}

export default function UsuariosPage() {
  const { data, mutate } = useSWR<any[]>('/users', fetcher);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function deleteUser(u: any) {
    if (!confirm(`Excluir usuário "${u.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api(`/users/${u.id}`, { method: 'DELETE' });
      await mutate();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div>
      <PageHeader
        title="Usuários do Sistema"
        subtitle="Gerencie quem tem acesso ao sistema"
        icon={Settings}
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={15} /> Novo usuário
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Desde</th><th /></tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700
                                      flex items-center justify-center text-[11px] text-white font-semibold
                                      ring-1 ring-brand-500/30 flex-shrink-0">
                        {initials(u.name)}
                      </div>
                      <span className="font-medium text-ink">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-ink-muted text-[12.5px]">{u.email}</td>
                  <td>
                    <span className={ROLE_BADGE[u.role]}>
                      {u.role === 'ADMIN'
                        ? <><Shield size={10} className="inline mr-1" />{ROLE_LABEL[u.role]}</>
                        : <><User size={10} className="inline mr-1" />{ROLE_LABEL[u.role]}</>}
                    </span>
                  </td>
                  <td>
                    <span className={u.active ? 'badge badge-success' : 'badge badge-muted'}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-ink-muted text-[12.5px]">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-ghost text-[11px] py-1 px-2.5"
                        onClick={() => { setEditing(u); setOpen(true); }}>
                        Editar
                      </button>
                      <button className="btn-danger text-[11px] py-1 px-2.5"
                        onClick={() => deleteUser(u)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={6} className="p-0">
                  <EmptyState icon={Settings} title="Nenhum usuário" description="Crie o primeiro usuário do sistema." />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <FormModal
        key={editing?.id ?? 'new'}
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSaved={async () => { setOpen(false); await mutate(); }}
      />
    </div>
  );
}

function FormModal({ open, editing, onClose, onSaved }: any) {
  const [form, setForm]   = useState<any>(editing ? { ...editing, password: '' } : { role: 'USER', active: true });
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editing;

  function field(key: string, val: any) {
    setForm((f: any) => ({ ...f, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: any = {
        name:   form.name,
        email:  form.email,
        role:   form.role,
        active: form.active,
      };
      if (form.password) payload.password = form.password;
      if (!isEdit && !form.password) { setError('Senha obrigatória para novo usuário.'); return; }

      if (isEdit) {
        await api(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/users', { method: 'POST', body: JSON.stringify(payload) });
      }
      onSaved();
    } catch (e: any) { setError(e.message); }
  }

  return (
    <Modal open={open} title={isEdit ? 'Editar usuário' : 'Novo usuário'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" required defaultValue={editing?.name}
            onChange={(e) => field('name', e.target.value)} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" required defaultValue={editing?.email}
            onChange={(e) => field('email', e.target.value)} />
        </div>
        <div>
          <label className="label">{isEdit ? 'Nova senha' : 'Senha'} {isEdit && <span className="text-ink-subtle font-normal">(deixe em branco para não alterar)</span>}</label>
          <input className="input" type="password" minLength={6} placeholder={isEdit ? '••••••' : ''}
            onChange={(e) => field('password', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Perfil</label>
            <select className="input" defaultValue={editing?.role ?? 'USER'}
              onChange={(e) => field('role', e.target.value)}>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" defaultValue={editing?.active !== false ? 'true' : 'false'}
              onChange={(e) => field('active', e.target.value === 'true')}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
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
