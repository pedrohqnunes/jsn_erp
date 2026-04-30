'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Props {
  value: number;          // 0-100
  size?: number;
  strokeWidth?: number;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  label?: React.ReactNode;
  className?: string;
}

const TONES = {
  brand:   'stroke-brand-500',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  danger:  'stroke-rose-500',
};

export default function ProgressRing({
  value, size = 56, strokeWidth = 5, tone = 'brand', label, className,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * clamped) / 100;

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-app-soft opacity-40"
          style={{ color: 'rgb(var(--border))' }}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={TONES[tone]}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {label ?? (
          <span className="text-xs font-semibold tabular text-ink">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    </div>
  );
}
