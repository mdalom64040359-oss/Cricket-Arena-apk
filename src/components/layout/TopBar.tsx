import React from 'react';
import {Plus, Wifi, WifiOff} from 'lucide-react';
import type {AppView} from '../../types/cricket';
import {CricketLogo} from '../common/CricketLogo';
import {PWAInstallButton} from '../common/PWAInstallButton';

interface TopBarProps {
  activeView: AppView;
  isOnline: boolean;
  onNavigate: (view: AppView) => void;
}

const DESKTOP_LINKS: Array<{view: AppView; label: string; shortLabel?: string}> = [
  {view: 'home', label: 'Home'},
  {view: 'matches', label: 'Matches'},
  {view: 'teams', label: 'Teams'},
  {view: 'tournaments', label: 'Tournaments'},
  {view: 'statistics', label: 'Statistics', shortLabel: 'Stats'},
  {view: 'profile', label: 'Profile'},
];

export const TopBar: React.FC<TopBarProps> = ({activeView, isOnline, onNavigate}) => {
  const isNavActive = (view: AppView) => {
    if (view === 'matches' && activeView === 'create-match') return true;
    if (view === 'teams' && activeView === 'players') return true;
    return activeView === view;
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#070A08]/95 backdrop-blur-md border-b border-white/10 pt-safe">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] rounded-lg"
        >
          <CricketLogo size={30} />
          <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Cricket Arena
          </span>
        </button>

        {/* Zone 2: Desktop Single-Line Navigation Links */}
        <nav className="hidden md:flex items-center gap-3.5 lg:gap-5" aria-label="Primary navigation">
          {DESKTOP_LINKS.map((item) => {
            const active = isNavActive(item.view);
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onNavigate(item.view)}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] ${
                  active
                    ? 'text-white border-[#22C55E]'
                    : 'text-[#9CB0A4] border-transparent hover:text-white'
                }`}
              >
                {item.shortLabel ? (
                  <>
                    <span className="lg:hidden">{item.shortLabel}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Connectivity Indicator, Install Trigger & Create Match */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              isOnline ? 'text-[#9AC2AA]' : 'text-amber-300'
            }`}
            title={isOnline ? 'Online — Offline cache active' : 'Offline Mode — IndexedDB active'}
            aria-label={isOnline ? 'Online' : 'Offline Mode'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Offline</span>
              </>
            )}
          </span>
          <div className="hidden lg:inline-flex">
            <PWAInstallButton compact />
          </div>
          <button
            type="button"
            onClick={() => onNavigate('create-match')}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition-all whitespace-nowrap shrink-0 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create Match</span>
          </button>
        </div>
      </div>
    </header>
  );
};
