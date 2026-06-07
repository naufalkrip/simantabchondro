import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'text' }) => {
  return (
    <div
      className={clsx(
        'skeleton-shimmer rounded-md',
        variant === 'circle' && 'rounded-full',
        variant === 'card' && 'rounded-xl',
        className
      )}
    />
  );
};
