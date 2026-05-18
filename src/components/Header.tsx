import { Icons } from '@/lib/icons';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile | null;
  onSignOut: () => void;
}

export function Header({ profile, onSignOut }: Props) {
  return (
    <header
      className="relative overflow-hidden border-b border-gold-500/15 px-12 py-7"
      style={{ background: 'linear-gradient(135deg, rgba(28,22,14,0.95) 0%, rgba(50,30,14,0.95) 100%)' }}
    >
      <div
        className="absolute top-[-40px] right-[-40px] w-[300px] h-[300px] opacity-[0.04] text-gold-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gold-gradient text-ink-900 flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(201,169,97,0.6),0_1px_0_rgba(255,255,255,0.3)_inset]">
            <Icons.Swords size={24} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold gold-text leading-none">The Serrated Claws</h1>
            <p className="text-xs text-ink-300 uppercase tracking-widest mt-1">Lance Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="text-right text-sm">
              <div className="text-ink-100">{profile.display_name ?? profile.email}</div>
              <div className="text-[11px] uppercase tracking-widest text-ink-300">{profile.role}</div>
            </div>
          )}
          <Button variant="ghost" size="sm" icon={<Icons.LogOut size={14} />} onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
