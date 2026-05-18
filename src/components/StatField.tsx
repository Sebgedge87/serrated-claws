import type { ComponentType, SVGProps } from 'react';

interface Props {
  icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  label: string;
  value: React.ReactNode;
  color?: string;
}

export function StatField({ icon: Icon, label, value, color = '#8a7f70' }: Props) {
  return (
    <div className="flex gap-2.5 items-start">
      {Icon && (
        <div
          className="w-7 h-7 rounded-lg grid place-items-center flex-shrink-0 mt-0.5 border"
          style={{
            color,
            background: `linear-gradient(180deg, ${color}25, ${color}10)`,
            borderColor: `${color}30`
          }}
        >
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-ink-100/50 font-semibold mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-ink-100 leading-snug">{value}</div>
      </div>
    </div>
  );
}
