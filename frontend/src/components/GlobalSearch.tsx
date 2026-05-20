'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '@/lib/api';

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  tag: string;
  href: string;
}

const TAG_STYLES: Record<string, string> = {
  'Clientes':          'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'Orçamentos':        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Ordens de Serviço': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Funcionários':      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Contas a Pagar':    'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const TAG_DOT: Record<string, string> = {
  'Clientes':          'bg-sky-400',
  'Orçamentos':        'bg-violet-400',
  'Ordens de Serviço': 'bg-amber-400',
  'Funcionários':      'bg-emerald-400',
  'Contas a Pagar':    'bg-rose-400',
};

export default function GlobalSearch() {
  const router  = useRouter();
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef    = useRef<HTMLInputElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActive(0);
  }, []);

  /* Ctrl+K / Cmd+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /* Focus + scroll-lock */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [open]);

  /* Debounced search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api<SearchResult[]>(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, [query]);

  /* Keyboard navigation */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((v) => Math.min(v + 1, results.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((v) => Math.max(v - 1, 0)); }
      if (e.key === 'Enter' && results[active]) navigate(results[active].href);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, results, active, close]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function navigate(href: string) { router.push(href); close(); }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.tag] ??= []).push(r);
    return acc;
  }, {});

  const hasResults = results.length > 0;
  const isEmpty    = !loading && query.trim().length >= 2 && !hasResults;

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(2, 6, 23, 0.45)' }}
            onClick={close}
          />

          {/* Card centralizado */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[580px] rounded-2xl overflow-hidden shadow-modal border border-app pointer-events-auto"
              style={{ background: 'rgb(var(--surface-card))' }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-app">
                {loading
                  ? <Loader2 size={15} className="text-brand-500 animate-spin flex-shrink-0" />
                  : <Search size={15} className="text-ink-subtle flex-shrink-0" />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar clientes, orçamentos, OS, funcionários..."
                  className="flex-1 bg-transparent text-[13.5px] text-ink placeholder:text-ink-subtle outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')}
                    className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-hover transition-colors">
                    <X size={13} />
                  </button>
                )}
                <kbd className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded border border-app bg-app-subtle text-ink-subtle">Esc</kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
                {!query.trim() && (
                  <p className="px-4 py-8 text-center text-[13px] text-ink-subtle">
                    Digite para buscar em todo o sistema
                  </p>
                )}
                {query.trim().length === 1 && (
                  <p className="px-4 py-8 text-center text-[13px] text-ink-subtle">Continue digitando...</p>
                )}
                {isEmpty && (
                  <p className="px-4 py-8 text-center text-[13px] text-ink-subtle">
                    Nenhum resultado para <span className="text-ink font-medium">"{query}"</span>
                  </p>
                )}
                {hasResults && Object.entries(grouped).map(([tag, items]) => (
                  <div key={tag} className="mb-1">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TAG_DOT[tag] ?? 'bg-ink-subtle'}`} />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">{tag}</span>
                    </div>
                    {items.map((item) => {
                      const idx      = results.indexOf(item);
                      const isActive = idx === active;
                      return (
                        <button
                          key={item.id + item.tag}
                          data-idx={idx}
                          onClick={() => navigate(item.href)}
                          onMouseEnter={() => setActive(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group
                            ${isActive ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-ink truncate">{item.label}</div>
                            {item.sublabel && (
                              <div className="text-[11.5px] text-ink-subtle truncate mt-0.5">{item.sublabel}</div>
                            )}
                          </div>
                          <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border
                            ${TAG_STYLES[tag] ?? 'bg-surface-hover text-ink-subtle border-app'}`}>
                            {tag}
                          </span>
                          <ArrowRight size={13} className={`flex-shrink-0 text-ink-subtle transition-opacity
                            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Footer */}
              {hasResults && (
                <div className="flex items-center gap-3 px-4 py-2 border-t border-app text-[10.5px] text-ink-subtle">
                  <span><kbd className="px-1 py-0.5 rounded bg-app-subtle border border-app">↑↓</kbd> navegar</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-app-subtle border border-app">↵</kbd> abrir</span>
                  <span><kbd className="px-1 py-0.5 rounded bg-app-subtle border border-app">Esc</kbd> fechar</span>
                  <span className="ml-auto">{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
                   border border-app bg-surface-card text-[12.5px] text-ink-subtle
                   hover:border-brand-500/40 hover:text-ink transition-colors w-[280px] cursor-pointer"
      >
        <Search size={13} />
        <span>Buscar...</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-app-subtle border border-app text-ink-subtle">⌘K</span>
      </button>

      {/* Portal — renderiza direto no body, fora de qualquer stacking context */}
      {mounted && createPortal(modal, document.body)}
    </>
  );
}
