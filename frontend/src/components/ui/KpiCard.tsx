'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import clsx from 'clsx';

export type KpiTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_CHIP: Record<KpiTone, string> = {
  brand:   'bg-brand-50 text-brand-600 ring-brand-500/20',
  success: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20',
  warning: 'bg-amber-50 text-amber-600 ring-amber-500/20',
  danger:  'bg-rose-50 text-rose-600 ring-rose-500/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-400/20',
};

const TONE_HAIRLINE: Record<KpiTone, string> = {
  brand:   'hairline-brand',
  success: 'hairline-success',
  warning: 'hairline-warning',
  danger:  'hairline-danger',
  neutral: '',
};

const TONE_VALUE: Record<KpiTone, string> = {
  brand:   'text-ink',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger:  'text-rose-600',
  neutral: 'text-ink',
};

interface Props {
  title: string;
  value: string;
  sub?: string;
  delta?: number;
  tone?: KpiTone;
  icon?: React.ElementType;
  footer?: React.ReactNode;
  index?: number;
}

export default function KpiCard({
  title, value, sub, delta, tone = 'brand', icon: Icon, footer, index = 0,
}: Props) {
  const trend = delta === undefined ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="card relative overflow-hidden p-5 group hover:shadow-pop"
      style={{ transitionProperty: 'box-shadow, transform, border-color' }}
    >
      {/* gradient hairline */}
      <span className={clsx('absolute inset-x-0 top-0 h-px opacity-80', TONE_HAIRLINE[tone])} />

      {/* ambient corner glow on hover */}
      <span className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full
                       bg-gradient-to-br from-brand-400/0 to-brand-400/0
                       group-hover:from-brand-400/20 group-hover:to-transparent
                       transition-all duration-500 blur-2xl" />

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className={clsx(
              'inline-flex items-center justify-center w-8 h-8 rounded-lg ring-1 ring-inset',
              TONE_CHIP[tone],
            )}>
              <Icon size={15} strokeWidth={2.25} />
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            {title}
          </span>
        </div>
        {trend && (
          <span className={clsx(
            'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
            trend === 'up'   && 'text-emerald-700 bg-emerald-50',
            trend === 'down' && 'text-rose-700 bg-rose-50',
            trend === 'flat' && 'text-slate-600 bg-slate-100',
          )}>
            {trend === 'up'   && <ArrowUpRight size={11} />}
            {trend === 'down' && <ArrowDownRight size={11} />}
            {trend === 'flat' && <Minus size={11} />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
      </div>

      <div className={clsx('relative text-[26px] font-semibold tracking-tight tabular leading-none', TONE_VALUE[tone])}>
        {value}
      </div>
      {sub && <div className="relative mt-1.5 text-xs text-ink-subtle capitalize">{sub}</div>}
      {footer && <div className="relative mt-3">{footer}</div>}
    </motion.div>
  );
}
