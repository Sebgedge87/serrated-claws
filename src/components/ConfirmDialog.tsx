import { useState } from 'react';
import { Icons } from '@/components/Icons';

interface Options {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface State extends Options {
  resolve: (v: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<State | null>(null);

  function confirm(opts: Options): Promise<boolean> {
    return new Promise(resolve => setState({ ...opts, resolve }));
  }

  function close(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  const Dialog = state ? (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-5 bg-black/75 backdrop-blur-md"
      onClick={() => close(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-gradient-to-b from-ink-800/95 to-ink-900/95 border border-gold-500/30 rounded-2xl animate-fade-in shadow-2xl"
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 ${state.danger ? 'bg-red-500/20 text-red-400' : 'bg-gold-500/20 text-gold-300'}`}>
              {state.danger ? <Icons.Trash size={16} /> : <Icons.Question size={16} />}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink-100 leading-tight m-0">{state.title}</h3>
              {state.body && <p className="text-sm text-ink-100/60 mt-1 m-0">{state.body}</p>}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => close(false)} className="btn btn-ghost btn-sm">Cancel</button>
            <button
              autoFocus
              onClick={() => close(true)}
              className={`btn btn-sm ${state.danger ? 'btn-danger' : 'btn-primary'}`}
            >
              {state.confirmLabel ?? (state.danger ? 'Delete' : 'Confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, Dialog };
}
