/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect, useState} from 'react';
import {App as CapacitorApp} from '@capacitor/app';
import {Capacitor} from '@capacitor/core';
import {WifiOff} from 'lucide-react';
import {HomeDashboard} from './components/dashboard/HomeDashboard';
import {BottomNav} from './components/layout/BottomNav';
import {TopBar} from './components/layout/TopBar';
import {CreateMatchView} from './components/views/CreateMatchView';
import {MatchesView} from './components/views/MatchesView';
import {PlayersView} from './components/views/PlayersView';
import {ProfileView} from './components/views/ProfileView';
import {StatisticsView} from './components/views/StatisticsView';
import {TeamsView} from './components/views/TeamsView';
import {TournamentsView} from './components/views/TournamentsView';
import {requestPersistentStorage} from './db/database';
import {useAppSummary} from './hooks/useAppSummary';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import type {AppView, Match} from './types/cricket';

const VIEW_PAGE_TITLES: Record<AppView, string> = {
  home: 'Cricket Arena — Match Scoring & Tournament Management',
  matches: 'Matches & Live Scoring — Cricket Arena',
  'create-match': 'Create Match — Cricket Arena',
  teams: 'Teams & Rosters — Cricket Arena',
  players: 'Players — Cricket Arena',
  tournaments: 'Tournaments & Points Table — Cricket Arena',
  statistics: 'Statistics & Leaderboards — Cricket Arena',
  profile: 'Profile, Offline Cache & Backup — Cricket Arena',
};

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const {summary, isLoading, refresh} = useAppSummary();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    void requestPersistentStorage();
  }, []);

  useEffect(() => {
    document.title = VIEW_PAGE_TITLES[activeView] ?? VIEW_PAGE_TITLES.home;
  }, [activeView]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: {remove: () => Promise<void>} | null = null;
    void CapacitorApp.addListener('backButton', () => {
      if (activeView === 'matches' && selectedMatchId) {
        setSelectedMatchId(null);
        return;
      }
      if (activeView === 'create-match') {
        setEditingMatch(null);
        setActiveView('matches');
        return;
      }
      if (activeView === 'players') {
        setActiveView('teams');
        return;
      }
      if (activeView !== 'home') {
        setActiveView('home');
        return;
      }
      void CapacitorApp.minimizeApp();
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      void listenerHandle?.remove();
    };
  }, [activeView, selectedMatchId]);

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    if (view !== 'matches') {
      setSelectedMatchId(null);
    }
    if (view !== 'create-match') {
      setEditingMatch(null);
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleOpenMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setEditingMatch(null);
    setActiveView('matches');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setActiveView('create-match');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleMatchSaved = async (savedMatch: Match) => {
    await refresh();
    setEditingMatch(null);
    setSelectedMatchId(savedMatch.id);
    setActiveView('matches');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const renderCurrentView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeDashboard
            summary={summary}
            isLoading={isLoading}
            isOnline={isOnline}
            onNavigate={handleNavigate}
            onOpenMatch={handleOpenMatch}
          />
        );
      case 'matches':
        return (
          <MatchesView
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onEditMatch={handleEditMatch}
            onNavigate={handleNavigate}
            onDataChanged={refresh}
          />
        );
      case 'create-match':
        return (
          <CreateMatchView
            summary={summary}
            editingMatch={editingMatch}
            onNavigate={handleNavigate}
            onMatchSaved={handleMatchSaved}
            onCancelEdit={() => {
              setEditingMatch(null);
              handleNavigate('matches');
            }}
          />
        );
      case 'teams':
        return (
          <TeamsView
            onNavigate={handleNavigate}
            onOpenMatch={handleOpenMatch}
            onDataChanged={refresh}
          />
        );
      case 'players':
        return <PlayersView onNavigate={handleNavigate} onDataChanged={refresh} />;
      case 'tournaments':
        return (
          <TournamentsView
            onNavigate={handleNavigate}
            onOpenMatch={handleOpenMatch}
            onDataChanged={refresh}
          />
        );
      case 'statistics':
        return (
          <StatisticsView
            summary={summary}
            onNavigate={handleNavigate}
            onOpenMatch={handleOpenMatch}
          />
        );
      case 'profile':
        return (
          <ProfileView
            summary={summary}
            isOnline={isOnline}
            onNavigate={handleNavigate}
            onDataChanged={refresh}
          />
        );
      default:
        return (
          <HomeDashboard
            summary={summary}
            isLoading={isLoading}
            isOnline={isOnline}
            onNavigate={handleNavigate}
            onOpenMatch={handleOpenMatch}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070A08] text-white flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-[#16A34A] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <TopBar activeView={activeView} isOnline={isOnline} onNavigate={handleNavigate} />

      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#1A1508] border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Offline Mode — Scoring, teams, tournaments &amp; stats are saving locally on your device.</span>
        </div>
      )}

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-12 focus:outline-none"
      >
        {renderCurrentView()}
      </main>

      <BottomNav activeView={activeView} onNavigate={handleNavigate} />
    </div>
  );
}
