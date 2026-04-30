'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        aria-label="Alternar tema"
        className="p-1.5 rounded-lg text-white/40 hover:text-white/85 hover:bg-white/[0.06] transition-all duration-200"
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="relative inline-flex items-center w-12 h-6 rounded-full transition-colors duration-300 ease-smooth"
      style={{ background: theme === 'dark' ? 'rgb(99 102 241 / 0.5)' : 'rgb(148 163 184 / 0.4)' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className={`absolute top-0.5 ${theme === 'dark' ? 'left-[26px]' : 'left-0.5'}
                     inline-flex items-center justify-center w-5 h-5 rounded-full bg-white shadow-sm`}
      >
        {theme === 'dark' ? <Moon size={11} className="text-indigo-600" /> : <Sun size={11} className="text-amber-500" />}
      </motion.span>
    </button>
  );
}
