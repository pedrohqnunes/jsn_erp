import clsx from 'clsx';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {Icon && (
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl
                          bg-gradient-to-br from-brand-50 to-brand-100/50 text-brand-500 mb-3 ring-1 ring-brand-500/15">
          <Icon size={20} strokeWidth={1.75} />
        </span>
      )}
      <div className="text-sm font-semibold text-ink">{title}</div>
      {description && <div className="text-xs text-ink-subtle mt-1 max-w-sm">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
