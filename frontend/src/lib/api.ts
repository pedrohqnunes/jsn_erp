export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    throw new Error('Não autorizado');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Erro de rede');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Fetch autenticado que retorna Blob (para PDF, arquivos, etc.) */
export async function apiBlob(path: string): Promise<Blob> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Não autorizado');
  }
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.blob();
}

/** Abre um Blob como nova aba (visualização inline, ex: PDF) */
export function openBlob(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (filename) {
    a.download = filename;
  } else {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // revoke after a short delay to allow the tab/download to start
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Normaliza um número de telefone brasileiro para o formato internacional
 * que o wa.me aceita: 5511999999999
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // já tem DDI
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // adiciona DDI Brasil
  return `55${digits}`;
}

export const fetcher = (path: string) => api(path);

export const brl = (v: number | string) =>
  Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const dt = (v: string | Date | null | undefined) => {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  return d.toLocaleDateString('pt-BR');
};
