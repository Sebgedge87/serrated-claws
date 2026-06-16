import { useLance } from '@/contexts/LanceContext';
import { monogramOf } from '@/lib/utils';
import type { House } from '@/lib/types';

interface Props {
  onSelect: (house: House) => void;
}

export function HousesTab({ onSelect }: Props) {
  const { data, isAdmin } = useLance();

  return (
    <div className="animate-fade-in">
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '38px',
          fontWeight: 600,
          lineHeight: 1.1,
          color: 'var(--gold)',
          marginBottom: '4px',
        }}
      >
        Houses
      </h2>
      <p style={{ fontFamily: "'Spectral', serif", fontStyle: 'italic', fontSize: '14px', color: 'rgb(var(--ink-300))', marginBottom: '32px' }}>
        {data.houses.length} house{data.houses.length !== 1 ? 's' : ''} · {data.members.length} sworn
      </p>

      {data.houses.length === 0 && (
        <p className="text-ink-100/40 text-sm py-16 text-center">
          No houses yet.{isAdmin ? ' Use "House" in the toolbar to create one.' : ''}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.houses.map(h => {
          const c = h.primary_color ?? '#d4b46d';
          const members = data.members.filter(m => m.house_id === h.id);
          const nobles = members.filter(m => m.is_noble);
          const active = members.filter(m => m.status === 'active');

          return (
            <button
              key={h.id}
              onClick={() => onSelect(h)}
              className="card text-left w-full overflow-hidden transition-shadow hover:shadow-lg"
              style={{ borderTop: `3px solid ${c}` }}
            >
              <div className="p-5 flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center font-display font-bold text-base select-none flex-shrink-0 mt-0.5"
                  style={{ background: `${c}22`, border: `1px solid ${c}66`, color: c }}
                >
                  {monogramOf(h.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-xl text-ink-100 m-0 leading-tight truncate">{h.name}</h3>
                  {h.motto && (
                    <p className="text-xs italic text-ink-100/50 mt-0.5 truncate">"{h.motto}"</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-ink-100/50">
                    <span><span className="num" style={{ color: c }}>{members.length}</span> sworn</span>
                    {nobles.length > 0 && <span><span className="num" style={{ color: c }}>{nobles.length}</span> noble</span>}
                    <span><span className="num" style={{ color: active.length === members.length ? 'var(--ok)' : 'rgb(var(--ink-300))' }}>{active.length}</span> active</span>
                  </div>
                </div>
                <div className="text-ink-100/20 flex-shrink-0 mt-1">›</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
