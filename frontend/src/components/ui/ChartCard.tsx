'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ChartCard({
  title,
  subtitle,
  actions,
  height,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
      className={clsx('card p-5 relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="text-xs text-ink-subtle mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </motion.div>
  );
}
