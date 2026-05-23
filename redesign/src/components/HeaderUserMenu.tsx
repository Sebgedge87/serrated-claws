import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icons } from '@/components/Icons';
import { useConfirm } from '@/components/ConfirmDialog';
import { initials, cx } from '@/lib/utils';
import type { Profile, LanceMembership, Lance } from '@/lib/types';

interface Props {
  profile: Profile | null;
  user: { email?: string | null } | null;
  currentMembership: LanceMembership | null;
  memberships: LanceMembership[];
  currentLance: Lance | null;
  onSwitchLance: (id: string) => void;
  onLeaveLance: () => Promise<void>;
  onSignOut: () => void;
  wikiUrl: string;
}

/**
 * Single avatar-dropdown that collects every non-primary header action:
 * Switch Lance · Empire Wiki · Settings · Leave lance · Sign out.
 *
 * The bare header right-side becomes: <My Character> <Avatar▾>.
 */
export function HeaderUserMenu({
  profile, user, currentMembership, memberships, currentLance,
  onSwitchLance, onLeaveLance, onSignOut, wikiUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { confirm, Dialog } = useConfirm();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const displayName = profile?.display_name ?? user?.email ?? 'Signed in';
  const role = currentMembership?.role ?? profile?.role ?? 'viewer';
  const init = initials(displayName);

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className={cx(
            'btn btn-ghost gap-2 pl-1.5 pr-2.5 py-1',
            open && '!border-gold-300'
          )}
        >
          <span className="w-7 h-7 rounded-full grid place-items-center font-display font-bold text-[11px]
                           bg-gradient-to-br from-ink-700 to-ink-800 text-ink-100
                           border border-gold-500/30">
            {init}
          </span>
          <span className="hidden sm:inline text-sm text-ink-100">{displayName}</span>
          <Icons.ChevronDown size={14} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] w-60 z-50
                       bg-gradient-to-b from-ink-800/95 to-ink-900/95
                       border border-gold-500/25 rounded-xl
                       shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]
                       backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gold-500/10">
              <div className="text-sm text-ink-100 truncate">{displayName}</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-gold-300 mt-0.5 truncate">
                {role}{currentLance?.name ? ` · ${currentLance.name}` : ''}
              </div>
            </div>

            {memberships.length > 1 && (
              <>
                <MenuLabel>Lance</MenuLabel>
                <MenuItem onClick={() => setSwitching(v => !v)}>
                  <Icons.Shield size={14} className="text-ink-300" />
                  Switch lance…
                  <Icons.ChevronDown
                    size={12}
                    className={cx('ml-auto text-ink-300 transition-transform', switching && 'rotate-180')}
                  />
                </MenuItem>
                {switching && (
                  <div className="px-2 pb-2">
                    {memberships.map(m => (
                      <button
                        key={m.lance_id}
                        onClick={() => { onSwitchLance(m.lance_id); setOpen(false); }}
                        className={cx(
                          'w-full text-left text-xs px-3 py-2 rounded-md mb-0.5',
                          m.lance_id === currentLance?.id
                            ? 'bg-gold-500/15 text-gold-300'
                            : 'text-ink-100 hover:bg-gold-500/5'
                        )}
                      >
                        {m.lance?.name ?? m.lance_id}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <a
              role="menuitem"
              href={wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="menu-item w-full"
              onClick={() => setOpen(false)}
            >
              <Icons.BookOpen size={14} className="text-ink-300" />
              Empire Wiki
              <Icons.ExternalLink size={11} className="ml-auto text-ink-300" />
            </a>

            <MenuLabel>Account</MenuLabel>
            <MenuItem
              danger
              onClick={async () => {
                setOpen(false);
                if (!currentLance) return;
                if (await confirm({
                  title: `Leave "${currentLance.name}"?`,
                  body: 'You will lose access until re-invited.',
                  danger: true,
                  confirmLabel: 'Leave',
                })) await onLeaveLance();
              }}
            >
              <Icons.LogOut size={14} />
              Leave this lance
            </MenuItem>
            <MenuItem onClick={() => { setOpen(false); onSignOut(); }}>
              <Icons.LogOut size={14} className="text-ink-300" />
              Sign out
            </MenuItem>
          </div>
        )}
      </div>
      {Dialog}
    </>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[0.18em] text-gold-300/60 font-bold border-b border-gold-500/10">
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cx(
        'menu-item w-full',
        danger && 'text-red-300/85 hover:text-red-300'
      )}
    >
      {children}
    </button>
  );
}
