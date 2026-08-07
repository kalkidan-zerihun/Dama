import React, { memo, useState, useCallback, useMemo } from 'react';

// Memoized Header title component
const HeaderTitle = memo<{ title: string; subtitle: string }>(({ title, subtitle }) => {
  return (
    <div className="menu-brand-header text-center my-2">
      <h1 className="menu-logo-title font-serif text-4xl text-amber-400 font-bold tracking-widest my-1">{title}</h1>
      <p className="menu-logo-subtitle text-amber-200/80 text-sm italic">{subtitle}</p>
    </div>
  );
});
HeaderTitle.displayName = 'HeaderTitle';

// Memoized Stat Badge
const StatBadge = memo<{ label: string; value: string | number; color?: string }>(({ label, value, color = 'text-amber-300' }) => {
  return (
    <div className="bg-amber-950/60 border border-amber-500/30 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[90px]">
      <span className="text-[10px] text-amber-200/60 uppercase font-serif tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
});
StatBadge.displayName = 'StatBadge';

export default function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'settings' | 'history'>('menu');
  const [dailyStreak, setDailyStreak] = useState(() => {
    return parseInt(localStorage.getItem('damma-daily-streak') || '0', 10);
  });

  const appTitle = useMemo(() => "DAMMA", []);
  const appSubtitle = useMemo(() => "Ethiopian Traditional Strategy", []);

  const handleOpenSettings = useCallback(async () => {
    setActiveTab('settings');
    const settings = await import('./modules/settings');
    settings.openSettingsModal('rules');
  }, []);

  const handleOpenDailyChallenge = useCallback(async () => {
    const daily = await import('./modules/dailyChallenge');
    daily.DailyChallengeSystem.openChallengeModal();
  }, []);

  const handleOpenOnline = useCallback(async () => {
    const online = await import('./modules/onlineMultiplayer');
    online.initOnlineMultiplayerModule();
  }, []);

  const handleStartGame = useCallback(async () => {
    const game = await import('./modules/gameEngine');
    game.launchNewMatch({ gameMode: 'vs-cpu', difficulty: 'medium' });
  }, []);

  return (
    <div className="react-shell-container hidden">
      <HeaderTitle title={appTitle} subtitle={appSubtitle} />
      <div className="stats-row flex justify-center gap-3 my-2">
        <StatBadge label="STREAK" value={`${dailyStreak} Days 🔥`} />
        <StatBadge label="RANK" value="Warrior 🛡️" color="text-emerald-400" />
      </div>
    </div>
  );
}
