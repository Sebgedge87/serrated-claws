import { useState } from 'react';
import { Icons } from '@/components/Icons';

interface Step {
  icon: typeof Icons.House;
  title: string;
  body: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    icon: Icons.Swords,
    title: 'Welcome to your Group',
    body: 'This app helps you manage your Empire LARP lance — track characters, houses, covens, treasury, and upcoming events. Everything updates in real time as your lance mates make changes.',
    tip: 'You can return to this tour any time from the user menu in the top-right corner.',
  },
  {
    icon: Icons.House,
    title: 'Overview',
    body: 'The Overview tab is your home base. It shows your full roster, resource holdings, active businesses, and upcoming events at a glance. Click any member, house, or resource to jump straight there.',
    tip: 'The search bar at the top lets you find any member, house, or coven instantly.',
  },
  {
    icon: Icons.Shield,
    title: 'Houses & Covens',
    body: 'Houses shows a directory of all houses in your lance. Click a house card to drill in and see its members and details. Covens works the same way for magical groups — membership, mana totals, and rituals.',
    tip: 'Use the "← Houses" / "← Covens" button to return to the directory from a detail view.',
  },
  {
    icon: Icons.Coins,
    title: 'Treasury',
    body: 'Treasury has three sections: Holdings (rings, crowns, thrones + tithe), Stock (non-coin resources and crafting), and Ventures (businesses). After each event admins can click "Collect Event Tithe" to record payments automatically.',
    tip: 'The tithe calculation is based on which members have marked themselves as attending the event.',
  },
  {
    icon: Icons.Sparkles,
    title: 'Events & Attendance',
    body: 'When an event is coming up, a banner will appear at the top of every page asking whether you\'re attending. Click it to confirm your attendance — or to link your character if you haven\'t yet. Your answer feeds the tithe and roster counts.',
    tip: 'Open "My Character" from the top-right avatar menu to view and edit your character sheet, skills, rituals, and inventory.',
  },
];

const TOUR_KEY = (profileId: string) => `tour_seen_${profileId}`;

export function hasSeen(profileId: string): boolean {
  return localStorage.getItem(TOUR_KEY(profileId)) === 'true';
}

export function markSeen(profileId: string) {
  localStorage.setItem(TOUR_KEY(profileId), 'true');
}

export function WalkThrough({ profileId, lanceName, onDone }: { profileId: string; lanceName?: string | null; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  function finish() {
    markSeen(profileId);
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/80 backdrop-blur-md"
      onClick={finish}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Getting started walkthrough"
        className="w-full sm:max-w-lg max-h-[92vh] overflow-auto rounded-t-2xl sm:rounded-2xl bg-gradient-to-b from-ink-800/98 to-ink-900/98 border border-gold-500/30 animate-fade-in"
        style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(201,169,97,0.15)' }}
      >
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden>
          <div className="w-9 h-1 rounded-full bg-gold-500/35" />
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-5 pb-0">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                width: i === step ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === step ? 'var(--gold)' : 'rgba(201,169,97,0.25)',
                border: 'none',
                cursor: 'pointer',
                transition: 'width 0.25s, background 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Icon + heading */}
        <div className="px-7 pt-6 pb-4 text-center">
          <div
            className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(180deg, rgba(201,169,97,0.25) 0%, rgba(201,169,97,0.1) 100%)',
              border: '1px solid rgba(201,169,97,0.35)',
              color: 'var(--gold)',
            }}
          >
            <Icon size={26} />
          </div>
          {step === 0 && lanceName && (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '13px', fontStyle: 'italic', color: 'rgb(var(--ink-300))', marginBottom: '4px' }}>
              {lanceName}
            </p>
          )}
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: 600, color: 'var(--gold)', margin: 0, lineHeight: 1.15 }}>
            {current.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-7 pb-2">
          <p style={{ fontFamily: "'Spectral', serif", fontSize: '15px', color: 'rgb(var(--ink-200))', lineHeight: 1.65, margin: 0 }}>
            {current.body}
          </p>

          {current.tip && (
            <div
              className="mt-4 rounded-lg px-4 py-3 flex gap-3 items-start"
              style={{ background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.18)' }}
            >
              <span style={{ color: 'var(--gold)', marginTop: '1px', flexShrink: 0 }}>
                <Icons.Sparkles size={14} />
              </span>
              <p style={{ fontFamily: "'Spectral', serif", fontSize: '13px', fontStyle: 'italic', color: 'rgb(var(--ink-300))', margin: 0, lineHeight: 1.6 }}>
                {current.tip}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-7 py-5 border-t border-gold-500/15 flex items-center justify-between gap-3 bg-black/20 mt-4">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'transparent',
              color: step === 0 ? 'rgb(var(--ink-500))' : 'rgb(var(--ink-300))',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: step === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Back
          </button>

          <span style={{ fontSize: '11px', color: 'rgb(var(--ink-400))', fontVariantNumeric: 'tabular-nums' }}>
            {step + 1} / {STEPS.length}
          </span>

          {isLast ? (
            <button
              onClick={finish}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d4b46d 0%, #b8954c 100%)',
                color: '#1a1410',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px -4px rgba(201,169,97,0.5)',
              }}
            >
              Let's go
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'rgba(201,169,97,0.15)',
                color: 'var(--gold)',
                border: '1px solid rgba(201,169,97,0.3)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Next
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
