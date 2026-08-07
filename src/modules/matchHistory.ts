/**
 * 📊 MATCH HISTORY & LEADERBOARD MODULE
 * History of offline & online matches, stats breakdown, replay log.
 * Loaded dynamically on-demand when user clicks Statistics or Leaderboard.
 */

export interface SavedMatch {
    id: string;
    date: string;
    mode: string;
    difficulty?: string;
    winner: 'Player' | 'CPU' | 'Opponent' | 'Draw';
    movesCount: number;
    durationSeconds: number;
}

export const MatchHistorySystem = {
    getHistory(): SavedMatch[] {
        try {
            const raw = localStorage.getItem('damma-match-history');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    saveMatch(match: SavedMatch) {
        const history = this.getHistory();
        history.unshift(match);
        if (history.length > 50) history.pop(); // Keep top 50 matches
        localStorage.setItem('damma-match-history', JSON.stringify(history));
    },

    renderStatsUI() {
        const history = this.getHistory();
        const totalMatches = history.length;
        const wins = history.filter(m => m.winner === 'Player').length;
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        const totalMatchesEl = document.getElementById('stat-total-matches');
        const winsEl = document.getElementById('stat-total-wins');
        const winRateEl = document.getElementById('stat-win-rate');

        if (totalMatchesEl) totalMatchesEl.textContent = totalMatches.toString();
        if (winsEl) winsEl.textContent = wins.toString();
        if (winRateEl) winRateEl.textContent = `${winRate}%`;

        const listContainer = document.getElementById('match-history-list');
        if (listContainer) {
            if (history.length === 0) {
                listContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">No match history found yet. Play a game to record stats!</div>';
                return;
            }

            listContainer.innerHTML = history.slice(0, 10).map(m => `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(229,184,66,0.2); border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="color: #ffd700; font-weight: 700; font-size: 0.9rem;">${m.mode.toUpperCase()}</span>
                        <span style="color: #94a3b8; font-size: 0.75rem; display: block;">${m.date} • ${m.movesCount} moves</span>
                    </div>
                    <span style="font-weight: 700; font-size: 0.9rem; color: ${m.winner === 'Player' ? '#2ed573' : (m.winner === 'Draw' ? '#ffd700' : '#ff4757')};">
                        ${m.winner === 'Player' ? 'VICTORY 🏆' : (m.winner === 'Draw' ? 'DRAW 🤝' : 'DEFEAT ❌')}
                    </span>
                </div>
            `).join('');
        }
    }
};

export function initMatchHistoryModule() {
    MatchHistorySystem.renderStatsUI();

    const statsBtn = document.getElementById('menu-statistics-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.add('active');
                import('./settings.js').then(mod => mod.openSettingsModal('stats'));
            }
        });
    }
}
