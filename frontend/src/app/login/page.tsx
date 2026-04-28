'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('admin@jsn.local');
  const [password, setPassword] = useState('admin123');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/dashboard');
    } catch (e: any) {
      setError(e.message ?? 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.10) 0%, transparent 60%), #F8FAFC',
      }}
    >
      {/* Grid dots decorative */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          backgroundSize:  '28px 28px',
          opacity: 0.4,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      <form
        onSubmit={submit}
        className="relative w-full max-w-[360px] rounded-2xl
                   bg-white/90 backdrop-blur-xl
                   border border-surface-border shadow-modal p-8"
        style={{ boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12), 0 8px 25px -5px rgba(0,0,0,0.07)' }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-96.png"
            alt="JSN CRM"
            width={64}
            height={64}
            className="rounded-2xl shadow-sm mb-4"
            priority
          />
          <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">JSN CRM</h1>
          <p className="text-xs text-slate-400 mt-0.5">Mini ERP · Pintura eletrostática</p>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            className="btn-primary w-full mt-2 py-2.5 text-[13px] font-semibold shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
