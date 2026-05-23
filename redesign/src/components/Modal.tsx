import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { cx } from '@/lib/utils';

interface Props {
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: string;
  children: ReactNode;
  footer: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export function Modal({ onClose, title, subtitle, icon, accent = '#d4b46d', children, footer, width = 'md' }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cx(
          'w-full max-h-[92vh] overflow-auto bg-gradient-to-b from-ink-800/95 to-ink-900/95 border border-gold-500/30 animate-fade-in',
          // Bottom-sheet on mobile, centred dialog on ≥ sm
          'rounded-t-2xl sm:rounded-2xl',
          width === 'sm' && 'sm:max-w-md',
          width === 'md' && 'sm:max-w-xl',
          width === 'lg' && 'sm:max-w-2xl'
        )}
        style={{ boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(201, 169, 97, 0.15)' }}
      >
        {/* Sheet grabber — only visible on mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden="true">
          <div className="w-9 h-1 rounded-full bg-gold-500/35" />
        </div>
        <header className="px-7 pt-6 pb-5 border-b border-gold-500/15 flex items-center gap-3.5" style={{ background: `linear-gradient(180deg, ${accent}15, transparent)` }}>
          {icon && (
            <div
              className="w-11 h-11 rounded-xl grid place-items-center"
              style={{
                background: `linear-gradient(180deg, ${accent}30, ${accent}15)`,
                border: `1px solid ${accent}40`,
                color: accent
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 id="modal-title" className="text-xl font-display font-bold m-0 text-ink-100">{title}</h2>
            {subtitle && <p className="text-xs text-ink-100/60 m-0">{subtitle}</p>}
          </div>
        </header>
        <div className="px-7 py-6 grid gap-4">{children}</div>
        <footer className="px-7 py-5 border-t border-gold-500/15 flex gap-2.5 justify-end bg-black/20">{footer}</footer>
      </div>
    </div>
  );
}

export function Field({ label, children, optional, span }: { label: string; children: ReactNode; optional?: boolean; span?: 'full' }) {
  return (
    <label className={cx('block', span === 'full' && 'col-span-2')}>
      <div className="text-[10px] uppercase tracking-widest text-ink-100/60 font-semibold mb-1.5">
        {label}
        {optional && <span className="normal-case tracking-normal opacity-60"> · optional</span>}
      </div>
      {children}
    </label>
  );
}
