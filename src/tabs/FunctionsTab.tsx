import type { LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';

export function FunctionsTab({ data }: { data: LanceData }) {
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center border border-gold-500/40 text-gold-300" style={{ background: 'linear-gradient(180deg, rgba(212,180,109,0.3), rgba(212,180,109,0.1))' }}>
          <Icons.Swords size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Functions</h2>
          <p className="text-sm text-ink-100/60 m-0">Combat roles across the lance</p>
        </div>
      </div>

      <div className="space-y-6">
        {data.functions.map(fn => {
          const members = data.members.filter(m => m.function === fn.id);
          return (
            <div key={fn.id} className="card p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-xl font-display font-bold text-gold-300 m-0">{fn.name}</h3>
                {fn.leader && <span className="text-sm text-ink-100/60">led by <span className="text-ink-100">{fn.leader}</span></span>}
                <span className="text-xs text-ink-100/50">· {members.length}</span>
              </div>
              {fn.description && <p className="text-sm text-ink-100/60 mb-4">{fn.description}</p>}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
                {members.map(m => {
                  const house = data.houses.find(h => h.id === m.house_id);
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-black/25 rounded-lg px-3 py-2.5">
                      <div>
                        <span className="font-semibold text-sm">{m.name}</span>
                        <span className="text-xs text-ink-100/60 ml-1.5">· {m.rank}</span>
                      </div>
                      <span className="text-xs text-ink-100/50">{house?.name.replace('House ', '') ?? '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
