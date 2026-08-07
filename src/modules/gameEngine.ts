/**
 * 🎮 GAME ENGINE MODULE
 * Board state management, canvas rendering, turn manager, piece moves, forced captures.
 * Loaded dynamically on-demand ONLY after user launches a match or starts a game.
 */

import { AIEngine } from './aiEngine';

export interface GameConfig {
    gameMode: 'vs-cpu' | 'two-players' | 'online' | 'daily';
    difficulty?: 'easy' | 'medium' | 'hard';
    puzzleData?: any;
}

export function launchNewMatch(config: GameConfig) {
    // Hide main menu, show gameplay screen
    const mainMenu = document.getElementById('main-menu');
    const gameplayScreen = document.getElementById('gameplay-screen');

    if (mainMenu) mainMenu.classList.remove('active');
    if (gameplayScreen) gameplayScreen.classList.add('active');

    if (typeof (window as any).createGame === 'function') {
        (window as any).gameStateManager.gameMode = config.gameMode;
        if (config.difficulty) (window as any).gameStateManager.difficulty = config.difficulty;
        (window as any).activeGameInstance = (window as any).createGame();
    }
}

export function launchPuzzleMatch(puzzle: any) {
    launchNewMatch({ gameMode: 'daily', puzzleData: puzzle });
}
