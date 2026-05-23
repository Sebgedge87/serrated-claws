import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  variant: 'noble' | 'active' | 'inactive' | 'kia';
  children: ReactNode;
}

export function Pill({ variant, children }: Props) {
  return (
    <span className={cn('pill', `pill-${variant}`)}>
      {children}
    </span>
  );
}
