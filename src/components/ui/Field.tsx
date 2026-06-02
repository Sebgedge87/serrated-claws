import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  /** render value in tabular mono */
  mono?: boolean;
  /** muted value tone */
  muted?: boolean;
  className?: string;
}

/**
 * Field — read-mode label over value. The core of the "stop using disabled
 * inputs to display data" fix. Use this everywhere a value is shown, not edited.
 */
export function Field({ label, value, mono, muted, className = '' }: Props) {
  return (
    <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
      <span className="eyebrow">{label}</span>
      <span className={`text-[15px] leading-tight ${mono ? 'num' : ''} ${muted ? 'text-ink-300' : 'text-ink-100'}`}>
        {value}
      </span>
    </div>
  );
}
