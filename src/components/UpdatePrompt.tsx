import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icons } from '@/components/Icons';

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  function handleRefresh() {
    updateServiceWorker(true);
    // Fallback: hard reload after a short delay if SW update doesn't trigger one
    setTimeout(() => window.location.reload(), 1000);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-4 py-3 rounded-xl border border-gold-500/30 bg-ink-900/95 backdrop-blur shadow-lift text-sm whitespace-nowrap">
      <Icons.Sparkles size={16} className="text-gold-300 shrink-0" />
      <span className="text-ink-100">A new version is available</span>
      <button
        onClick={handleRefresh}
        className="btn btn-primary btn-sm"
      >
        Refresh
      </button>
    </div>
  );
}
