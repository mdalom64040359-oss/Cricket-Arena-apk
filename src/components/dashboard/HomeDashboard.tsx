import React from 'react';
import {
  ArrowRight,
  BarChart3,
  Database,
  Plus,
  Radio,
  Shield,
  Trophy,
  UserCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {formatOvers} from '../../engine/scoringEngine';
import type {AppView, DashboardSummary} from '../../types/cricket';
import {CricketLogo} from '../common/CricketLogo';
import {PWAInstallButton} from '../common/PWAInstallButton';

interface HomeDashboardProps {
  summary: DashboardSummary;
  isLoading: boolean;
  isOnline: boolean;
  onNavigate: (view: AppView) => void;
  onOpenMatch?: (matchId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  summary,
  isLoading,
  isOnline,
  onNavigate,
  onOpenMatch,
}) => {
  const managementCards: Array<{
    view: AppView;
    title: string;
    subtitle: string;
    countLabel: string;
    icon: React.ComponentType<{className?: string}>;
  }> = [
    {
      view: 'teams',
      title: 'Teams',
      subtitle: 'Club squads & playing XI rosters',
      countLabel: isLoading ? '—' : `${summary.teamsCount} Teams`,
      icon: Shield,
    },
    {
      view: 'players',
      title: 'Players',
      subtitle: 'Batting, bowling & keeper profiles',
      countLabel: isLoading ? '—' : `${summary.playersCount} Players`,
      icon: UserCheck,
    },
    {
      view: 'tournaments',
      title: 'Tournaments',
      subtitle: '20 to 50+ teams · Fixtures & NRR',
      countLabel: isLoading ? '—' : `${summary.tournamentsCount} Tournaments`,
      icon: Trophy,
    },
    {
      view: 'statistics',
      title: 'Statistics',
      subtitle: 'Leaderboards, averages & NRR',
      countLabel: isLoading ? '—' : `${summary.completedMatchesCount} Completed`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Hero & Live Matches Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        {/* Focal Anchor: Create Match */}
        <div className="lg:col-span-7 rounded-2xl bg-gradient-to-br from-[#0D3B24] via-[#092818] to-[#0D1410] border border-[#22C55E]/25 p-5 sm:p-7 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <CricketLogo size={46} className="shrink-0" />
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
                  Cricket Arena
                </h1>
                <p className="text-xs sm:text-sm text-[#B8D0C2]">
                  Offline-First Scoring &amp; Tournament Hub
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#D7E4DC] leading-relaxed max-w-xl">
              Score matches ball-by-ball on the boundary line with zero internet dependency, organize
              multi-group tournaments, and store every innings safely on your device.
            </p>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#9AC2AA]">
              <span>T10</span>
              <span aria-hidden="true">·</span>
              <span>T20</span>
              <span aria-hidden="true">·</span>
              <span>ODI</span>
              <span aria-hidden="true">·</span>
              <span>Test</span>
              <span aria-hidden="true">·</span>
              <span>Custom Overs</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('create-match')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.98] px-6 py-3 min-h-[48px] text-sm sm:text-base font-semibold text-white transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span>Create Match</span>
            </button>
            <PWAInstallButton />
          </div>
        </div>

        {/* Companion Panel: Live Matches */}
        <div className="lg:col-span-5 rounded-2xl bg-[#101612] border border-white/10 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-[#22C55E] shrink-0" />
              <h2 className="font-display text-lg font-bold text-white tracking-tight">
                Live Matches
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('matches')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4ADE80] hover:text-white min-h-[40px] px-2 -mr-2 rounded-lg whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
            >
              <span>All Matches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-sm text-[#9CB0A4]">Loading local scoreboard records...</div>
          ) : summary.liveMatches.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center py-4 space-y-3">
              <p className="text-sm font-semibold text-white">No live matches in progress</p>
              <p className="text-xs sm:text-sm text-[#9CB0A4] leading-relaxed">
                Matches started on this device appear here automatically for instant resume and
                ball-by-ball scoring.
              </p>
              <div className="pt-1 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('create-match')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17211B] hover:bg-[#1E2B23] border border-white/15 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
                >
                  <span>Start a New Match</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.liveMatches.slice(0, 2).map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => (onOpenMatch ? onOpenMatch(match.id) : onNavigate('matches'))}
                  className="w-full text-left rounded-xl bg-[#161F19] hover:bg-[#1C2820] border border-white/10 p-3.5 transition-colors min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white truncate">{match.title}</span>
                    <span className="font-mono text-xs text-[#4ADE80] tabular-nums shrink-0">
                      {match.format}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[#9CB0A4] truncate">
                    {match.innings.length > 0
                      ? match.innings
                          .map((inn) => {
                            const s =
                              inn.battingTeamId === match.teamAId
                                ? match.teamAShortName
                                : match.teamBShortName;
                            return `${s} ${inn.runs}/${inn.wickets} (${formatOvers(inn.legalBalls)})`;
                          })
                          .join(' · ')
                      : `${match.teamAName} vs ${match.teamBName}`}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#9CB0A4]">
            <span>Total Recorded Matches</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {isLoading ? '—' : summary.matchesCount}
            </span>
          </div>
        </div>
      </section>

      {/* Core Modules Grid: Teams, Players, Tournaments, Statistics */}
      <section aria-labelledby="arena-modules-heading" className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="arena-modules-heading"
            className="font-display text-lg sm:text-xl font-bold text-white tracking-tight"
          >
            Club &amp; Tournament Tools
          </h2>
          <span className="text-xs text-[#9CB0A4]">Tap any card to open</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {managementCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.view}
                type="button"
                onClick={() => onNavigate(card.view)}
                className="group text-left rounded-2xl bg-[#101612] hover:bg-[#141D17] border border-white/10 hover:border-[#22C55E]/40 p-4 sm:p-5 flex flex-col justify-between gap-4 min-h-[140px] active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#0D3B24]/70 border border-[#22C55E]/25 flex items-center justify-center text-[#4ADE80] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8FA397] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-white tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#9CB0A4] leading-snug line-clamp-2">{card.subtitle}</p>
                </div>

                <div className="pt-2 border-t border-white/5 text-xs font-mono font-medium text-[#C8D6CE] tabular-nums">
                  {card.countLabel}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Local Storage & Profile Strip */}
      <section className="rounded-2xl bg-[#0D120F] border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#141E18] border border-white/10 flex items-center justify-center text-[#22C55E] shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-white">
              <span>Local IndexedDB Storage</span>
              <span aria-hidden="true" className="text-[#6E8276]">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9AC2AA]">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Online (Offline Cache Active)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Offline Mode Active</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#9CB0A4]">
              {summary.storageReady
                ? `${summary.totalRecords} local records saved on this device · JSON backup ready`
                : 'Initializing local device database...'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#161F19] hover:bg-[#1E2B23] border border-white/15 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
        >
          <span>Profile &amp; Backup</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
