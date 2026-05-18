import { Icons } from '@/lib/icons';
import { cn } from '@/lib/utils';
import type { House } from '@/lib/types';

export type TabId =
  | 'overview'
  | 'unassigned'
  | 'covens'
  | 'functions'
  | 'businesses'
  | 'inventory'
  | `house:${string}`;

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
  houses: House[];
}

export function TabNav({ active, onChange, houses }: Props) {
  const items: { id: TabId; label: string; Icon: typeof Icons.House }[] = [
    { id: 'overview', label: 'Overview', Icon: Icons.House },
    ...houses.map<{ id: TabId; label: string; Icon: typeof Icons.Shield }>(h => ({
      id: `house:${h.id}` as TabId,
      label: h.name.replace(/^House\s+/i, ''),
      Icon: Icons.Shield,
    })),
    { id: 'unassigned',  label: 'Unassigned', Icon: Icons.QuestionMark },
    { id: 'covens',      label: 'Covens',     Icon: Icons.Sparkles },
    { id: 'functions',   label: 'Functions',  Icon: Icons.Swords },
    { id: 'businesses',  label: 'Businesses', Icon: Icons.Briefcase },
    { id: 'inventory',   label: 'Inventory',  Icon: Icons.Package },
  ];

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-gold-500/15 px-12 flex gap-0.5 overflow-x-auto">
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium tracking-wide transition-colors whitespace-nowrap relative border-b-2',
              isActive
                ? 'text-gold-400 border-gold-400 font-semibold'
                : 'text-ink-300 border-transparent hover:text-ink-100'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
