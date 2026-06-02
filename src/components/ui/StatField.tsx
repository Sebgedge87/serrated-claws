import type { ComponentType, SVGProps } from 'react';

interface Props {
  /** optional leading icon — rendered small and inline, no gradient tile */
  Icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  value: string | number;
  /** accent for the category tick (defaults to gold) */
  color?: string;
  /** render the value in tabular mono (for numbers/currency) */
  mono?: boolean;
}

/**
 * StatField — the canonical read-mode label→value pair.
 * Quiet eyebrow label over a Spectral value. No input chrome, no glow.
 */
export function StatField({ Icon, label, value, color, mono }: Props) {
  return (
    <div className="flex gap-2.5 items-start min-w-0">
      {color && <span className="tick mt-0.5" style={{ ['--c' as string]: color, height: 26 }} />}
      <div className="min-w-0">
        <div className="eyebrow mb-1 flex items-center gap-1.5">
          {Icon && <Icon size={11} />}
          {label}
        </div>
        <div className={`text-[15px] text-ink-100 leading-tight ${mono ? 'num' : ''}`}>{value}</div>
      </div>
    </div>
  );
}
