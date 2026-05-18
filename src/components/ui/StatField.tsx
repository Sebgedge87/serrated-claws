import type { ComponentType, SVGProps } from 'react';

interface Props {
  Icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  value: string | number;
  color?: string;
}

export function StatField({ Icon, label, value, color = '#8a7f70' }: Props) {
  return (
    <div className="flex gap-2.5 items-start">
      {Icon && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: `linear-gradient(180deg, ${color}25, ${color}10)`,
            border: `1px solid ${color}30`,
            color,
          }}
        >
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] text-ink-300 uppercase tracking-wider font-semibold mb-0.5">{label}</div>
        <div className="text-[13px] font-semibold text-ink-100 leading-tight">{value}</div>
      </div>
    </div>
  );
}
