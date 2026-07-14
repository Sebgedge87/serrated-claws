import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '@/components/Icons';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  color?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = '— None —', disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find(o => o.value === value);

  function toggle() {
    if (open) { setOpen(false); return; }
    setRect(btnRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (dropRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const dropdown = open && rect ? createPortal(
    <div ref={dropRef} style={{
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 180),
      zIndex: 9999,
      background: 'rgb(20,18,14)',
      border: '1px solid var(--line-strong)',
      borderRadius: '6px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
      maxHeight: Math.min(300, window.innerHeight - rect.bottom - 12),
      overflowY: 'auto',
    }}>
      {placeholder && (
        <button type="button" className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
          style={{ color: 'rgb(var(--ink-300))' }}
          onClick={() => { onChange(''); setOpen(false); }}>
          {placeholder}
        </button>
      )}
      {options.map(o => (
        <button key={o.value} type="button"
          className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-white/5"
          style={{ color: o.value === value ? 'var(--gold)' : (o.color ?? 'rgb(var(--ink-100))'), background: o.value === value ? 'rgba(203,171,104,0.1)' : undefined }}
          onClick={() => { onChange(o.value); setOpen(false); }}>
          {o.label}
          {o.sublabel && <span style={{ color: 'rgb(var(--ink-300))', marginLeft: 6, fontSize: '11px' }}>{o.sublabel}</span>}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div className={className} style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <button ref={btnRef} type="button" onClick={toggle}
        className="input w-full flex items-center justify-between gap-2 text-left cursor-pointer"
        style={{ color: selected ? (selected.color ?? 'rgb(var(--ink-100))') : 'rgb(var(--ink-300))' }}>
        <span className="truncate flex-1">{selected?.label ?? placeholder}</span>
        <Icons.ChevronDown size={12} style={{ flexShrink: 0, color: 'rgb(var(--ink-300))' }} />
      </button>
      {dropdown}
    </div>
  );
}
