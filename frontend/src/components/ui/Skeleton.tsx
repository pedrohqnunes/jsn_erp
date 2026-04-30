import clsx from 'clsx';

export default function Skeleton({
  className,
  height = 16,
  width = '100%',
  rounded = 'md',
}: {
  className?: string;
  height?: number | string;
  width?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) {
  const r = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={clsx('skeleton', r, className)}
      style={{ height, width }}
    />
  );
}
