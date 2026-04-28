'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { brl, dt, fetcher } from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import { OS_STATUS_COLOR, OS_STATUS_LABEL } from '@/lib/labels';
import { useState } from 'react';

export default function OSListPage() {
  const [filter, setFilter] = useState<string>('');
  const { data } = useSWR<any[]>(`/service-orders${filter ? `?status=${filter}` : ''}`, fetcher);

  return (
    <div>
      <PageHeader title="Ordens de Serviço" subtitle="Pipeline operacional" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <FilterBtn cur={filter} v="" set={setFilter}>Todas</FilterBtn>
        {Object.entries(OS_STATUS_LABEL).map(([k, v]) => (
          <FilterBtn key={k} cur={filter} v={k} set={setFilter}>{v}</FilterBtn>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr><th>Nº</th><th>Cliente</th><th>Descrição</th><th>Status</th><th>Total</th><th>Margem</th><th>Criada</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td>
                  <Link href={`/ordens-servico/${o.id}`} className="font-medium text-brand-700 hover:underline">
                    #{String(o.number).padStart(5, '0')}
                  </Link>
                </td>
                <td>{o.client.name}</td>
                <td className="max-w-xs truncate">{o.description}</td>
                <td><span className={`badge ${OS_STATUS_COLOR[o.status]}`}>{OS_STATUS_LABEL[o.status]}</span></td>
                <td>{brl(o.totalValue)}</td>
                <td>{brl(o.margin)} ({Number(o.marginPct).toFixed(1)}%)</td>
                <td>{dt(o.createdAt)}</td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">Nenhuma OS</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterBtn({ cur, v, set, children }: any) {
  const active = cur === v;
  return (
    <button
      onClick={() => set(v)}
      className={`btn ${active ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  );
}
