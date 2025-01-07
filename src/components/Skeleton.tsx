import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'text' | 'image' | 'card';
  lines?: number;
  rounded?: boolean;
}

export function Skeleton({ 
  type = 'text', 
  lines = 1,
  rounded = false,
  className = '',
  ...props 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200';
  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  if (type === 'image') {
    return (
      <div 
        className={`${baseClasses} ${roundedClass} aspect-square ${className}`}
        {...props}
      />
    );
  }

  if (type === 'card') {
    return (
      <div 
        className={`${baseClasses} ${roundedClass} p-4 space-y-3 ${className}`}
        {...props}
      >
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-4 bg-gray-300 rounded" />
        <div className="h-4 bg-gray-300 rounded w-5/6" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`${baseClasses} ${roundedClass} h-4 ${i === lines - 1 ? 'w-5/6' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonLoader({ count = 1, ...props }: { count?: number } & SkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} {...props} />
      ))}
    </div>
  );
}
