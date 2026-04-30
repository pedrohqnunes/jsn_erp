'use client';

import clsx from 'clsx';

export default function MarginBar({
  pct,
  className,
  showLabel = true,
}: {
  pct: number;
  className?: string;
  showLabel?: boolean;
}) {
  const value = Math.max(0, Math.min(100, Number(pct) || 0));
  const tone =
    value >= 30 ? 'emerald' :
    value >= 15 ? 'amber'   :
    'rose';

  const fill =
    tone === 'emerald' ? 'from-emerald-400 to-emerald-500' :
    tone === 'amber'   ? 'from-amber-400 to-amber-500'     :
                         'from-rose-400 to-rose-500';

  const text =
    tone === 'emerald' ? 'text-emerald-600' :
    tone === 'amber'   ? 'text-amber-600'   :
                         'text-rose-600';

  return (
    <div className={clsx('flex items-center gap-2 min-w-[110px]', className)}>
      <div className="relative flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--border-soft))' }}>
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full bg-gradient-to-r', fill)}
          style={{ width: `${value}%`, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </div>
      {showLabel && (
        <span className={clsx('text-[11px] font-semibold tabular w-10 text-right', text)}>
          {value.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
