import type { LanceData } from '@/lib/types';
import { Icons } from '@/components/Icons';
import { initials } from '@/lib/utils';

export function CovensTab({ data }: { data: LanceData }) {
  return (
    <div>
      <div className="flex items-center gap-3.5 mb-6">
        <div className="w-12 h-12 rounded-xl grid place-items-center border border-amethyst-500/40 text-amethyst-500" style={{ background: 'linear-gradient(180deg, rgba(181,110,181,0.3), rgba(181,110,181,0.1))' }}>
          <Icons.Sparkles size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold m-0 bg-gradient-to-b from-gold-50 to-gold-500 text-transparent bg-clip-text">Covens</h2>
          <p className="text-sm text-ink-100/60 m-0">Mage circles and ritual orders</p>
        </div>
      </div>

      <div className="space-y-10">
        {data.covens.map(coven => {
          const members = data.members.filter(m => m.coven === coven.id);
          return (
            <section key={coven.id}>
              <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-2xl font-display font-bold text-ink-100 m-0">{coven.name}</h3>
                {coven.leader && <span className="text-sm text-ink-100/60">led by <span className="text-gold-300">{coven.leader}</span></span>}
                <span className="text-xs text-ink-100/50">· {members.length} member{members.length === 1 ? '' : 's'}</span>
              </div>
              {coven.description && <p className="text-sm text-ink-100/60 mb-4">{coven.description}</p>}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                {members.map(m => {
                  const house = data.houses.find(h => h.id === m.house_id);
                  return (
                    <div key={m.id} className="card card-lift p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full grid place-items-center font-display font-bold border" style={{ color: '#b56eb5', background: 'linear-gradient(135deg, rgba(181,110,181,0.3), rgba(181,110,181,0.1))', borderColor: 'rgba(181,110,181,0.5)' }}>
                        {initials(m.name)}
                      </div>
                      <div>
                        <div className="font-display font-bold text-ink-100">{m.name}</div>
                        <div className="text-xs text-ink-100/60">{house?.name ?? 'Unassigned'} · {m.military_function ?? m.function}</div>
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && <p className="text-ink-100/40 text-sm py-6">No members in this coven yet.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
