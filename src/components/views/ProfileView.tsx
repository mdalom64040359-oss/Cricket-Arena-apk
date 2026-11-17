import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  exportDatabaseSnapshot,
  getOrganizerProfile,
  getStorageDiagnostics,
  importDatabaseSnapshot,
  requestPersistentStorage,
  saveOrganizerProfile,
  validateBackupSnapshot,
  type BackupValidationResult,
  type RestoreMode,
  type StorageDiagnostics,
} from '../../db/database';
import {usePWAInstall} from '../../hooks/usePWAInstall';
import {
  triggerServiceWorkerRefresh,
  useServiceWorkerStatus,
} from '../../pwa/swStatus';
import type {AppView, DashboardSummary, MatchFormat, OrganizerProfile} from '../../types/cricket';
import {PageHeader} from '../common/PageHeader';
import {PWAInstallButton} from '../common/PWAInstallButton';
import {RestoreConfirmModal} from '../profile/RestoreConfirmModal';

interface ProfileViewProps {
  summary: DashboardSummary;
  isOnline: boolean;
  onNavigate: (view: AppView) => void;
  onDataChanged: () => Promise<void>;
}

const DEFAULT_OVERS_FOR_FORMAT: Record<MatchFormat, number> = {
  T10: 10,
  T20: 20,
  ODI: 50,
  TEST: 90,
  CUSTOM: 15,
};

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  summary,
  isOnline,
  onNavigate,
  onDataChanged,
}) => {
  const [profile, setProfile] = useState<OrganizerProfile>({
    displayName: 'Local Scorer',
    clubName: 'Cricket Arena Club',
    defaultFormat: 'T20',
    defaultOvers: 20,
    updatedAt: '',
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupErrors, setBackupErrors] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics>({
    indexedDBReady: summary.storageReady,
    persisted: null,
    usageBytes: null,
    quotaBytes: null,
  });

  const [pendingRestore, setPendingRestore] = useState<{
    validation: BackupValidationResult;
    fileName: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const swStatus = useServiceWorkerStatus();
  const {isInstallable, isInstalled, isIOS} = usePWAInstall();

  const refreshDiagnostics = useCallback(async () => {
    const diag = await getStorageDiagnostics();
    setDiagnostics(diag);
  }, []);

  useEffect(() => {
    let active = true;
    getOrganizerProfile().then((loaded) => {
      if (active) setProfile(loaded);
    });
    void refreshDiagnostics();
    return () => {
      active = false;
    };
  }, [refreshDiagnostics, summary.totalRecords]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveOrganizerProfile(profile);
    setSaveMessage('Scorer profile saved locally in IndexedDB.');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const handleRequestPersistence = async () => {
    const granted = await requestPersistentStorage();
    await refreshDiagnostics();
    if (granted === true) {
      setBackupMessage('Persistent device storage granted by browser.');
      setBackupErrors([]);
    } else if (granted === false) {
      setBackupMessage(
        'Browser manages storage automatically; installing the app to your Home Screen improves retention.',
      );
    }
  };

  const handleExportBackup = async () => {
    setBackupErrors([]);
    setBackupMessage(null);
    try {
      const snapshot = await exportDatabaseSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cricket-arena-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      const c = snapshot.counts;
      setBackupMessage(
        c
          ? `Backup downloaded: ${c.matches} matches (${c.ballEvents} ball events), ${c.teams} teams, ${c.players} players, ${c.tournaments} tournaments & statistics.`
          : 'Backup JSON downloaded to your device.',
      );
    } catch {
      setBackupErrors(['Could not export local IndexedDB database.']);
    }
  };

  const handleRestoreFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBackupErrors([]);
    setBackupMessage(null);

    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setBackupErrors(['Selected file is not valid JSON. Existing device data was not modified.']);
        return;
      }

      const validation = validateBackupSnapshot(parsed);
      if (!validation.valid) {
        setBackupErrors([
          ...validation.errors,
          'Existing device data was preserved safely.',
        ]);
        return;
      }

      setPendingRestore({
        validation,
        fileName: file.name,
      });
    } catch {
      setBackupErrors(['Could not read the selected backup file.']);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRestore = async (mode: RestoreMode) => {
    if (!pendingRestore?.validation.snapshot) return;
    setIsRestoring(true);
    setBackupErrors([]);
    try {
      const count = await importDatabaseSnapshot(pendingRestore.validation.snapshot, mode);
      const loadedProfile = await getOrganizerProfile();
      setProfile(loadedProfile);
      await onDataChanged();
      await refreshDiagnostics();
      setBackupMessage(
        mode === 'replace'
          ? `Restored ${count} records cleanly (replaced previous data).`
          : `Merged ${count} records into local IndexedDB storage.`,
      );
      setPendingRestore(null);
    } catch (err) {
      setBackupErrors([
        err instanceof Error ? err.message : 'Failed to restore backup.',
      ]);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile & Storage"
        subtitle="Scorer identity, offline storage protection & JSON backup"
        onBackHome={() => onNavigate('home')}
        action={<PWAInstallButton />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Scorer / Organizer Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 rounded-2xl bg-[#101612] border border-white/10 p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0D3B24] border border-[#22C55E]/30 flex items-center justify-center text-[#4ADE80] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Scorer Profile</h2>
              <p className="text-xs text-[#9CB0A4]">Stored offline on this Android device</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D6CE]">Scorer / Organizer Name</span>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                className="w-full min-h-[44px] rounded-xl bg-[#080C0A] border border-white/15 px-3.5 text-sm text-white placeholder-[#6E8276] focus:outline-none focus:border-[#22C55E]"
                placeholder="Enter your name"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D6CE]">Club / Association Name</span>
              <input
                type="text"
                value={profile.clubName}
                onChange={(e) => setProfile({...profile, clubName: e.target.value})}
                className="w-full min-h-[44px] rounded-xl bg-[#080C0A] border border-white/15 px-3.5 text-sm text-white placeholder-[#6E8276] focus:outline-none focus:border-[#22C55E]"
                placeholder="Enter club name"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D6CE]">Preferred Format</span>
              <select
                value={profile.defaultFormat}
                onChange={(e) => {
                  const nextFormat = e.target.value as MatchFormat;
                  setProfile({
                    ...profile,
                    defaultFormat: nextFormat,
                    defaultOvers: DEFAULT_OVERS_FOR_FORMAT[nextFormat],
                  });
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#080C0A] border border-white/15 px-3.5 text-sm text-white focus:outline-none focus:border-[#22C55E]"
              >
                <option value="T10">T10 (10 Overs)</option>
                <option value="T20">T20 (20 Overs)</option>
                <option value="ODI">ODI (50 Overs)</option>
                <option value="TEST">Test Match</option>
                <option value="CUSTOM">Custom Overs</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#C8D6CE]">Default Overs</span>
              <input
                type="number"
                min={1}
                max={450}
                value={profile.defaultOvers}
                onChange={(e) =>
                  setProfile({...profile, defaultOvers: Math.max(1, Number(e.target.value) || 20)})
                }
                className="w-full min-h-[44px] rounded-xl bg-[#080C0A] border border-white/15 px-3.5 font-mono text-sm text-white focus:outline-none focus:border-[#22C55E]"
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {saveMessage ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4ADE80]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{saveMessage}</span>
              </span>
            ) : (
              <span className="text-xs text-[#8FA397]">Changes persist across offline restarts.</span>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>

        {/* Local Storage, Backup & Offline Status */}
        <div className="lg:col-span-5 rounded-2xl bg-[#101612] border border-white/10 p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#141E18] border border-white/10 flex items-center justify-center text-[#22C55E] shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-white">Device Storage</h2>
                <p className="text-xs text-[#9CB0A4]">
                  {diagnostics.indexedDBReady ? 'IndexedDB Active' : 'Initializing Storage'}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B8C7BE]">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">Offline</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3">
              <div className="text-xs text-[#8FA397]">Matches</div>
              <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                {summary.matchesCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3">
              <div className="text-xs text-[#8FA397]">Teams</div>
              <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                {summary.teamsCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3">
              <div className="text-xs text-[#8FA397]">Players</div>
              <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                {summary.playersCount}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3">
              <div className="text-xs text-[#8FA397]">Tournaments</div>
              <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                {summary.tournamentsCount}
              </div>
            </div>
          </div>

          {/* Offline Cache & Persistence Status */}
          <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[#9CB0A4]">
                <HardDrive className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Offline App Cache</span>
              </span>
              <span
                className={`font-mono font-semibold ${
                  swStatus.offlineReady
                    ? 'text-[#4ADE80]'
                    : swStatus.error
                      ? 'text-amber-300'
                      : 'text-[#D7E4DC]'
                }`}
              >
                {swStatus.offlineReady
                  ? 'Ready Offline'
                  : swStatus.registered
                    ? 'Caching...'
                    : swStatus.supported
                      ? 'Initializing'
                      : 'Unsupported'}
              </span>
            </div>

            {diagnostics.usageBytes !== null && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#9CB0A4]">Device Storage Used</span>
                <span className="font-mono text-[#D7E4DC] tabular-nums">
                  {formatBytes(diagnostics.usageBytes)}
                  {diagnostics.quotaBytes ? ` / ${formatBytes(diagnostics.quotaBytes)}` : ''}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[#9CB0A4]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Eviction Protection</span>
              </span>
              {diagnostics.persisted === true ? (
                <span className="font-mono font-semibold text-[#4ADE80]">Persistent</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void handleRequestPersistence();
                  }}
                  className="font-semibold text-[#4ADE80] hover:text-white underline underline-offset-2"
                >
                  Enable Protection
                </button>
              )}
            </div>

            {swStatus.needRefresh && (
              <button
                type="button"
                onClick={() => {
                  void triggerServiceWorkerRefresh();
                }}
                className="w-full min-h-[38px] mt-1 rounded-lg bg-[#0D3B24] hover:bg-[#145334] border border-[#22C55E]/40 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>Update Offline App Cache</span>
              </button>
            )}
          </div>

          {/* Android Install Guide when not yet in standalone */}
          {!isInstalled && !isInstallable && !isIOS && (
            <div className="rounded-xl bg-[#0B100D] border border-white/10 p-3.5 flex items-start gap-2.5 text-xs text-[#9CB0A4]">
              <Smartphone className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-white">Install on Android</div>
                <p className="mt-0.5 leading-relaxed">
                  Open Chrome menu (<span className="font-mono text-white">⋮</span>) and tap{' '}
                  <span className="text-white font-medium">Install app</span> or{' '}
                  <span className="text-white font-medium">Add to Home screen</span> for full-screen
                  offline access.
                </p>
              </div>
            </div>
          )}

          {/* Backup & Restore */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Backup &amp; Restore</h3>
              <p className="text-xs text-[#8FA397] mt-0.5">
                Exports teams, players, matches, ball events, tournaments &amp; statistics as a
                versioned JSON file.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  void handleExportBackup();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#161F19] hover:bg-[#1E2B23] border border-white/15 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-[#22C55E]" />
                <span>Restore Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  void handleRestoreFileSelected(e);
                }}
                className="hidden"
                aria-label="Restore Cricket Arena backup JSON file"
              />
            </div>

            {backupMessage && (
              <div className="rounded-xl bg-[#0D3B24]/60 border border-[#22C55E]/30 p-3 flex items-start gap-2 text-xs text-[#4ADE80]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{backupMessage}</span>
              </div>
            )}

            {backupErrors.length > 0 && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 space-y-1 text-xs text-rose-300">
                {backupErrors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-[#8FA397] pt-1">
              <CloudOff className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <span>
                100% offline local storage in IndexedDB. Cloud sync is not enabled; use Export
                Backup to transfer or safeguard your records.
              </span>
            </div>
          </div>
        </div>
      </div>

      {pendingRestore && (
        <RestoreConfirmModal
          validation={pendingRestore.validation}
          fileName={pendingRestore.fileName}
          currentSummary={summary}
          isRestoring={isRestoring}
          onExportCurrentFirst={handleExportBackup}
          onConfirm={(mode) => {
            void handleConfirmRestore(mode);
          }}
          onCancel={() => {
            if (!isRestoring) {
              setPendingRestore(null);
            }
          }}
        />
      )}
    </div>
  );
};
