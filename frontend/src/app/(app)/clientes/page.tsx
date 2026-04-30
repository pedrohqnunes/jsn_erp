'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Users, Phone, MapPin } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const { data, mutate } = useSWR<any[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  async function deleteClient(c: any) {
    if (!confirm(`Excluir cliente "${c.name}"?`)) return;
    try {
      await api(`/clients/${c.id}`, { method: 'DELETE' });
      await mutate();
    } catch (err: any) { alert(err.message); }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro e histórico de clientes"
        icon={Users}
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={15} /> Novo cliente
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="card p-2 mb-4"
      >
        <div className="flex items-center gap-2 px-2">
          <Search size={15} className="text-ink-subtle" />
          <input
            className="input border-0 focus:ring-0 focus:border-0 bg-transparent shadow-none focus:shadow-none"
            placeholder="Buscar por nome, documento, email..."
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[11px] text-ink-subtle hover:text-ink px-2">
              Limpar
            </button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Nome</th><th>Tipo</th><th>Documento</th><th>Contato</th><th>Localização</th><th />
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="avatar w-8 h-8">{(c.name ?? '?').slice(0, 2).toUpperCase()}</span>
                      <div className="min-w-0">
                        <Link href={`/clientes/${c.id}`} className="font-medium text-ink hover:text-brand-600 truncate block">
                          {c.name}
                        </Link>
                        {c.email && <div className="text-[11px] text-ink-subtle truncate">{c.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={c.type === 'PJ' ? 'badge badge-info' : 'badge badge-purple'}>
                      {c.type}
                    </span>
                  </td>
                  <td className="text-ink-muted tabular text-[12.5px]">{c.document ?? '—'}</td>
                  <td className="text-ink-muted">
                    {c.phone ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px]">
                        <Phone size={11} className="text-ink-subtle" /> {c.phone}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-ink-muted">
                    {c.city ? (
                      <span className="inline-flex items-center gap-1.5 text-[12.5px]">
                        <MapPin size={11} className="text-ink-subtle" /> {c.city}{c.state ? `/${c.state}` : ''}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button className="btn-icon hover:text-brand-600" title="Editar"
                        onClick={() => { setEditing(c); setOpen(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-icon hover:text-rose-600" title="Excluir"
                        onClick={() => deleteClient(c)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data && data.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="Nenhum cliente encontrado"
                      description={search ? 'Tente ajustar a busca.' : 'Comece adicionando seu primeiro cliente.'}
                      action={!search && (
                        <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
                          <Plus size={15} /> Novo cliente
                        </button>
                      )}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <ClientModal
        key={editing?.id ?? 'new'}
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSaved={async () => { setOpen(false); await mutate(); }}
      />
    </div>
  );
}

function ClientModal({ open, editing, onClose, onSaved }: any) {
  const [form, setForm] = useState<any>(editing ?? { type: 'PF' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(editing ?? { type: 'PF' });
    setError(null);
  }, [editing, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing?.id) {
        await api(`/clients/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await api('/clients', { method: 'POST', body: JSON.stringify(form) });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <Modal open={open} title={editing ? 'Editar cliente' : 'Novo cliente'} onClose={onClose} size="lg">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome / Razão Social</label>
          <input className="input" required defaultValue={editing?.name}
            onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" defaultValue={editing?.type ?? 'PF'}
            onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))}>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
        </div>
        <div>
          <label className="label">CPF / CNPJ</label>
          <input className="input" defaultValue={editing?.document ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, document: e.target.value }))} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" defaultValue={editing?.email ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" defaultValue={editing?.phone ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="label">Endereço</label>
          <input className="input" defaultValue={editing?.address ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" defaultValue={editing?.city ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <label className="label">UF</label>
          <input className="input" maxLength={2} defaultValue={editing?.state ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, state: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="label">CEP</label>
          <input className="input" defaultValue={editing?.zipCode ?? ''}
            onChange={(e) => setForm((f: any) => ({ ...f, zipCode: e.target.value }))} />
        </div>
        {error && (
          <div className="col-span-2 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
