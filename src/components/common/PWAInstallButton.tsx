import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          void install();
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4D2F] border border-[#22C55E]/40 text-white font-semibold hover:bg-[#14633D] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'
        }`}
        aria-label="Install Cricket Arena App"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#111914] border border-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-[#19241D] transition-colors whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
        >
          <Share className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#101713] border border-white/15 p-6 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-bold tracking-tight">
                  Install Cricket Arena
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 flex items-center justify-center rounded-xl text-[#94A69C] hover:text-white hover:bg-white/5"
                  aria-label="Close install instructions"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-[#B8C7BE] leading-relaxed">
                Add Cricket Arena to your home screen for full-screen offline scoring:
              </p>
              <ol className="mt-4 space-y-2.5 text-sm text-white/90">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#22C55E] mt-0.5">01.</span>
                  <span>Tap the Share icon in your browser toolbar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#22C55E] mt-0.5">02.</span>
                  <span>Scroll down and select Add to Home Screen.</span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-xl bg-[#16A34A] text-white font-semibold text-sm hover:bg-[#15803D] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
