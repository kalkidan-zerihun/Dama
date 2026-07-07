/* ==========================================================================
   🎮 GAME ENGINE AND MAIN STATS FOR DAMMA
   ========================================================================== */

// ========================
// 🔊 RETRO SYNTHETIC AUDIO
// ========================
const SoundSystem = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    play(type) {
        if (!gameStateManager.soundEnabled) return;
        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const now = this.ctx.currentTime;

        switch (type) {
            case 'click':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'move':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'capture':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'king':
                // Retro arcade arpeggio
                const notes = [440, 554, 659, 880];
                notes.forEach((freq, idx) => {
                    const noteOsc = this.ctx.createOscillator();
                    const noteGain = this.ctx.createGain();
                    noteOsc.connect(noteGain);
                    noteGain.connect(this.ctx.destination);
                    noteOsc.type = 'sawtooth';
                    noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    noteGain.gain.setValueAtTime(0.1, now + idx * 0.08);
                    noteGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.08 + 0.1);
                    noteOsc.start(now + idx * 0.08);
                    noteOsc.stop(now + idx * 0.08 + 0.1);
                });
                break;
            case 'win':
                // Happy fanfare
                const winNotes = [523.25, 659.25, 783.99, 1046.50];
                winNotes.forEach((freq, idx) => {
                    const wOsc = this.ctx.createOscillator();
                    const wGain = this.ctx.createGain();
                    wOsc.connect(wGain);
                    wGain.connect(this.ctx.destination);
                    wOsc.type = 'triangle';
                    wOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
                    wGain.gain.setValueAtTime(0.15, now + idx * 0.12);
                    wGain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
                    wOsc.start(now + idx * 0.12);
                    wOsc.stop(now + idx * 0.12 + 0.2);
                });
                break;
            case 'lose':
                // Sad slide
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.5);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'error':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(120, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
        }
    }
};

// ========================
// 🖥️ GAME STATE MANAGER
// ========================
const gameStateManager = {
    currentScreen: 'splash',
    soundEnabled: true,
    gameMode: 'vs-cpu', // 'vs-cpu' or 'pass-play'
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    forceCapture: true, // true = ON (Mandatory), false = OFF (Optional)
    activeGameInstance: null,

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle-btn');
        btn.textContent = `SOUND: ${this.soundEnabled ? 'ON' : 'OFF'}`;
        btn.style.borderColor = this.soundEnabled ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)';
        btn.style.color = this.soundEnabled ? 'var(--neon-blue)' : 'var(--text-secondary)';
    }
};

// ========================
// 🎬 SPLASH SCREEN TIMEOUT
// ========================
// ========================
// 🖥️ DOM INITIALIZATION AND GESTURES
// ========================
window.addEventListener('DOMContentLoaded', () => {
    // Helper to check and display Continue button if a saved state exists
    function updateContinueBtnVisibility() {
        const btn = document.getElementById('continue-game-btn');
        if (btn) {
            if (localStorage.getItem('damma_game_state')) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        }
    }

    updateContinueBtnVisibility();

    // Check if sound toggle was clicked
    document.getElementById('sound-toggle-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.toggleSound();
    });

    // Setup mode selector listeners
    document.getElementById('mode-selector').addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-btn')) {
            SoundSystem.play('click');
            document.querySelectorAll('#mode-selector .toggle-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            gameStateManager.gameMode = e.target.getAttribute('data-mode');
            
            // Show/Hide difficulty selectors based on vs CPU
            const diffSetting = document.getElementById('difficulty-setting');
            if (gameStateManager.gameMode === 'vs-cpu') {
                diffSetting.style.display = 'flex';
            } else {
                diffSetting.style.display = 'none';
            }
        }
    });

    // Setup difficulty selector listeners
    document.getElementById('difficulty-selector').addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-btn')) {
            SoundSystem.play('click');
            document.querySelectorAll('#difficulty-selector .toggle-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            gameStateManager.difficulty = e.target.getAttribute('data-level');
        }
    });

    // Setup force capture selector listeners
    document.getElementById('force-capture-selector').addEventListener('click', (e) => {
        if (e.target.classList.contains('toggle-btn')) {
            SoundSystem.play('click');
            document.querySelectorAll('#force-capture-selector .toggle-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            gameStateManager.forceCapture = e.target.getAttribute('data-value') === 'on';
        }
    });

    // Continue Game Button listener
    document.getElementById('continue-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('gameplay-screen');
        gameStateManager.activeGameInstance = createGame(true); // Load existing save
    });

    // Start Game Button listener
    document.getElementById('start-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('gameplay-screen');
        gameStateManager.activeGameInstance = createGame(false); // Fresh game
    });

    // Toggle mobile Move Log drawer
    const sidePanel = document.querySelector('.game-side-panel');
    const logBackdrop = document.getElementById('log-backdrop');

    function closeMobileLog() {
        if (sidePanel && logBackdrop) {
            sidePanel.classList.remove('open');
            logBackdrop.classList.remove('open');
        }
    }

    function openMobileLog() {
        if (sidePanel && logBackdrop) {
            SoundSystem.play('click');
            sidePanel.classList.add('open');
            logBackdrop.classList.add('open');
        }
    }

    const hudLogBtn = document.getElementById('hud-log-btn');
    if (hudLogBtn) {
        hudLogBtn.addEventListener('click', openMobileLog);
    }

    const closeLogBtn = document.getElementById('close-log-btn');
    if (closeLogBtn) {
        closeLogBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            closeMobileLog();
        });
    }

    if (logBackdrop) {
        logBackdrop.addEventListener('click', closeMobileLog);
    }

    // Back from gameplay HUD
    document.getElementById('hud-back-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        closeMobileLog();
        if (gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.terminate();
        }
        updateContinueBtnVisibility();
        gameStateManager.showScreen('main-menu');
    });

    // Undo gameplay HUD button listener
    document.getElementById('hud-undo-btn').addEventListener('click', () => {
        if (gameStateManager.activeGameInstance && gameStateManager.activeGameInstance.undo) {
            gameStateManager.activeGameInstance.undo();
        }
    });

    // Reset gameplay HUD
    document.getElementById('hud-reset-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        closeMobileLog();
        if (gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.restart();
        }
    });

    // Restart from Game Over Screen
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('gameplay-screen');
        gameStateManager.activeGameInstance = createGame(false);
    });

    // Return to Menu from Game Over Screen
    document.getElementById('menu-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        updateContinueBtnVisibility();
        gameStateManager.showScreen('main-menu');
    });

    // Transition Splash Screen to Main Menu after 2.5 seconds
    setTimeout(() => {
        updateContinueBtnVisibility();
        gameStateManager.showScreen('main-menu');
    }, 2500);
});


// ==========================================================================
// 🧩 ENGINE RULE (DO NOT BREAK)
// ==========================================================================
function createGame(isLoaded) {
    // ONLY GAME LOGIC HERE

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Display Labels Update
    const p2Label = document.getElementById('p2-label');
    if (gameStateManager.gameMode === 'vs-cpu') {
        p2Label.textContent = `PINK (CPU - ${gameStateManager.difficulty.toUpperCase()})`;
    } else {
        p2Label.textContent = 'PINK (PLAYER 2)';
    }

    // GAME STATE VARIABLES
    let board = [];
    let turn = 1; // 1 = Blue (Player 1), -1 = Pink (Player 2 / CPU)
    let selectedPiece = null; // {r: row, c: col}
    let validMoves = []; // List of {r, c, isJump, capturedPiece: {r, c}}
    let mandatoryCaptures = []; // List of {fromR, fromC, toR, toC, capturedPiece}
    let multiJumpPiece = null; // Locked piece in the middle of a double/triple jump {r, c}
    let p1Count = 12;
    let p2Count = 12;
    let totalMoves = 0;
    let startTime = Date.now();
    let isCpuThinking = false;
    let cpuCapturedThisTurn = 0;
    let animationId = null;
    let isTerminated = false;

    let moveHistory = [];
    let stateHistory = [];

    function toAlgebraic(r, c) {
        const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const rowStr = (8 - r).toString();
        return cols[c] + rowStr;
    }

    function updateMoveHistoryUI() {
        const listEl = document.getElementById('move-history-list');
        if (!listEl) return;

        if (moveHistory.length === 0) {
            listEl.innerHTML = '<div class="history-placeholder">No moves made yet</div>';
            return;
        }

        listEl.innerHTML = moveHistory.map((m, idx) => `
            <div class="history-item ${m.player === 'BLUE' ? 'player1' : 'player2'}">
                <span class="history-index">${idx + 1}.</span>
                <span class="history-move">${m.player}: ${m.text}</span>
            </div>
        `).join('');

        listEl.scrollTop = listEl.scrollHeight;
    }

    function saveGameState() {
        const state = {
            board: board,
            turn: turn,
            p1Count: p1Count,
            p2Count: p2Count,
            totalMoves: totalMoves,
            startTime: startTime,
            multiJumpPiece: multiJumpPiece,
            gameMode: gameStateManager.gameMode,
            difficulty: gameStateManager.difficulty,
            forceCapture: gameStateManager.forceCapture,
            moveHistory: moveHistory,
            stateHistory: stateHistory
        };
        localStorage.setItem('damma_game_state', JSON.stringify(state));
    }

    function loadSavedState() {
        try {
            const dataStr = localStorage.getItem('damma_game_state');
            if (dataStr) {
                const data = JSON.parse(dataStr);
                board = data.board;
                turn = data.turn;
                p1Count = data.p1Count;
                p2Count = data.p2Count;
                totalMoves = data.totalMoves;
                startTime = data.startTime || Date.now();
                multiJumpPiece = data.multiJumpPiece;
                moveHistory = data.moveHistory || [];
                stateHistory = data.stateHistory || [];
                
                if (data.gameMode) {
                    gameStateManager.gameMode = data.gameMode;
                    const modeBtns = document.querySelectorAll('#mode-selector .toggle-btn');
                    modeBtns.forEach(btn => {
                        if (btn.getAttribute('data-mode') === data.gameMode) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                    
                    const diffSetting = document.getElementById('difficulty-setting');
                    if (data.gameMode === 'vs-cpu') {
                        diffSetting.style.display = 'flex';
                    } else {
                        diffSetting.style.display = 'none';
                    }
                }
                if (data.difficulty) {
                    gameStateManager.difficulty = data.difficulty;
                    const diffBtns = document.querySelectorAll('#difficulty-selector .toggle-btn');
                    diffBtns.forEach(btn => {
                        if (btn.getAttribute('data-level') === data.difficulty) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
                if (data.forceCapture !== undefined) {
                    gameStateManager.forceCapture = data.forceCapture;
                    const forceBtns = document.querySelectorAll('#force-capture-selector .toggle-btn');
                    forceBtns.forEach(btn => {
                        const val = btn.getAttribute('data-value') === 'on';
                        if (val === data.forceCapture) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
                
                if (gameStateManager.gameMode === 'vs-cpu') {
                    p2Label.textContent = `PINK (CPU - ${gameStateManager.difficulty.toUpperCase()})`;
                } else {
                    p2Label.textContent = 'PINK (PLAYER 2)';
                }
                
                updateHUD();
                updateMoveHistoryUI();
                scanMandatoryCaptures();
                return true;
            }
        } catch (e) {
            console.error("Failed to load saved state", e);
        }
        return false;
    }

    // Board Dimensions
    let width = 0;
    let height = 0;
    let boardSize = 0;
    let boardX = 0;
    let boardY = 0;
    let cellSize = 0;

    // Resizing Rule
    function resize() {
        if (isTerminated) return;
        const container = canvas.parentElement;
        width = container.clientWidth;
        height = container.clientHeight;

        canvas.width = width;
        canvas.height = height;

        // Make board fit perfectly within screen
        boardSize = Math.min(width, height) * 0.94;
        if (boardSize > 480) boardSize = 480; // Caps size for tablets/larger screens to keep clean
        
        boardX = (width - boardSize) / 2;
        boardY = (height - boardSize) / 2;
        cellSize = boardSize / 8;
    }

    window.addEventListener('resize', resize);
    resize();

    // ==========================================
    // ♟️ BOARD INITIALIZATION (8x8 CHECKERBOARD)
    // ==========================================
    function initBoard() {
        board = Array(8).fill(null).map(() => Array(8).fill(0));
        
        // 12 pieces for Pink (Player 2) on the first 3 rows
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = -1; // -1 = Pink Regular
                }
            }
        }

        // 12 pieces for Blue (Player 1) on the bottom 3 rows
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    board[r][c] = 1; // 1 = Blue Regular
                }
            }
        }

        turn = 1;
        selectedPiece = null;
        validMoves = [];
        multiJumpPiece = null;
        p1Count = 12;
        p2Count = 12;
        totalMoves = 0;
        startTime = Date.now();
        isCpuThinking = false;
        cpuCapturedThisTurn = 0;
        
        moveHistory = [];
        stateHistory = [];
        updateMoveHistoryUI();
        localStorage.removeItem('damma_game_state');
        const contBtn = document.getElementById('continue-game-btn');
        if (contBtn) contBtn.style.display = 'none';
        
        updateHUD();
        scanMandatoryCaptures();
    }

    // Update stats on HUD
    function updateHUD() {
        document.getElementById('p1-score').textContent = p1Count;
        document.getElementById('p2-score').textContent = p2Count;
        
        const turnText = document.getElementById('turn-indicator-text');
        if (turn === 1) {
            turnText.textContent = "BLUE'S TURN";
            turnText.className = "turn-text neon-text-blue";
            if (cpuCapturedThisTurn > 0) {
                document.getElementById('instruction-text').textContent = `CPU captured ${cpuCapturedThisTurn} piece${cpuCapturedThisTurn > 1 ? 's' : ''}! Select a Blue piece to move.`;
            } else {
                document.getElementById('instruction-text').textContent = multiJumpPiece 
                    ? "Multi-jump available! Tap the destination to capture." 
                    : (mandatoryCaptures.length > 0 && gameStateManager.forceCapture ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : "Select a Blue piece to move.");
            }
        } else {
            if (gameStateManager.gameMode === 'vs-cpu') {
                turnText.textContent = "CPU IS THINKING...";
                turnText.className = "turn-text neon-text-pink";
                if (cpuCapturedThisTurn > 0) {
                    document.getElementById('instruction-text').textContent = `CPU captured ${cpuCapturedThisTurn} piece${cpuCapturedThisTurn > 1 ? 's' : ''}... continuing jump!`;
                } else {
                    document.getElementById('instruction-text').textContent = "CPU is planning its move...";
                }
            } else {
                turnText.textContent = "PINK'S TURN";
                turnText.className = "turn-text neon-text-pink";
                document.getElementById('instruction-text').textContent = multiJumpPiece 
                    ? "Multi-jump available! Tap the destination to capture." 
                    : (mandatoryCaptures.length > 0 && gameStateManager.forceCapture ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : "Select a Pink piece to move.");
            }
        }
    }

    // ==========================================
    // ⚔️ MOVE GENERATION AND JUMP MANDATE RULES
    // ==========================================

    function scanMandatoryCaptures() {
        mandatoryCaptures = [];
        if (multiJumpPiece) {
            // Locked to jumping piece during multi-jump
            const jumps = getPieceJumps(multiJumpPiece.r, multiJumpPiece.c);
            mandatoryCaptures = jumps.map(j => ({
                fromR: multiJumpPiece.r,
                fromC: multiJumpPiece.c,
                toR: j.r,
                toC: j.c,
                capturedPiece: j.capturedPiece
            }));
            return;
        }

        // Scan all current pieces of active player for jumps
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(board[r][c]) === turn) {
                    const jumps = getPieceJumps(r, c);
                    jumps.forEach(j => {
                        mandatoryCaptures.push({
                            fromR: r,
                            fromC: c,
                            toR: j.r,
                            toC: j.c,
                            capturedPiece: j.capturedPiece
                        });
                    });
                }
            }
        }
    }

    // Get available diagonal jumps for a single piece
    function getPieceJumps(r, c) {
        const pieceType = board[r][c];
        const jumps = [];
        if (pieceType === 0) return jumps;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);

        // Directions to look
        let dirs = [];
        if (isKing) {
            // All directions
            dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        } else {
            // Regular pieces can only jump diagonally forward (or backward depending on definition, 
            // the requirements say regular pieces move 1 step forward, kings can capture forward/backward).
            // Let's implement traditional US Checkers where regular pieces jump forward only, kings both.
            dirs = playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        }

        for (const [dr, dc] of dirs) {
            const midR = r + dr;
            const midC = c + dc;
            const targetR = r + dr * 2;
            const targetC = c + dc * 2;

            // Check boundaries
            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetCell = board[targetR][targetC];
                const midCell = board[midR][midC];

                // Middle must have opponent, target must be empty
                if (targetCell === 0 && midCell !== 0 && Math.sign(midCell) === -playerSign) {
                    jumps.push({
                        r: targetR,
                        c: targetC,
                        capturedPiece: { r: midR, c: midC }
                    });
                }
            }
        }

        return jumps;
    }

    // Get standard diagonal moves (distance = 1)
    function getPieceNormalMoves(r, c) {
        const pieceType = board[r][c];
        const moves = [];
        if (pieceType === 0) return moves;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);

        let dirs = [];
        if (isKing) {
            dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        } else {
            dirs = playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
        }

        for (const [dr, dc] of dirs) {
            const targetR = r + dr;
            const targetC = c + dc;

            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                if (board[targetR][targetC] === 0) {
                    moves.push({ r: targetR, c: targetC, isJump: false });
                }
            }
        }

        return moves;
    }

    // Get valid moves for selected piece, considering mandatory captures
    function computeValidMoves(r, c) {
        validMoves = [];
        if (Math.sign(board[r][c]) !== turn) return;

        // If multi-jumping, must use the locked piece and can only make jump moves
        if (multiJumpPiece) {
            if (multiJumpPiece.r !== r || multiJumpPiece.c !== c) {
                return;
            }
            const jumps = getPieceJumps(r, c);
            jumps.forEach(j => {
                validMoves.push({
                    r: j.r,
                    c: j.c,
                    isJump: true,
                    capturedPiece: j.capturedPiece
                });
            });
            return;
        }

        if (mandatoryCaptures.length > 0 && gameStateManager.forceCapture) {
            // Find if this piece is part of the mandatory jumps list
            const piecesJumps = mandatoryCaptures.filter(m => m.fromR === r && m.fromC === c);
            piecesJumps.forEach(m => {
                validMoves.push({
                    r: m.toR,
                    c: m.toC,
                    isJump: true,
                    capturedPiece: m.capturedPiece
                });
            });
        } else {
            // If forceCapture is OFF, show BOTH captures (if this piece has any) and normal moves!
            const jumps = getPieceJumps(r, c);
            jumps.forEach(j => {
                validMoves.push({
                    r: j.r,
                    c: j.c,
                    isJump: true,
                    capturedPiece: j.capturedPiece
                });
            });

            // Normal move diagonal steps
            const normals = getPieceNormalMoves(r, c);
            normals.forEach(m => {
                validMoves.push(m);
            });
        }
    }

    // ==========================================
    // 🎲 AI ALGORITHM (MINIMAX ALPHA-BETA)
    // ==========================================
    function cpuMakeDecision() {
        if (turn === 1 || isTerminated) return;
        if (isCpuThinking && !multiJumpPiece) return;
        
        isCpuThinking = true;
        if (!multiJumpPiece) {
            cpuCapturedThisTurn = 0;
        }
        updateHUD();

        // 600ms-1200ms thinking delay to feel realistic and organic
        const thinkingTime = gameStateManager.difficulty === 'easy' ? 500 : (gameStateManager.difficulty === 'medium' ? 800 : 1200);

        setTimeout(() => {
            if (isTerminated) return;
            const aiMove = getBestCpuMove();
            if (aiMove) {
                executeMove(aiMove.fromR, aiMove.fromC, aiMove.toR, aiMove.toC, aiMove.isJump, aiMove.capturedPiece);
            } else {
                // If AI has no moves, player wins
                endGame(1, "No valid moves left for AI!");
            }
            
            // Only end CPU thinking state if turn switched back to Player or there are no more multi-jumps
            if (turn === 1 || !multiJumpPiece) {
                isCpuThinking = false;
                updateHUD();
            }
        }, thinkingTime);
    }

    // Board-independent simulation helpers for AI lookahead
    function getPieceJumpsForBoard(r, c, bState) {
        const pieceType = bState[r][c];
        const jumps = [];
        if (pieceType === 0) return jumps;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);

        let dirs = isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : (playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

        for (const [dr, dc] of dirs) {
            const midR = r + dr;
            const midC = c + dc;
            const targetR = r + dr * 2;
            const targetC = c + dc * 2;

            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                const targetCell = bState[targetR][targetC];
                const midCell = bState[midR][midC];

                if (targetCell === 0 && midCell !== 0 && Math.sign(midCell) === -playerSign) {
                    jumps.push({
                        r: targetR,
                        c: targetC,
                        capturedPiece: { r: midR, c: midC }
                    });
                }
            }
        }
        return jumps;
    }

    function getCaptureChainLength(r, c, bState) {
        const jumps = getPieceJumpsForBoard(r, c, bState);
        if (jumps.length === 0) return 0;
        let maxChain = 0;
        for (const j of jumps) {
            const nextBoard = bState.map(row => [...row]);
            const piece = nextBoard[r][c];
            nextBoard[j.r][j.c] = piece;
            nextBoard[r][c] = 0;
            nextBoard[j.capturedPiece.r][j.capturedPiece.c] = 0;
            
            let nextPiece = piece;
            if (piece === -1 && j.r === 7) nextPiece = -2;
            if (piece === 1 && j.r === 0) nextPiece = 2;
            nextBoard[j.r][j.c] = nextPiece;

            if (Math.abs(piece) === 1 && Math.abs(nextPiece) === 2) {
                maxChain = Math.max(maxChain, 1);
            } else {
                maxChain = Math.max(maxChain, 1 + getCaptureChainLength(j.r, j.c, nextBoard));
            }
        }
        return maxChain;
    }

    // Minimax search evaluator for best CPU move
    function getBestCpuMove() {
        scanMandatoryCaptures();
        
        let possibleMoves = [];
        if (multiJumpPiece) {
            mandatoryCaptures.forEach(m => {
                possibleMoves.push({
                    fromR: m.fromR,
                    fromC: m.fromC,
                    toR: m.toR,
                    toC: m.toC,
                    isJump: true,
                    capturedPiece: m.capturedPiece
                });
            });
        } else if (mandatoryCaptures.length > 0 && gameStateManager.forceCapture) {
            mandatoryCaptures.forEach(m => {
                possibleMoves.push({
                    fromR: m.fromR,
                    fromC: m.fromC,
                    toR: m.toR,
                    toC: m.toC,
                    isJump: true,
                    capturedPiece: m.capturedPiece
                });
            });
        } else {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.sign(board[r][c]) === -1) {
                        const jumps = getPieceJumps(r, c);
                        jumps.forEach(j => {
                            possibleMoves.push({
                                fromR: r,
                                fromC: c,
                                toR: j.r,
                                toC: j.c,
                                isJump: true,
                                capturedPiece: j.capturedPiece
                            });
                        });
                        const normals = getPieceNormalMoves(r, c);
                        normals.forEach(m => {
                            possibleMoves.push({
                                fromR: r,
                                fromC: c,
                                toR: m.r,
                                toC: m.c,
                                isJump: false,
                                capturedPiece: null
                            });
                        });
                    }
                }
            }
        }

        if (possibleMoves.length === 0) return null;

        // --- 1. EASY DIFFICULTY: Fully Random valid moves (prioritizing captures) ---
        if (gameStateManager.difficulty === 'easy') {
            const jumps = possibleMoves.filter(m => m.isJump);
            if (jumps.length > 0) {
                return jumps[Math.floor(Math.random() * jumps.length)];
            }
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }

        // --- 2. MEDIUM DIFFICULTY: Prioritizes Captures + Avoids Blunders ---
        if (gameStateManager.difficulty === 'medium') {
            const jumps = possibleMoves.filter(m => m.isJump);
            if (jumps.length > 0) {
                return jumps[Math.floor(Math.random() * jumps.length)];
            }
            
            // For normal moves, filter out those that immediately place CPU in capture range
            const safeMoves = possibleMoves.filter(m => {
                // Simulate CPU move
                const tempBoard = board.map(row => [...row]);
                tempBoard[m.toR][m.toC] = tempBoard[m.fromR][m.fromC];
                tempBoard[m.fromR][m.fromC] = 0;
                if (tempBoard[m.toR][m.toC] === -1 && m.toR === 7) tempBoard[m.toR][m.toC] = -2;

                // Check if player (Blue) has any immediate mandatory captures on the next turn
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (Math.sign(tempBoard[r][c]) === 1) {
                            const playerJumps = getPieceJumpsForBoard(r, c, tempBoard);
                            if (playerJumps.length > 0) {
                                // If any jump captures the piece we just moved, this move is unsafe!
                                const isCapturingMovedPiece = playerJumps.some(j => j.capturedPiece.r === m.toR && j.capturedPiece.c === m.toC);
                                if (isCapturingMovedPiece) return false;
                            }
                        }
                    }
                }
                return true;
            });

            if (safeMoves.length > 0) {
                return safeMoves[Math.floor(Math.random() * safeMoves.length)];
            }
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }

        // --- 3. HARD DIFFICULTY: Max Capture Chain + Advanced Minimax ---
        const jumps = possibleMoves.filter(m => m.isJump);
        if (jumps.length > 0) {
            // Find capture moves that yield the longest jump chain
            let maxChainVal = -1;
            let bestJumps = [];
            jumps.forEach(m => {
                // Simulate immediate jump
                const tempBoard = board.map(row => [...row]);
                const piece = tempBoard[m.fromR][m.fromC];
                tempBoard[m.toR][m.toC] = piece;
                tempBoard[m.fromR][m.fromC] = 0;
                tempBoard[m.capturedPiece.r][m.capturedPiece.c] = 0;
                
                let nextPiece = piece;
                if (piece === -1 && m.toR === 7) nextPiece = -2;
                tempBoard[m.toR][m.toC] = nextPiece;

                const chainLength = 1 + getCaptureChainLength(m.toR, m.toC, tempBoard);
                if (chainLength > maxChainVal) {
                    maxChainVal = chainLength;
                    bestJumps = [m];
                } else if (chainLength === maxChainVal) {
                    bestJumps.push(m);
                }
            });
            return bestJumps[Math.floor(Math.random() * bestJumps.length)];
        }

        // No captures available: Run full minimax lookahead search (Depth 4) with advanced evaluation
        const depth = 4;
        let bestScore = -Infinity;
        let bestMove = possibleMoves[0];

        for (const m of possibleMoves) {
            const tempBoard = board.map(row => [...row]);
            tempBoard[m.toR][m.toC] = tempBoard[m.fromR][m.fromC];
            tempBoard[m.fromR][m.fromC] = 0;

            if (tempBoard[m.toR][m.toC] === -1 && m.toR === 7) {
                tempBoard[m.toR][m.toC] = -2;
            }

            const score = minimax(tempBoard, depth - 1, -Infinity, Infinity, false, 1);
            if (score > bestScore) {
                bestScore = score;
                bestMove = m;
            }
        }

        return bestMove;
    }

    function minimax(currBoard, depth, alpha, beta, isMaximizing, currTurn) {
        if (depth === 0) {
            return evaluateBoard(currBoard);
        }

        let simulatedCaptures = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(currBoard[r][c]) === currTurn) {
                    const isKing = Math.abs(currBoard[r][c]) === 2;
                    const dirs = isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (currTurn === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
                    for (const [dr, dc] of dirs) {
                        const midR = r + dr;
                        const midC = c + dc;
                        const targetR = r + dr * 2;
                        const targetC = c + dc * 2;
                        if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                            if (currBoard[targetR][targetC] === 0 && currBoard[midR][midC] !== 0 && Math.sign(currBoard[midR][midC]) === -currTurn) {
                                simulatedCaptures.push({ fromR: r, fromC: c, toR: targetR, toC: targetC, isJump: true, capturedPiece: {r: midR, c: midC} });
                            }
                        }
                    }
                }
            }
        }

        let moves = [];
        if (simulatedCaptures.length > 0 && gameStateManager.forceCapture) {
            moves = simulatedCaptures;
        } else {
            if (simulatedCaptures.length > 0) {
                moves = [...simulatedCaptures];
            }
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.sign(currBoard[r][c]) === currTurn) {
                        const isKing = Math.abs(currBoard[r][c]) === 2;
                        const dirs = isKing ? [[-1,-1],[-1,1],[1,-1],[1,1]] : (currTurn === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
                        for (const [dr, dc] of dirs) {
                            const targetR = r + dr;
                            const targetC = c + dc;
                            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                                if (currBoard[targetR][targetC] === 0) {
                                    moves.push({ fromR: r, fromC: c, toR: targetR, toC: targetC, isJump: false });
                                }
                            }
                        }
                    }
                }
            }
        }

        if (moves.length === 0) {
            return currTurn === -1 ? -1000 : 1000;
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                const tempBoard = currBoard.map(row => [...row]);
                tempBoard[move.toR][move.toC] = tempBoard[move.fromR][move.fromC];
                tempBoard[move.fromR][move.fromC] = 0;
                if (move.isJump) {
                    tempBoard[move.capturedPiece.r][move.capturedPiece.c] = 0;
                }
                if (tempBoard[move.toR][move.toC] === -1 && move.toR === 7) tempBoard[move.toR][move.toC] = -2;

                const evaluation = minimax(tempBoard, depth - 1, alpha, beta, false, 1);
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                const tempBoard = currBoard.map(row => [...row]);
                tempBoard[move.toR][move.toC] = tempBoard[move.fromR][move.fromC];
                tempBoard[move.fromR][move.fromC] = 0;
                if (move.isJump) {
                    tempBoard[move.capturedPiece.r][move.capturedPiece.c] = 0;
                }
                if (tempBoard[move.toR][move.toC] === 1 && move.toR === 0) tempBoard[move.toR][move.toC] = 2;

                const evaluation = minimax(tempBoard, depth - 1, alpha, beta, true, -1);
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    function evaluateBoard(currBoard) {
        let score = 0;
        let cpuMoves = 0;
        let playerMoves = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = currBoard[r][c];
                if (val === 0) continue;

                // 1. Piece Values
                if (val === -1) { // CPU Regular
                    score += 100;
                    score += r * 8; // Advancing bonus (CPU moves top down, r goes 0 to 7)
                    
                    // Center Control
                    if ((r === 3 || r === 4) && (c >= 2 && c <= 5)) {
                        score += 15;
                    }
                    // Edge Safety (cannot be jumped from the side)
                    if (c === 0 || c === 7) {
                        score += 6;
                    }
                } else if (val === -2) { // CPU King
                    score += 175;
                    // Edge safety for King
                    if (c === 0 || c === 7 || r === 0 || r === 7) {
                        score += 8;
                    }
                } else if (val === 1) { // Player Regular
                    score -= 100;
                    score -= (7 - r) * 8; // Advancing bonus (Player moves bottom up)
                    
                    // Center Control
                    if ((r === 3 || r === 4) && (c >= 2 && c <= 5)) {
                        score -= 15;
                    }
                    // Edge Safety
                    if (c === 0 || c === 7) {
                        score -= 6;
                    }
                } else if (val === 2) { // Player King
                    score -= 175;
                    // Edge safety for King
                    if (c === 0 || c === 7 || r === 0 || r === 7) {
                        score -= 8;
                    }
                }
            }
        }

        return score;
    }


    function pushStateToHistory() {
        stateHistory.push({
            board: board.map(row => [...row]),
            turn: turn,
            p1Count: p1Count,
            p2Count: p2Count,
            totalMoves: totalMoves,
            multiJumpPiece: multiJumpPiece ? { ...multiJumpPiece } : null,
            moveHistory: [...moveHistory]
        });
        if (stateHistory.length > 50) {
            stateHistory.shift();
        }
    }

    // ==========================================
    // ⚔️ MOVE EXECUTION AND TURN SWITCHING
    // ==========================================
    function executeMove(fromR, fromC, toR, toC, isJump, capturedPiece) {
        if (multiJumpPiece === null) {
            pushStateToHistory();
        }

        const pieceType = board[fromR][fromC];
        board[toR][toC] = pieceType;
        board[fromR][fromC] = 0;

        let promoted = false;

        if (isJump && capturedPiece) {
            const capturedType = board[capturedPiece.r][capturedPiece.c];
            board[capturedPiece.r][capturedPiece.c] = 0;
            
            if (Math.sign(capturedType) === 1) p1Count--;
            else p2Count--;

            if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
                cpuCapturedThisTurn++;
            }

            SoundSystem.play('capture');
        } else {
            SoundSystem.play('move');
        }

        if (pieceType === 1 && toR === 0) {
            board[toR][toC] = 2;
            promoted = true;
            SoundSystem.play('king');
        } else if (pieceType === -1 && toR === 7) {
            board[toR][toC] = -2;
            promoted = true;
            SoundSystem.play('king');
        }

        selectedPiece = null;
        validMoves = [];
        totalMoves++;

        // Add to move log list
        const moveText = `${toAlgebraic(fromR, fromC)}${isJump ? '×' : '→'}${toAlgebraic(toR, toC)}`;
        moveHistory.push({
            player: turn === 1 ? 'BLUE' : 'PINK',
            text: moveText,
            turnNum: Math.floor(totalMoves / 2) + 1
        });
        updateMoveHistoryUI();

        if (isJump && !promoted) {
            const extraJumps = getPieceJumps(toR, toC);
            if (extraJumps.length > 0) {
                multiJumpPiece = { r: toR, c: toC };
                scanMandatoryCaptures();
                updateHUD();
                
                saveGameState(); // Auto save state mid-turn for multi-jumps!

                // CRITICAL FIX: If CPU has a multi-jump, trigger the next step immediately!
                if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
                    cpuMakeDecision();
                }
                return;
            }
        }

        multiJumpPiece = null;
        turn = -turn;
        
        scanMandatoryCaptures();
        updateHUD();

        saveGameState(); // Auto save state at the end of the turn!

        if (checkGameOver()) return;

        if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
            cpuMakeDecision();
        }
    }

    function checkGameOver() {
        if (p1Count === 0) {
            endGame(-1, "Pink captures all pieces!");
            return true;
        }
        if (p2Count === 0) {
            endGame(1, "Blue captures all pieces!");
            return true;
        }

        let hasMoves = false;
        if (mandatoryCaptures.length > 0) {
            hasMoves = true;
        } else {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.sign(board[r][c]) === turn) {
                        const moves = getPieceNormalMoves(r, c);
                        if (moves.length > 0) {
                            hasMoves = true;
                            break;
                        }
                    }
                }
                if (hasMoves) break;
            }
        }

        if (!hasMoves) {
            const winner = -turn;
            endGame(winner, "No moves left for opponent!");
            return true;
        }

        return false;
    }

    function endGame(winner, reason) {
        localStorage.removeItem('damma_game_state');
        const contBtn = document.getElementById('continue-game-btn');
        if (contBtn) contBtn.style.display = 'none';

        if (winner === 1) {
            SoundSystem.play('win');
            document.getElementById('result-message').textContent = "BLUE WINS!";
            document.getElementById('result-message').className = "neon-text-blue";
        } else {
            SoundSystem.play('lose');
            const oppName = gameStateManager.gameMode === 'vs-cpu' ? 'CPU' : 'PINK';
            document.getElementById('result-message').textContent = `${oppName} WINS!`;
            document.getElementById('result-message').className = "neon-text-pink";
        }

        const diffMs = Date.now() - startTime;
        const mins = Math.floor(diffMs / 60000).toString().padStart(2, '0');
        const secs = Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0');
        
        document.getElementById('stat-time').textContent = `${mins}:${secs}`;
        document.getElementById('stat-moves').textContent = totalMoves;

        gameStateManager.showScreen('game-over-screen');
        terminate();
    }


    // ==========================================
    // 🎨 RENDER PIPELINE (CANVAS DRAWINGS)
    // ==========================================
    let pulseCycle = 0;

    function render() {
        if (isTerminated) return;

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        pulseCycle = (pulseCycle + 0.05) % (Math.PI * 2);
        const pulseRatio = (Math.sin(pulseCycle) + 1) / 2;

        ctx.save();
        ctx.shadowColor = turn === 1 ? 'rgba(0, 243, 255, 0.5)' : 'rgba(255, 0, 127, 0.5)';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.strokeStyle = turn === 1 ? 'var(--neon-blue)' : 'var(--neon-pink)';
        ctx.strokeRect(boardX - 4, boardY - 4, boardSize + 8, boardSize + 8);
        ctx.restore();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = boardX + c * cellSize;
                const y = boardY + r * cellSize;
                const isDarkCell = (r + c) % 2 === 1;

                if (isDarkCell) {
                    ctx.fillStyle = '#12141a';
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, cellSize, cellSize);
                } else {
                    ctx.fillStyle = '#1e222b';
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
            }
        }

        if (turn === 1 || gameStateManager.gameMode !== 'vs-cpu') {
            if (mandatoryCaptures.length > 0) {
                ctx.save();
                ctx.lineWidth = 2 + pulseRatio * 2;
                ctx.strokeStyle = `rgba(255, 0, 127, ${0.5 + pulseRatio * 0.5})`;
                ctx.shadowColor = 'rgba(255, 0, 127, 0.8)';
                ctx.shadowBlur = 10;
                
                const highlighted = new Set();
                mandatoryCaptures.forEach(m => {
                    const key = `${m.fromR},${m.fromC}`;
                    if (!highlighted.has(key)) {
                        highlighted.add(key);
                        const cx = boardX + m.fromC * cellSize + cellSize / 2;
                        const cy = boardY + m.fromR * cellSize + cellSize / 2;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }
        }

        if (selectedPiece) {
            const scx = boardX + selectedPiece.c * cellSize + cellSize / 2;
            const scy = boardY + selectedPiece.r * cellSize + cellSize / 2;
            ctx.save();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'var(--neon-blue)';
            ctx.shadowColor = 'rgba(0, 243, 255, 0.8)';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(scx, scy, cellSize * 0.44, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        validMoves.forEach(m => {
            const tcx = boardX + m.c * cellSize + cellSize / 2;
            const tcy = boardY + m.r * cellSize + cellSize / 2;
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = m.isJump ? 'var(--neon-pink)' : 'var(--neon-green)';
            ctx.fillStyle = m.isJump ? 'rgba(255, 0, 127, 0.2)' : 'rgba(57, 255, 20, 0.15)';
            ctx.shadowColor = m.isJump ? 'var(--neon-pink)' : 'var(--neon-green)';
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            ctx.arc(tcx, tcy, cellSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = board[r][c];
                if (val !== 0) {
                    const cx = boardX + c * cellSize + cellSize / 2;
                    const cy = boardY + r * cellSize + cellSize / 2;
                    const radius = cellSize * 0.35;
                    const isPlayer1 = val > 0;
                    const isKing = Math.abs(val) === 2;

                    ctx.save();
                    
                    const grad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.1, cx, cy, radius);
                    
                    if (isPlayer1) {
                        grad.addColorStop(0, '#ffffff');
                        grad.addColorStop(1, '#94a3b8');
                        
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
                        ctx.shadowBlur = selectedPiece && selectedPiece.r === r && selectedPiece.c === c ? 18 : 8;
                    } else {
                        grad.addColorStop(0, '#475569');
                        grad.addColorStop(1, '#0f172a');
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 8;
                    }

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    
                    ctx.strokeStyle = isPlayer1 ? '#cbd5e1' : '#334155';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.stroke();

                    if (isKing) {
                        ctx.shadowColor = 'var(--neon-yellow)';
                        ctx.shadowBlur = 10;
                        ctx.fillStyle = 'var(--neon-yellow)';
                        
                        ctx.beginPath();
                        const cw = radius * 0.6;
                        const ch = radius * 0.5;
                        const bx = cx - cw / 2;
                        const by = cy - ch / 3;

                        ctx.moveTo(bx, by + ch);
                        ctx.lineTo(bx, by);
                        ctx.lineTo(bx + cw * 0.25, by + ch * 0.5);
                        ctx.lineTo(bx + cw * 0.5, by - ch * 0.1);
                        ctx.lineTo(bx + cw * 0.75, by + ch * 0.5);
                        ctx.lineTo(bx + cw, by);
                        ctx.lineTo(bx + cw, by + ch);
                        ctx.closePath();
                        ctx.fill();
                    }

                    ctx.restore();
                }
            }
        }

        animationId = requestAnimationFrame(render);
    }

    // ==========================================
    // 🔘 TOUCH CONTROLS AND INPUT HANDLERS
    // ==========================================
    function handleInteraction(clientX, clientY) {
        if (isCpuThinking || isTerminated) return;

        const rect = canvas.getBoundingClientRect();
        const touchX = clientX - rect.left;
        const touchY = clientY - rect.top;

        const c = Math.floor((touchX - boardX) / cellSize);
        const r = Math.floor((touchY - boardY) / cellSize);

        if (r < 0 || r >= 8 || c < 0 || c >= 8) return;

        const chosenMove = validMoves.find(m => m.r === r && m.c === c);
        if (chosenMove && selectedPiece) {
            executeMove(selectedPiece.r, selectedPiece.c, r, c, chosenMove.isJump, chosenMove.capturedPiece);
            return;
        }

        const cellValue = board[r][c];
        if (cellValue !== 0 && Math.sign(cellValue) === turn) {
            if (multiJumpPiece) {
                if (multiJumpPiece.r !== r || multiJumpPiece.c !== c) {
                    SoundSystem.play('error');
                    return;
                }
            }

            if (mandatoryCaptures.length > 0 && gameStateManager.forceCapture) {
                const canCapture = mandatoryCaptures.some(m => m.fromR === r && m.fromC === c);
                if (!canCapture) {
                    SoundSystem.play('error');
                    document.getElementById('instruction-text').textContent = "⚠️ CAPTURE MANDATORY! Tap a piece glowing in magenta.";
                    return;
                }
            }

            SoundSystem.play('click');
            selectedPiece = { r, c };
            cpuCapturedThisTurn = 0;
            computeValidMoves(r, c);
        } else {
            if (selectedPiece && !multiJumpPiece) {
                selectedPiece = null;
                validMoves = [];
            }
        }
    }

    function onMouseDown(e) {
        handleInteraction(e.clientX, e.clientY);
    }

    function onTouchStart(e) {
        if (e.touches.length > 0) {
            e.preventDefault();
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    function undoLastMove() {
        if (stateHistory.length === 0 || isCpuThinking) {
            SoundSystem.play('error');
            return;
        }

        let restoredState = null;
        if (gameStateManager.gameMode === 'vs-cpu') {
            // Find the last state where turn === 1 (Player's turn)
            while (stateHistory.length > 0) {
                const popped = stateHistory.pop();
                if (popped.turn === 1) {
                    restoredState = popped;
                    break;
                }
            }
        } else {
            // In 2 Player mode, roll back 1 turn
            restoredState = stateHistory.pop();
        }

        if (restoredState) {
            SoundSystem.play('click');
            board = restoredState.board.map(row => [...row]);
            turn = restoredState.turn;
            p1Count = restoredState.p1Count;
            p2Count = restoredState.p2Count;
            totalMoves = restoredState.totalMoves;
            multiJumpPiece = restoredState.multiJumpPiece ? { ...restoredState.multiJumpPiece } : null;
            moveHistory = [...restoredState.moveHistory];

            selectedPiece = null;
            validMoves = [];

            saveGameState();
            updateHUD();
            updateMoveHistoryUI();
            scanMandatoryCaptures();
        } else {
            SoundSystem.play('error');
        }
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    if (isLoaded) {
        loadSavedState();
    } else {
        initBoard();
    }
    render();

    return {
        restart() {
            initBoard();
        },
        undo() {
            undoLastMove();
        },
        terminate() {
            isTerminated = true;
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('touchstart', onTouchStart);
            if (animationId) cancelAnimationFrame(animationId);
        }
    };
}
