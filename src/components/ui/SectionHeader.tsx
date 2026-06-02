import type { ReactNode } from 'react';

interface Props {
  title: string;
  /** small count/meta shown right-aligned before any action */
  count?: ReactNode;
  /** a single quiet text affordance (e.g. "+ Add skill") */
  action?: ReactNode;
  /** accent colour for the leading tick (defaults to gold) */
  accent?: string;
  className?: string;
}

/**
 * SectionHeader — the ONE section header used by every section in the app.
 * Accent tick · Cormorant title · hairline rule · count · quiet action.
 * Identical treatment everywhere is what makes sections feel related.
 */
export function SectionHeader({ title, count, action, accent, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-3 mb-3.5 ${className}`}>
      <span className="w-[3px] h-4 rounded-sm flex-shrink-0" style={{ background: accent ?? 'var(--gold)' }} />
      <span className="font-display text-[19px] font-semibold text-ink-100 leading-none">{title}</span>
      <span className="flex-1 hairline" />
      {count != null && <span className="num text-[11px] text-ink-300">{count}</span>}
      {action && <span className="font-ui text-[11px] font-semibold text-ink-300 cursor-pointer hover:text-gold-300">{action}</span>}
    </div>
  );
}
