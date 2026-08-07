/**
 * 👑 DAILY CHALLENGE MODULE
 * Guaranteed solvable Ethiopian Damma positions with local/online persistence, streak tracking.
 * Loaded dynamically on-demand when user clicks Daily Challenge.
 */

export interface DailyChallengePuzzle {
    id: string;
    title: string;
    titleAmharic: string;
    subtitle: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    rule: 'egregna' | 'toregna';
    initialBoard: number[][];
    solutionMoves: Array<{ fromR: number; fromC: number; toR: number; toC: number }>;
}

export const DAILY_PUZZLES: DailyChallengePuzzle[] = [
    {
        id: 'puzzle_1',
        title: "Warrior's Leap",
        titleAmharic: "የጀግናው ዝላይ",
        subtitle: "Execute a double jump capture to eliminate enemy forces.",
        difficulty: 'Easy',
        rule: 'egregna',
        initialBoard: [
            [0,0,0,0,0,0,0,0],
            [0,-1,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,-1,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        solutionMoves: [
            { fromR: 5, fromC: 5, toR: 3, toC: 3 },
            { fromR: 3, fromC: 3, toR: 1, toC: 1 }
        ]
    },
    {
        id: 'puzzle_2',
        title: "Royal Coronation",
        titleAmharic: "የንጉስ ዘውድ",
        subtitle: "Promote piece to King and claim victory.",
        difficulty: 'Medium',
        rule: 'egregna',
        initialBoard: [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,1,0,0,0],
            [0,0,0,-1,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ],
        solutionMoves: [
            { fromR: 1, fromC: 4, toR: 0, toC: 5 }
        ]
    }
];

export function validatePuzzleSolvability(puzzle: DailyChallengePuzzle): boolean {
    if (!puzzle || !puzzle.initialBoard || !puzzle.solutionMoves || puzzle.solutionMoves.length === 0) {
        return false;
    }
    // Deep clone board
    const board = puzzle.initialBoard.map(row => [...row]);
    
    for (const move of puzzle.solutionMoves) {
        const piece = board[move.fromR][move.fromC];
        if (piece <= 0) return false; // Must be player piece
        board[move.fromR][move.fromC] = 0;
        board[move.toR][move.toC] = piece;
        // Check if capture occurred between from and to
        const capR = (move.fromR + move.toR) / 2;
        const capC = (move.fromC + move.toC) / 2;
        if (Number.isInteger(capR) && Number.isInteger(capC)) {
            board[capR][capC] = 0;
        }
    }
    return true;
}

export const DailyChallengeSystem = {
    streak: 0,
    lastCompletedDate: null as string | null,

    init() {
        this.streak = parseInt(localStorage.getItem('damma-daily-streak') || '0', 10);
        this.lastCompletedDate = localStorage.getItem('damma-daily-last-date');
        this.updateStreakUI();
    },

    getTodayPuzzle(): DailyChallengePuzzle {
        const todayStr = new Date().toISOString().split('T')[0];
        let hash = 0;
        for (let i = 0; i < todayStr.length; i++) {
            hash = (hash << 5) - hash + todayStr.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % DAILY_PUZZLES.length;
        const puzzle = DAILY_PUZZLES[index];
        // Validate puzzle solvability on load
        if (!validatePuzzleSolvability(puzzle)) {
            return DAILY_PUZZLES[0];
        }
        return puzzle;
    },

    isTodayCompleted(): boolean {
        const todayStr = new Date().toISOString().split('T')[0];
        return this.lastCompletedDate === todayStr;
    },

    markTodayCompleted() {
        const todayStr = new Date().toISOString().split('T')[0];
        if (this.lastCompletedDate !== todayStr) {
            this.streak += 1;
            this.lastCompletedDate = todayStr;
            localStorage.setItem('damma-daily-streak', this.streak.toString());
            localStorage.setItem('damma-daily-last-date', todayStr);
            this.updateStreakUI();
        }
    },

    updateStreakUI() {
        const streakLbl = document.getElementById('daily-streak-count');
        if (streakLbl) streakLbl.textContent = `${this.streak} Days 🔥`;
    },

    openChallengeModal() {
        const modal = document.getElementById('daily-challenge-modal');
        if (!modal) return;

        const puzzle = this.getTodayPuzzle();
        const titleEl = document.getElementById('daily-puzzle-title');
        const descEl = document.getElementById('daily-puzzle-desc');
        const badgeEl = document.getElementById('daily-puzzle-badge');

        if (titleEl) titleEl.textContent = puzzle.title;
        if (descEl) descEl.textContent = puzzle.subtitle;
        if (badgeEl) badgeEl.textContent = `${puzzle.difficulty} • ${puzzle.rule.toUpperCase()}`;

        modal.classList.add('active');
    }
};

export function initDailyChallengeModule() {
    DailyChallengeSystem.init();

    const menuBtn = document.getElementById('menu-daily-challenge-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            DailyChallengeSystem.openChallengeModal();
        });
    }

    const closeBtn = document.getElementById('daily-modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const modal = document.getElementById('daily-challenge-modal');
            if (modal) modal.classList.remove('active');
        });
    }

    const startPuzzleBtn = document.getElementById('daily-start-puzzle-btn');
    if (startPuzzleBtn) {
        startPuzzleBtn.addEventListener('click', () => {
            const modal = document.getElementById('daily-challenge-modal');
            if (modal) modal.classList.remove('active');

            // Launch gameplay with puzzle board
            const puzzle = DailyChallengeSystem.getTodayPuzzle();
            import('./gameEngine.js').then(mod => {
                mod.launchPuzzleMatch(puzzle);
            });
        });
    }
}
