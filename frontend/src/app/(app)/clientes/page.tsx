'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Search, Pencil } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const { data, mutate } = useSWR<any[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro e histórico de clientes"
        actions={
          <button className="btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo cliente
          </button>
        }
      />

      <div className="card p-3 mb-4">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-slate-400 ml-2" />
          <input className="input border-0 focus:ring-0" placeholder="Buscar por nome, documento, email..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Nome</th><th>Tipo</th><th>Documento</th><th>Telefone</th><th>Cidade</th><th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/clientes/${c.id}`} className="text-brand-700 hover:underline font-medium">
                    {c.name}
                  </Link>
                </td>
                <td>{c.type}</td>
                <td>{c.document ?? '-'}</td>
                <td>{c.phone ?? '-'}</td>
                <td>{c.city ?? '-'}</td>
                <td>
                  <button className="text-slate-500 hover:text-brand-700"
                    onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {(data && data.length === 0) && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Nenhum cliente cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
        {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
        <div className="col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" type="submit">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
