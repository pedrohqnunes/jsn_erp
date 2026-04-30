'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
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
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%), ' +
          'radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16,185,129,0.10) 0%, transparent 60%), ' +
          '#F8FAFC',
      }}
    >
      {/* Decorative dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.45) 1px, transparent 1px)',
          backgroundSize:  '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      {/* Soft floating orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

      <motion.form
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onSubmit={submit}
        className="relative w-full max-w-[380px] rounded-2xl glass p-8 shadow-modal"
      >
        {/* gradient hairline */}
        <div className="absolute inset-x-0 top-0 h-px hairline-brand opacity-90 rounded-t-2xl" />

        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4">
            <Image
              src="/logo-96.png"
              alt="JSN"
              width={64}
              height={64}
              className="rounded-2xl shadow-md ring-1 ring-black/5"
              priority
            />
            <span className="absolute -inset-2 rounded-3xl bg-brand-500/20 blur-xl -z-10" />
          </div>
          <h1 className="text-[20px] font-semibold text-slate-900 tracking-tight">JSN Pinturas</h1>
          <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] text-brand-600 font-medium">
            <Sparkles size={11} />
            <span>Sistema de Gestão</span>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
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
            <motion.div
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            className="btn-primary w-full mt-1 py-2.5 text-[13px] font-semibold"
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

        <div className="mt-6 text-center text-[11px] text-slate-400">
          © {new Date().getFullYear()} JSN · Sistema interno
        </div>
      </motion.form>
    </div>
  );
}
