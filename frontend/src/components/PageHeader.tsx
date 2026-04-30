'use client';

import { motion } from 'framer-motion';

export default function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between gap-3 mb-7"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl
                          bg-gradient-to-br from-brand-50 to-brand-100/60 text-brand-600
                          ring-1 ring-brand-500/15 shadow-sm flex-shrink-0">
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-ink tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12.5px] text-ink-subtle mt-0.5 font-normal">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </motion.div>
  );
}
