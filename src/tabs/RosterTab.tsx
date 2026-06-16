import { useState } from 'react';
import type { Member } from '@/lib/types';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useLance } from '@/contexts/LanceContext';

interface Props {
  initialFilter?: 'all' | 'nobles';
  onViewMember: (m: Member) => void;
}

function statusDot(status: Member['status']) {
  if (status === 'active') return 'var(--ok)';
  if (status === 'KIA') return 'var(--danger)';
  return 'var(--warn)';
}

function statusLabel(status: Member['status']) {
  if (status === 'active') return 'Active';
  if (status === 'KIA') return 'KIA';
  return 'Inactive';
}

export function RosterTab({ initialFilter = 'all', onViewMember }: Props) {
  const { data } = useLance();
  const [filter, setFilter] = useState<'all' | 'nobles'>(initialFilter);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const houseById = new Map(data.houses.map(h => [h.id, h]));

  const q = search.trim().toLowerCase();
  const allFiltered = data.members
    .filter(m => filter === 'nobles' ? m.is_noble : true)
    .filter(m => {
      if (!q) return true;
      const house = m.house_id ? (houseById.get(m.house_id)?.name ?? '') : '';
      return [m.name, m.player_name, m.rank, m.function, m.military_function, house]
        .filter(Boolean)
        .some(v => v!.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (a.is_noble !== b.is_noble) return a.is_noble ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const totalAll = data.members.length;
  const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const members = allFiltered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Title */}
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
        Roster
      </h2>
      <p
        style={{
          fontFamily: "'Spectral', serif",
          fontStyle: 'italic',
          fontSize: '14px',
          color: 'rgb(var(--ink-300))',
          marginBottom: '24px',
        }}
      >
        {totalAll} member{totalAll !== 1 ? 's' : ''} across all houses
      </p>

      {/* Filter pills + search */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        {(['all', 'nobles'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '999px',
              border: '1px solid var(--line)',
              background: filter === f ? 'rgb(var(--ink-700))' : 'transparent',
              color: filter === f ? 'rgb(var(--ink-100))' : 'rgb(var(--ink-300))',
              fontSize: '12px',
              fontFamily: "'Spectral', serif",
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: filter === f ? 'var(--gold)' : 'rgb(var(--ink-400))',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            />
            {f === 'all' ? 'All Members' : 'Nobles'}
          </button>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search name, house, rank…"
          className="input"
          style={{ flex: 1, minWidth: '180px' }}
        />
      </div>

      <SectionHeader title="Members" count={members.length} />

      {/* Table */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Header row — 2-col mobile, 6-col on sm+ */}
        <div
          className="hidden sm:grid"
          style={{
            gridTemplateColumns: '3px 1fr 140px 120px 140px 90px',
            background: 'rgb(var(--ink-800))',
            borderBottom: '1px solid var(--line)',
            padding: '0',
          }}
        >
          <div /> {/* spine */}
          {['Character', 'House', 'Rank', 'Role', 'Status'].map(col => (
            <div
              key={col}
              className="eyebrow"
              style={{
                padding: '10px 12px',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--ink-400))',
              }}
            >
              {col}
            </div>
          ))}
        </div>
        <div
          className="grid sm:hidden"
          style={{
            gridTemplateColumns: '3px 1fr 90px',
            background: 'rgb(var(--ink-800))',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div />
          {['Character', 'Status'].map(col => (
            <div key={col} className="eyebrow" style={{ padding: '8px 10px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--ink-400))' }}>{col}</div>
          ))}
        </div>

        {members.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgb(var(--ink-400))', fontSize: '14px' }}>
            No members match.
          </div>
        )}

        {members.map((m, i) => {
          const house = m.house_id ? houseById.get(m.house_id) : null;
          const spineColor = m.is_noble && house ? house.primary_color : 'transparent';
          const dotColor = statusDot(m.status);

          return (
            <div
              key={m.id}
              onClick={() => onViewMember(m)}
              style={{
                borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.1s',
              }}
              className="grid sm:grid-cols-[3px_1fr_140px_120px_140px_90px] grid-cols-[3px_1fr_90px] hover:bg-white/[0.025]"
            >
              {/* House-colour spine */}
              <div style={{ background: spineColor, alignSelf: 'stretch' }} />

              {/* Character + player name */}
              <div style={{ padding: '12px 12px' }}>
                <div
                  className="font-display"
                  style={{ fontSize: '16px', fontWeight: 600, color: 'rgb(var(--ink-100))', lineHeight: 1.2 }}
                >
                  {m.name}
                  {m.is_noble && (
                    <span style={{ marginLeft: '5px', fontSize: '11px', color: 'var(--gold)', verticalAlign: 'middle' }}>♦</span>
                  )}
                </div>
                {m.player_name && (
                  <div
                    className="eyebrow"
                    style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'rgb(var(--ink-400))', marginTop: '2px' }}
                  >
                    {m.player_name}
                  </div>
                )}
              </div>

              {/* House — hidden on mobile */}
              <div className="hidden sm:flex" style={{ padding: '12px 12px', alignItems: 'center' }}>
                {house ? (
                  <span style={{ fontSize: '13px', color: house.primary_color }}>
                    {house.name.replace('House ', '')}
                  </span>
                ) : (
                  <span style={{ fontSize: '13px', color: 'rgb(var(--ink-400))' }}>—</span>
                )}
              </div>

              {/* Rank — hidden on mobile */}
              <div className="hidden sm:flex" style={{ padding: '12px 12px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgb(var(--ink-300))' }}>{m.rank ?? '—'}</span>
              </div>

              {/* Role / function — hidden on mobile */}
              <div className="hidden sm:flex" style={{ padding: '12px 12px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'rgb(var(--ink-300))' }}>
                  {m.function ?? m.military_function ?? '—'}
                </span>
              </div>

              {/* Status */}
              <div style={{ padding: '12px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: dotColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '12px', color: dotColor }}>{statusLabel(m.status)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-ink-100/60">
          <span>{allFiltered.length} members · page {safePage + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="btn btn-ghost btn-sm"
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="btn btn-ghost btn-sm"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
