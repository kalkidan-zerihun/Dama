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
window.addEventListener('DOMContentLoaded', () => {
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

    // Start Game Button listener
    document.getElementById('start-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('gameplay-screen');
        // Initialize gameplay logic via engine function
        gameStateManager.activeGameInstance = createGame();
    });

    // Back from gameplay HUD
    document.getElementById('hud-back-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        if (gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.terminate();
        }
        gameStateManager.showScreen('main-menu');
    });

    // Reset gameplay HUD
    document.getElementById('hud-reset-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        if (gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.restart();
        }
    });

    // Restart from Game Over Screen
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('gameplay-screen');
        gameStateManager.activeGameInstance = createGame();
    });

    // Return to Menu from Game Over Screen
    document.getElementById('menu-game-btn').addEventListener('click', () => {
        SoundSystem.play('click');
        gameStateManager.showScreen('main-menu');
    });

    // Transition Splash Screen to Main Menu after 2.5 seconds
    setTimeout(() => {
        gameStateManager.showScreen('main-menu');
    }, 2500);
});


// ==========================================================================
// 🧩 ENGINE RULE (DO NOT BREAK)
// ==========================================================================
function createGame() {
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
    let animationId = null;
    let isTerminated = false;

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
            document.getElementById('instruction-text').textContent = multiJumpPiece 
                ? "Multi-jump available! Tap the destination to capture." 
                : (mandatoryCaptures.length > 0 ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : "Select a Blue piece to move.");
        } else {
            if (gameStateManager.gameMode === 'vs-cpu') {
                turnText.textContent = "CPU IS THINKING...";
                turnText.className = "turn-text neon-text-pink";
                document.getElementById('instruction-text').textContent = "CPU is planning its move...";
            } else {
                turnText.textContent = "PINK'S TURN";
                turnText.className = "turn-text neon-text-pink";
                document.getElementById('instruction-text').textContent = multiJumpPiece 
                    ? "Multi-jump available! Tap the destination to capture." 
                    : (mandatoryCaptures.length > 0 ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : "Select a Pink piece to move.");
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

        // If multi-jumping, must use the locked piece
        if (multiJumpPiece && (multiJumpPiece.r !== r || multiJumpPiece.c !== c)) {
            return;
        }

        if (mandatoryCaptures.length > 0) {
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
        if (isCpuThinking || turn === 1 || isTerminated) return;
        isCpuThinking = true;
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
            isCpuThinking = false;
        }, thinkingTime);
    }

    function getBestCpuMove() {
        // CPU plays Turn = -1 (Pink/Black)
        // Scan all jumps/moves available for CPU
        scanMandatoryCaptures();
        
        let possibleMoves = [];
        if (mandatoryCaptures.length > 0) {
            // Mandatory jumps available! CPU MUST choose from these
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
            // Standard moves
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.sign(board[r][c]) === -1) {
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

        // If Easy: Pick completely random valid move
        if (gameStateManager.difficulty === 'easy') {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }

        // If Medium: Search with Minimax depth 2
        // If Hard: Search with Minimax depth 4
        const depth = gameStateManager.difficulty === 'medium' ? 2 : 4;
        let bestScore = -Infinity;
        let bestMove = possibleMoves[0];

        for (const m of possibleMoves) {
            // Apply move on clone board
            const tempBoard = board.map(row => [...row]);
            
            // Execute simulated move
            tempBoard[m.toR][m.toC] = tempBoard[m.fromR][m.fromC];
            tempBoard[m.fromR][m.fromC] = 0;
            if (m.isJump) {
                tempBoard[m.capturedPiece.r][m.capturedPiece.c] = 0;
            }

            // Check promotion
            if (tempBoard[m.toR][m.toC] === -1 && m.toR === 7) {
                tempBoard[m.toR][m.toC] = -2; // King
            }

            // Perform minimax evaluation
            const score = minimax(tempBoard, depth - 1, -Infinity, Infinity, false, 1);
            if (score > bestScore) {
                bestScore = score;
                bestMove = m;
            }
        }

        return bestMove;
    }

    // Minimax depth evaluator
    function minimax(currBoard, depth, alpha, beta, isMaximizing, currTurn) {
        // Quick static evaluation
        if (depth === 0) {
            return evaluateBoard(currBoard);
        }

        // Generate possible moves for current simulation level
        let simulatedCaptures = [];
        // Helper to check captures for simulation
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(currBoard[r][c]) === currTurn) {
                    // Collect moves/jumps (simplified single ply check)
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
        if (simulatedCaptures.length > 0) {
            moves = simulatedCaptures;
        } else {
            // Generate standard moves
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
            // Loss for whoever's turn it is
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

    // Heuristics: weights regular, kings, and control of central squares
    function evaluateBoard(currBoard) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = currBoard[r][c];
                if (val === -1) {
                    score += 10; // CPU regular
                    score += r * 0.5; // Encourages advancing forward
                } else if (val === -2) {
                    score += 18; // CPU King
                } else if (val === 1) {
                    score -= 10; // Player regular
                    score -= (7 - r) * 0.5; // Encourages player advancing (evaluated as bad for CPU)
                } else if (val === 2) {
                    score -= 18; // Player King
                }
                
                // Slight bonus for occupying center board rows (3,4) to make AI play smart
                if ((val !== 0) && (r === 3 || r === 4) && (c >= 2 && c <= 5)) {
                    score += Math.sign(val) * 1.5;
                }
            }
        }
        return score;
    }


    // ==========================================
    // ⚔️ MOVE EXECUTION AND TURN SWITCHING
    // ==========================================
    function executeMove(fromR, fromC, toR, toC, isJump, capturedPiece) {
        const pieceType = board[fromR][fromC];
        board[toR][toC] = pieceType;
        board[fromR][fromC] = 0;

        let promoted = false;

        // Perform Capture
        if (isJump && capturedPiece) {
            const capturedType = board[capturedPiece.r][capturedPiece.c];
            board[capturedPiece.r][capturedPiece.c] = 0;
            
            if (Math.sign(capturedType) === 1) p1Count--;
            else p2Count--;

            SoundSystem.play('capture');
        } else {
            SoundSystem.play('move');
        }

        // King Promotion Check
        if (pieceType === 1 && toR === 0) {
            board[toR][toC] = 2; // Blue King promoted
            promoted = true;
            SoundSystem.play('king');
        } else if (pieceType === -1 && toR === 7) {
            board[toR][toC] = -2; // Pink King promoted
            promoted = true;
            SoundSystem.play('king');
        }

        // Deselect current
        selectedPiece = null;
        validMoves = [];
        totalMoves++;

        // Verify Multi-Jump Rule:
        // A player cannot continue a multi-jump sequence if they were promoted during this turn.
        if (isJump && !promoted) {
            const extraJumps = getPieceJumps(toR, toC);
            if (extraJumps.length > 0) {
                // Yes! Locked into multi-jump for this specific piece
                multiJumpPiece = { r: toR, c: toC };
                scanMandatoryCaptures();
                updateHUD();
                return;
            }
        }

        // Reset multi jump, switch player turn
        multiJumpPiece = null;
        turn = -turn;
        
        scanMandatoryCaptures();
        updateHUD();

        // Check if game has ended
        if (checkGameOver()) return;

        // If VS CPU mode, trigger CPU turn
        if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
            cpuMakeDecision();
        }
    }

    // Win condition checker
    function checkGameOver() {
        if (p1Count === 0) {
            endGame(-1, "Pink captures all pieces!");
            return true;
        }
        if (p2Count === 0) {
            endGame(1, "Blue captures all pieces!");
            return true;
        }

        // Check if active player has ANY legal moves
        let hasMoves = false;
        
        // If mandatory captures are active, then they have moves
        if (mandatoryCaptures.length > 0) {
            hasMoves = true;
        } else {
            // Scan for any regular diagonal move
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
            // Active player loses because they are blocked!
            const winner = -turn;
            endGame(winner, "No moves left for opponent!");
            return true;
        }

        return false;
    }

    function endGame(winner, reason) {
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

        // Format duration
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

        // Clear Screen with cool deep dark space mesh
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        pulseCycle = (pulseCycle + 0.05) % (Math.PI * 2);
        const pulseRatio = (Math.sin(pulseCycle) + 1) / 2; // 0 to 1 pulsing

        // 1. Draw Arcade Outer Board Border (Neon glowing container)
        ctx.save();
        ctx.shadowColor = turn === 1 ? 'rgba(0, 243, 255, 0.5)' : 'rgba(255, 0, 127, 0.5)';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.strokeStyle = turn === 1 ? 'var(--neon-blue)' : 'var(--neon-pink)';
        ctx.strokeRect(boardX - 4, boardY - 4, boardSize + 8, boardSize + 8);
        ctx.restore();

        // 2. Draw standard Checkerboard cells
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = boardX + c * cellSize;
                const y = boardY + r * cellSize;
                const isDarkCell = (r + c) % 2 === 1;

                if (isDarkCell) {
                    ctx.fillStyle = '#12141a'; // deep board dark
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    // Subtle cell inner borders
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, cellSize, cellSize);
                } else {
                    ctx.fillStyle = '#1e222b'; // light grid cells
                    ctx.fillRect(x, y, cellSize, cellSize);
                }
            }
        }

        // 3. Highlight Mandatory Capturing Pieces (glowing pulsing red rings)
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

        // 4. Draw selection indicator
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

        // 5. Render Valid moves destinations (Cyan/Green hollow circles)
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

        // 6. Draw actual Game Pieces
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
                    
                    // Radial gradient for premium spheres
                    const grad = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.1, cx, cy, radius);
                    
                    if (isPlayer1) {
                        // Blue piece gradient
                        grad.addColorStop(0, '#ffffff');
                        grad.addColorStop(1, '#94a3b8');
                        
                        ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
                        ctx.shadowBlur = selectedPiece && selectedPiece.r === r && selectedPiece.c === c ? 18 : 8;
                    } else {
                        // Pink piece gradient
                        grad.addColorStop(0, '#475569');
                        grad.addColorStop(1, '#0f172a');
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                        ctx.shadowBlur = 8;
                    }

                    // Base piece circle
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    
                    // Subtle darker edge ring
                    ctx.strokeStyle = isPlayer1 ? '#cbd5e1' : '#334155';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Decorative center concentric ring
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.stroke();

                    // King Indicator (Glowing Crown)
                    if (isKing) {
                        ctx.shadowColor = 'var(--neon-yellow)';
                        ctx.shadowBlur = 10;
                        ctx.fillStyle = 'var(--neon-yellow)';
                        
                        // Draw a stylish vector crown
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

        // Resolve absolute position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const touchX = clientX - rect.left;
        const touchY = clientY - rect.top;

        // Translate coordinates to grid board indices
        const c = Math.floor((touchX - boardX) / cellSize);
        const r = Math.floor((touchY - boardY) / cellSize);

        // Bounds checks
        if (r < 0 || r >= 8 || c < 0 || c >= 8) return;

        // Verify if we tapped an active valid move indicator
        const chosenMove = validMoves.find(m => m.r === r && m.c === c);
        if (chosenMove && selectedPiece) {
            executeMove(selectedPiece.r, selectedPiece.c, r, c, chosenMove.isJump, chosenMove.capturedPiece);
            return;
        }

        // Tap on a piece to select/deselect
        const cellValue = board[r][c];
        if (cellValue !== 0 && Math.sign(cellValue) === turn) {
            // Cannot change selection during multi-jump lock
            if (multiJumpPiece) {
                if (multiJumpPiece.r !== r || multiJumpPiece.c !== c) {
                    SoundSystem.play('error');
                    return;
                }
            }

            // Must select a piece that has mandatory captures available, if list exists
            if (mandatoryCaptures.length > 0) {
                const canCapture = mandatoryCaptures.some(m => m.fromR === r && m.fromC === c);
                if (!canCapture) {
                    SoundSystem.play('error');
                    document.getElementById('instruction-text').textContent = "⚠️ CAPTURE MANDATORY! Tap a piece glowing in magenta.";
                    return;
                }
            }

            SoundSystem.play('click');
            selectedPiece = { r, c };
            computeValidMoves(r, c);
        } else {
            // Clicked empty cell or opponent without moving
            if (selectedPiece && !multiJumpPiece) {
                selectedPiece = null;
                validMoves = [];
            }
        }
    }

    // Event listeners
    function onMouseDown(e) {
        handleInteraction(e.clientX, e.clientY);
    }

    function onTouchStart(e) {
        if (e.touches.length > 0) {
            // Prevent zooming/double taps defaults
            e.preventDefault();
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    // Initializer run
    initBoard();
    render();

    // EXPORT CORE ACTIONS FOR THE STATE MANAGER
    return {
        restart() {
            initBoard();
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
