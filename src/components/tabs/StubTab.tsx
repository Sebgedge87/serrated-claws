import { Icons } from '@/lib/icons';

interface Props {
  title: string;
  todo: string;
}

export function StubTab({ title, todo }: Props) {
  return (
    <div className="animate-fade-in py-16 text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
        <Icons.Wand size={28} />
      </div>
      <h2 className="font-display text-2xl gold-text mb-2">{title}</h2>
      <p className="text-sm text-ink-300 leading-relaxed">{todo}</p>
      <p className="text-[11px] text-ink-300 mt-6 uppercase tracking-widest">
        Port from <code className="font-mono">lance-manager.html</code>
      </p>
    </div>
  );
}
