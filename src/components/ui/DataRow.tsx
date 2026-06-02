import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** left colour spine (category/realm tick) */
  accent?: string;
  /** click handler — row becomes interactive (e.g. open character) */
  onClick?: () => void;
  className?: string;
}

/**
 * DataRow — one hairline-separated record row. The ledger grammar that
 * replaces the grid-of-cards. Compose label/value/pill children inside.
 */
export function DataRow({ children, accent, onClick, className = '' }: Props) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 py-2.5 border-b border-[color:var(--line-soft)] last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-[color:var(--inset)]' : ''} ${className}`}
    >
      {accent && <span className="tick" style={{ ['--c' as string]: accent, height: 18 }} />}
      {children}
    </div>
  );
}
