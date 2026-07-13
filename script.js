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

// ==========================================
// ⚙️ GAME RULES STATE & PERSISTENCE
// ==========================================
let forceCaptureEnabled = localStorage.getItem('damma-force-capture') !== 'false'; // default to true (ON)

function isForceCaptureEnabled() {
    return forceCaptureEnabled;
}

function setForceCaptureEnabled(enabled) {
    forceCaptureEnabled = enabled;
    localStorage.setItem('damma-force-capture', enabled);
    updateDynamicUI();
    if (gameStateManager.activeGameInstance) {
        gameStateManager.activeGameInstance.triggerColorUpdate();
    }
}

// ========================
// 🎨 PIECE COLORS DATABASE
// ========================
const PIECE_COLORS = [
    {
        id: 'gold',
        name: 'Gold',
        rimStroke: '#8F6E0A',
        glowColor: '#ffd700',
        preview: 'radial-gradient(circle at 35% 35%, #FFF2AC, #D4AF37, #8F6E0A)',
        baseGrad: [
            { offset: 0, color: '#FFF2AC' },
            { offset: 0.2, color: '#E5C05B' },
            { offset: 0.6, color: '#D4AF37' },
            { offset: 0.9, color: '#AA820A' },
            { offset: 1, color: '#5B4400' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.15, color: '#FFF2AC' },
            { offset: 0.4, color: '#E5C05B' },
            { offset: 0.8, color: '#D4AF37' },
            { offset: 1, color: '#8F6E0A' }
        ]
    },
    {
        id: 'light-green',
        name: 'Light Green',
        rimStroke: '#1F421B',
        glowColor: '#a8e6a3',
        preview: 'radial-gradient(circle at 35% 35%, #E8FCE4, #A8E6A3, #2E5F2A)',
        baseGrad: [
            { offset: 0, color: '#E8FCE4' },
            { offset: 0.2, color: '#C2F3BD' },
            { offset: 0.6, color: '#A8E6A3' },
            { offset: 0.85, color: '#72BD6B' },
            { offset: 1, color: '#2E5F2A' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#DDFAD9' },
            { offset: 0.5, color: '#A8E6A3' },
            { offset: 0.85, color: '#5CA756' },
            { offset: 1, color: '#204A1C' }
        ]
    },
    {
        id: 'black',
        name: 'Black',
        rimStroke: '#050505',
        glowColor: '#cccccc',
        preview: 'radial-gradient(circle at 35% 35%, #777777, #222222, #000000)',
        baseGrad: [
            { offset: 0, color: '#777777' },
            { offset: 0.2, color: '#444444' },
            { offset: 0.6, color: '#222222' },
            { offset: 0.9, color: '#111111' },
            { offset: 1, color: '#000000' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.15, color: '#888888' },
            { offset: 0.4, color: '#444444' },
            { offset: 0.8, color: '#222222' },
            { offset: 1, color: '#0a0a0a' }
        ]
    },
    {
        id: 'white',
        name: 'White',
        rimStroke: '#888888',
        glowColor: '#ffffff',
        preview: 'radial-gradient(circle at 35% 35%, #FFFFFF, #EAEAEA, #999999)',
        baseGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#F0F0F0' },
            { offset: 0.6, color: '#E2E2E2' },
            { offset: 0.9, color: '#C5C5C5' },
            { offset: 1, color: '#999999' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#F5F5F5' },
            { offset: 0.5, color: '#EAEAEA' },
            { offset: 0.8, color: '#BFBFBF' },
            { offset: 1, color: '#8C8C8C' }
        ]
    },
    {
        id: 'gray',
        name: 'Gray',
        rimStroke: '#4A5253',
        glowColor: '#bdc3c7',
        preview: 'radial-gradient(circle at 35% 35%, #D5DBDB, #7F8C8D, #566573)',
        baseGrad: [
            { offset: 0, color: '#D5DBDB' },
            { offset: 0.2, color: '#BDC3C7' },
            { offset: 0.6, color: '#95A5A6' },
            { offset: 0.9, color: '#7F8C8D' },
            { offset: 1, color: '#566573' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#E5E8E8' },
            { offset: 0.5, color: '#BDC3C7' },
            { offset: 0.8, color: '#95A5A6' },
            { offset: 1, color: '#5D6D7E' }
        ]
    },
    {
        id: 'dark-brown',
        name: 'Dark Brown',
        rimStroke: '#251509',
        glowColor: '#d0a683',
        preview: 'radial-gradient(circle at 35% 35%, #A17D5F, #5C3D24, #1F1005)',
        baseGrad: [
            { offset: 0, color: '#A17D5F' },
            { offset: 0.2, color: '#7A5233' },
            { offset: 0.6, color: '#5C3D24' },
            { offset: 0.9, color: '#3D2512' },
            { offset: 1, color: '#1F1005' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#BD9F85' },
            { offset: 0.5, color: '#7A5233' },
            { offset: 0.85, color: '#4A2E19' },
            { offset: 1, color: '#251509' }
        ]
    }
];

// Load colors from localStorage (Default Player 1: Gold, Default Player 2: Light Green)
let selectedP1ColorId = localStorage.getItem('damma-p1-color') || 'gold';
let selectedP2ColorId = localStorage.getItem('damma-p2-color') || 'light-green';

// Enforce distinct fallback on load if corrupted
if (selectedP1ColorId === selectedP2ColorId) {
    selectedP1ColorId = 'gold';
    selectedP2ColorId = 'light-green';
}

function getP1Color() {
    return PIECE_COLORS.find(c => c.id === selectedP1ColorId) || PIECE_COLORS[0];
}

function getP2Color() {
    return PIECE_COLORS.find(c => c.id === selectedP2ColorId) || PIECE_COLORS[1];
}

function selectColor(playerNum, colorId) {
    const errorEl = document.getElementById('color-error-message');
    if (playerNum === 1) {
        if (colorId === selectedP2ColorId) {
            SoundSystem.play('error');
            errorEl.textContent = `⚠️ This color is already in use by the other player. Please choose a different color.`;
            errorEl.style.display = 'block';
            return false;
        }
        selectedP1ColorId = colorId;
        localStorage.setItem('damma-p1-color', colorId);
    } else {
        if (colorId === selectedP1ColorId) {
            SoundSystem.play('error');
            errorEl.textContent = `⚠️ This color is already in use by the other player. Please choose a different color.`;
            errorEl.style.display = 'block';
            return false;
        }
        selectedP2ColorId = colorId;
        localStorage.setItem('damma-p2-color', colorId);
    }
    
    errorEl.style.display = 'none';
    SoundSystem.play('click');
    renderPalettes();
    updateDynamicUI();
    
    if (gameStateManager.activeGameInstance) {
        gameStateManager.activeGameInstance.triggerColorUpdate();
    }
    return true;
}

function renderPalettes() {
    const p1Container = document.getElementById('p1-color-palette');
    const p2Container = document.getElementById('p2-color-palette');
    
    if (!p1Container || !p2Container) return;
    
    p1Container.innerHTML = '';
    p2Container.innerHTML = '';
    
    PIECE_COLORS.forEach(color => {
        // Player 1 color button
        const btn1 = document.createElement('div');
        btn1.className = 'color-option' + (color.id === selectedP1ColorId ? ' selected' : '');
        btn1.style.background = color.preview;
        btn1.title = `Player 1: ${color.name}`;
        btn1.addEventListener('click', () => {
            selectColor(1, color.id);
        });
        p1Container.appendChild(btn1);
        
        // Player 2 color button
        const btn2 = document.createElement('div');
        btn2.className = 'color-option' + (color.id === selectedP2ColorId ? ' selected' : '');
        btn2.style.background = color.preview;
        btn2.title = `Player 2: ${color.name}`;
        btn2.addEventListener('click', () => {
            selectColor(2, color.id);
        });
        p2Container.appendChild(btn2);
    });
}

function updateDynamicUI() {
    const p1Col = getP1Color();
    const p2Col = getP2Color();
    
    // Update labels
    const p1Label = document.querySelector('.score-card.player1 .score-label');
    if (p1Label) {
        if (gameStateManager.gameMode === 'vs-cpu') {
            p1Label.textContent = `PLAYER (YOU)`;
        } else {
            p1Label.textContent = `PLAYER 1 (YOU)`;
        }
    }
    
    const p2Label = document.getElementById('p2-label');
    if (p2Label) {
        if (gameStateManager.gameMode === 'vs-cpu') {
            p2Label.textContent = `CPU (${gameStateManager.difficulty.toUpperCase()})`;
        } else {
            p2Label.textContent = `PLAYER 2`;
        }
    }
    
    // Update score indicators
    const p1Ind = document.querySelector('.score-card.player1 .score-indicator');
    if (p1Ind) {
        p1Ind.style.background = p1Col.preview;
        p1Ind.style.boxShadow = `0 0 10px ${p1Col.glowColor}`;
    }
    const p2Ind = document.querySelector('.score-card.player2 .score-indicator');
    if (p2Ind) {
        p2Ind.style.background = p2Col.preview;
        p2Ind.style.boxShadow = `0 0 10px ${p2Col.glowColor}`;
    }
    
    // Update score values color/glow
    const p1Score = document.getElementById('p1-score');
    if (p1Score) {
        p1Score.style.color = p1Col.glowColor;
        p1Score.style.textShadow = `0 0 6px ${p1Col.glowColor}`;
    }
    const p2Score = document.getElementById('p2-score');
    if (p2Score) {
        p2Score.style.color = p2Col.glowColor;
        p2Score.style.textShadow = `0 0 6px ${p2Col.glowColor}`;
    }
    
    // Update active turn indication
    const turnText = document.getElementById('turn-indicator-text');
    if (turnText) {
        let currentTurn = 1;
        let isMultiJump = false;
        let hasMandatory = false;
        if (gameStateManager.activeGameInstance) {
            currentTurn = gameStateManager.activeGameInstance.getTurn();
            isMultiJump = !!gameStateManager.activeGameInstance.getMultiJumpPiece();
            hasMandatory = isForceCaptureEnabled() && gameStateManager.activeGameInstance.getMandatoryCaptures().length > 0;
        }
        
        const instructionText = document.getElementById('instruction-text');
        
        if (currentTurn === 1) {
            const p1Name = gameStateManager.gameMode === 'vs-cpu' ? 'PLAYER' : 'PLAYER 1';
            turnText.textContent = `${p1Name}'S TURN`;
            turnText.style.color = p1Col.glowColor;
            turnText.style.textShadow = `0 0 6px ${p1Col.glowColor}`;
            if (instructionText) {
                instructionText.textContent = isMultiJump
                    ? "Multi-jump available! Tap the destination to capture."
                    : (hasMandatory ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : `Select your piece to move.`);
            }
        } else {
            if (gameStateManager.gameMode === 'vs-cpu') {
                turnText.textContent = "CPU IS THINKING...";
                turnText.style.color = p2Col.glowColor;
                turnText.style.textShadow = `0 0 6px ${p2Col.glowColor}`;
                if (instructionText) {
                    instructionText.textContent = "CPU is planning its move...";
                }
            } else {
                turnText.textContent = `PLAYER 2'S TURN`;
                turnText.style.color = p2Col.glowColor;
                turnText.style.textShadow = `0 0 6px ${p2Col.glowColor}`;
                if (instructionText) {
                    instructionText.textContent = isMultiJump
                        ? "Multi-jump available! Tap the destination to capture."
                        : (hasMandatory ? "⚠️ CAPTURE MANDATORY! Tap glowing piece." : `Select your piece to move.`);
                }
            }
        }
    }

    // Update Undo button state & visibility
    const undoBtn = document.getElementById('hud-undo-btn');
    if (undoBtn) {
        if (gameStateManager.gameMode === 'vs-cpu') {
            undoBtn.style.display = 'flex';
            if (gameStateManager.activeGameInstance && typeof gameStateManager.activeGameInstance.canUndo === 'function') {
                undoBtn.disabled = !gameStateManager.activeGameInstance.canUndo();
            } else {
                undoBtn.disabled = true;
            }
        } else {
            undoBtn.style.display = 'none';
        }
    }
}

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
        if (btn) {
            const iconPath = btn.querySelector('svg path');
            if (iconPath) {
                if (this.soundEnabled) {
                    iconPath.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
                } else {
                    iconPath.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
                }
            }
            btn.style.borderColor = this.soundEnabled ? 'rgba(229, 184, 66, 0.5)' : 'rgba(255,255,255,0.15)';
            btn.style.color = this.soundEnabled ? 'var(--neon-yellow)' : 'var(--text-secondary)';
        }
    }
};

// ========================
// 🎬 SPLASH SCREEN TIMEOUT
// ========================
function initializeGameApp() {
    try {
        // Initialize color palettes and HUD styling on startup
        renderPalettes();
        updateDynamicUI();

        // Initialize and listen to Force Capture Rule toggle
        const forceToggle = document.getElementById('force-capture-toggle');
        if (forceToggle) {
            forceToggle.checked = isForceCaptureEnabled();
            forceToggle.addEventListener('change', (e) => {
                SoundSystem.play('click');
                setForceCaptureEnabled(e.target.checked);
            });
        }

        // Check if sound toggle was clicked
        const soundToggle = document.getElementById('sound-toggle-btn');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                SoundSystem.play('click');
                gameStateManager.toggleSound();
            });
        }

        // Move Log UI listeners
    const mobileLogBtn = document.getElementById('mobile-log-btn');
    const closeLogBtn = document.getElementById('close-log-btn');
    const moveLogPanel = document.getElementById('move-log-panel');
    
    if (mobileLogBtn && moveLogPanel) {
        mobileLogBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            moveLogPanel.classList.add('open');
        });
    }
    
    if (closeLogBtn && moveLogPanel) {
        closeLogBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            moveLogPanel.classList.remove('open');
        });
    }

    // Setup mode selector listeners
        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) {
            modeSelector.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-btn')) {
                    SoundSystem.play('click');
                    document.querySelectorAll('#mode-selector .toggle-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    gameStateManager.gameMode = e.target.getAttribute('data-mode');
                    
                    // Show/Hide difficulty selectors based on vs CPU
                    const diffSetting = document.getElementById('difficulty-setting');
                    if (diffSetting) {
                        if (gameStateManager.gameMode === 'vs-cpu') {
                            diffSetting.style.display = 'flex';
                        } else {
                            diffSetting.style.display = 'none';
                        }
                    }
                    
                    // Refresh P2 label text to CPU or Player 2
                    updateDynamicUI();
                }
            });
        }

        // Setup difficulty selector listeners
        const diffSelector = document.getElementById('difficulty-selector');
        if (diffSelector) {
            diffSelector.addEventListener('click', (e) => {
                if (e.target.classList.contains('toggle-btn')) {
                    SoundSystem.play('click');
                    document.querySelectorAll('#difficulty-selector .toggle-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    gameStateManager.difficulty = e.target.getAttribute('data-level');
                    
                    // Refresh P2 label text to include difficulty
                    updateDynamicUI();
                }
            });
        }

        // Start Game Button listener
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                localStorage.removeItem('damma-saved-game');
                gameStateManager.showScreen('gameplay-screen');
                // Initialize gameplay logic via engine function
                gameStateManager.activeGameInstance = createGame();
                // Force the gameplay HUD colors to match selection
                updateDynamicUI();
            });
        }

        // Back from gameplay HUD
        const hudBackBtn = document.getElementById('hud-back-btn');
        if (hudBackBtn) {
            hudBackBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.terminate();
                }
                gameStateManager.showScreen('main-menu');
            });
        }

        // Reset gameplay HUD
        const hudResetBtn = document.getElementById('hud-reset-btn');
        if (hudResetBtn) {
            hudResetBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.restart();
                }
            });
        }

        // Undo gameplay HUD
        const undoBtnEl = document.getElementById('hud-undo-btn');
        if (undoBtnEl) {
            undoBtnEl.addEventListener('click', () => {
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.undo();
                }
            });
        }

        // Restart from Game Over Screen
        const restartGameBtn = document.getElementById('restart-game-btn');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                localStorage.removeItem('damma-saved-game');
                gameStateManager.showScreen('gameplay-screen');
                gameStateManager.activeGameInstance = createGame();
                updateDynamicUI();
            });
        }

        // Return to Menu from Game Over Screen
        const menuGameBtn = document.getElementById('menu-game-btn');
        if (menuGameBtn) {
            menuGameBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                gameStateManager.showScreen('main-menu');
            });
        }
    } catch (e) {
        console.error("Error during game application initialization:", e);
    } finally {
        // ALWAYS ensure splash screen is transitioned and dismissed
        setTimeout(() => {
            try {
                gameStateManager.showScreen('main-menu');
            } catch (err) {
                console.error("Failed to dismiss splash screen:", err);
                const splash = document.getElementById('splash-screen');
                if (splash) splash.classList.remove('active');
                const menu = document.getElementById('main-menu');
                if (menu) menu.classList.add('active');
            }
        }, 2500);
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeGameApp);
} else {
    initializeGameApp();
}


// ==========================================================================
// 🧩 ENGINE RULE (DO NOT BREAK)
// ==========================================================================
function createGame() {
    // ONLY GAME LOGIC HERE

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Display Labels Update
    updateDynamicUI();

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

    // Undo History Snapshot State
    let cpuTimeoutId = null;
    let historyStack = [];
    let moveLog = []; // NEW

    function renderMoveLog() {
        const container = document.getElementById('move-log-content');
        if (!container) return;
        container.innerHTML = '';
        
        moveLog.forEach((log, index) => {
            const isHighlight = index === moveLog.length - 1;
            const pColorClass = log.player === 1 ? 'neon-bg-blue' : 'neon-bg-pink';
            const logEl = document.createElement('div');
            logEl.className = `log-item ${isHighlight ? 'highlight' : ''}`;
            logEl.innerHTML = `
                <span class="log-num">${log.moveNum}.</span>
                <span class="log-player-color ${pColorClass}"></span>
                <span class="log-detail">${log.desc}</span>
            `;
            container.appendChild(logEl);
        });
        container.scrollTop = container.scrollHeight;
    }

    function saveSnapshot() {
        if (gameStateManager.gameMode !== 'vs-cpu') return;
        historyStack.push({
            board: board.map(row => [...row]),
            turn: turn,
            p1Count: p1Count,
            p2Count: p2Count,
            totalMoves: totalMoves,
            selectedPiece: selectedPiece ? { ...selectedPiece } : null,
            multiJumpPiece: multiJumpPiece ? { ...multiJumpPiece } : null,
            validMoves: validMoves.map(m => ({ ...m })),
            mandatoryCaptures: mandatoryCaptures.map(m => ({ ...m })),
            moveLog: [...moveLog]
        });
    }

    function restoreSnapshot(snapshot) {
        board = snapshot.board.map(row => [...row]);
        turn = snapshot.turn;
        p1Count = snapshot.p1Count;
        p2Count = snapshot.p2Count;
        totalMoves = snapshot.totalMoves;
        selectedPiece = snapshot.selectedPiece ? { ...snapshot.selectedPiece } : null;
        multiJumpPiece = snapshot.multiJumpPiece ? { ...snapshot.multiJumpPiece } : null;
        validMoves = snapshot.validMoves.map(m => ({ ...m }));
        mandatoryCaptures = snapshot.mandatoryCaptures.map(m => ({ ...m }));
        moveLog = snapshot.moveLog ? [...snapshot.moveLog] : [];
        
        if (cpuTimeoutId) {
            clearTimeout(cpuTimeoutId);
            cpuTimeoutId = null;
        }
        isCpuThinking = false;
        
        updateHUD();
        renderMoveLog();
        saveGameToLocalStorage();
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
    function saveGameToLocalStorage() {
        try {
            localStorage.setItem('damma-saved-game', JSON.stringify({
                board,
                turn,
                p1Count,
                p2Count,
                totalMoves,
                startTime,
                historyStack,
                moveLog: [...moveLog], // NEW
                multiJumpPiece: multiJumpPiece ? { r: multiJumpPiece.r, c: multiJumpPiece.c } : null
            }));
        } catch (e) {
            console.error("Failed to save game to localStorage:", e);
        }
    }

    function initBoard(forceFresh = false) {
        if (!forceFresh) {
            const saved = localStorage.getItem('damma-saved-game');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    board = data.board;
                    turn = data.turn;
                    p1Count = data.p1Count;
                    p2Count = data.p2Count;
                    totalMoves = data.totalMoves;
                    startTime = data.startTime || Date.now();
                    multiJumpPiece = data.multiJumpPiece;
                    historyStack = data.historyStack || [];
                    selectedPiece = null;
                    validMoves = [];
                    isCpuThinking = false;
                    
                    if (cpuTimeoutId) {
                        clearTimeout(cpuTimeoutId);
                        cpuTimeoutId = null;
                    }
                    
                    moveLog = data.moveLog || [];
                    updateHUD();
                    renderMoveLog();
                    scanMandatoryCaptures();
                    return;
                } catch (e) {
                    console.error("Failed to load saved game:", e);
                }
            }
        }

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
        moveLog = [];
        startTime = Date.now();
        isCpuThinking = false;
        
        if (cpuTimeoutId) {
            clearTimeout(cpuTimeoutId);
            cpuTimeoutId = null;
        }

        moveLog = []; // NEW
        historyStack = [];
        updateHUD();
        renderMoveLog();
        scanMandatoryCaptures();
        saveSnapshot();
        localStorage.removeItem('damma-saved-game');
    }

    // Update stats on HUD
    function updateHUD() {
        document.getElementById('p1-score').textContent = p1Count;
        document.getElementById('p2-score').textContent = p2Count;
        updateDynamicUI();
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
    function getPieceJumps(r, c, customBoard = board) {
        const pieceType = customBoard[r][c];
        const jumps = [];
        if (pieceType === 0) return jumps;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);

        // Directions to look
        let dirs = [];
        if (isKing) {
            // All directions
            dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                let searchR = r + dr;
                let searchC = c + dc;
                let opponentFound = false;
                let oppPiece = null;

                while (searchR >= 0 && searchR < 8 && searchC >= 0 && searchC < 8) {
                    const cell = customBoard[searchR][searchC];
                    if (cell === 0) {
                        if (opponentFound) {
                            jumps.push({
                                r: searchR,
                                c: searchC,
                                capturedPiece: { r: oppPiece.r, c: oppPiece.c }
                            });
                        }
                    } else {
                        if (!opponentFound) {
                            if (Math.sign(cell) === -playerSign) {
                                opponentFound = true;
                                oppPiece = { r: searchR, c: searchC };
                            } else {
                                // Own piece blocks immediately
                                break;
                            }
                        } else {
                            // Any subsequent piece blocks the landing path
                            break;
                        }
                    }
                    searchR += dr;
                    searchC += dc;
                }
            }
        } else {
            // Regular pieces can only jump diagonally forward
            dirs = playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                const midR = r + dr;
                const midC = c + dc;
                const targetR = r + dr * 2;
                const targetC = c + dc * 2;

                // Check boundaries
                if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                    const targetCell = customBoard[targetR][targetC];
                    const midCell = customBoard[midR][midC];

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
        }

        return jumps;
    }

    // Get standard diagonal moves (distance = 1 for normal pieces, multi-range for Kings)
    function getPieceNormalMoves(r, c, customBoard = board) {
        const pieceType = customBoard[r][c];
        const moves = [];
        if (pieceType === 0) return moves;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);

        let dirs = [];
        if (isKing) {
            dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                let targetR = r + dr;
                let targetC = c + dc;
                while (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                    if (customBoard[targetR][targetC] === 0) {
                        moves.push({ r: targetR, c: targetC, isJump: false });
                    } else {
                        break;
                    }
                    targetR += dr;
                    targetC += dc;
                }
            }
        } else {
            dirs = playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                const targetR = r + dr;
                const targetC = c + dc;

                if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                    if (customBoard[targetR][targetC] === 0) {
                        moves.push({ r: targetR, c: targetC, isJump: false });
                    }
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

        const forceCapture = isForceCaptureEnabled();

        if (forceCapture && mandatoryCaptures.length > 0) {
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
            if (multiJumpPiece) {
                // Mid-multijump we must still follow the jump path for the locked piece
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
                // Normal turn: either capture or standard move is valid
                const jumps = getPieceJumps(r, c);
                jumps.forEach(j => {
                    validMoves.push({
                        r: j.r,
                        c: j.c,
                        isJump: true,
                        capturedPiece: j.capturedPiece
                    });
                });
                const normals = getPieceNormalMoves(r, c);
                normals.forEach(m => {
                    validMoves.push(m);
                });
            }
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
                isCpuThinking = false;
                executeMove(aiMove.fromR, aiMove.fromC, aiMove.toR, aiMove.toC, aiMove.isJump, aiMove.capturedPiece);
            } else {
                isCpuThinking = false;
                // If AI has no moves, player wins
                endGame(1, "No valid moves left for AI!");
            }
        }, thinkingTime);
    }

    function getBestCpuMove() {
        // CPU plays Turn = -1 (Pink/Black)
        // Scan all jumps/moves available for CPU
        scanMandatoryCaptures();
        
        let possibleMoves = [];
        const forceCapture = isForceCaptureEnabled();

        if (multiJumpPiece) {
            // Mid-multijump: CPU MUST choose from mandatory captures (the locked piece's jumps)
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
        } else if (forceCapture && mandatoryCaptures.length > 0) {
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
            // Either forceCapture is disabled, or there are no mandatory captures
            // We gather both jumps and standard diagonal moves.
            // Gather all optional jumps (captures)
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
                    }
                }
            }

            // Gather standard moves
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
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(currBoard[r][c]) === currTurn) {
                    const jumps = getPieceJumps(r, c, currBoard);
                    jumps.forEach(j => {
                        simulatedCaptures.push({
                            fromR: r,
                            fromC: c,
                            toR: j.r,
                            toC: j.c,
                            isJump: true,
                            capturedPiece: j.capturedPiece
                        });
                    });
                }
            }
        }

        let moves = [];
        const forceCapture = isForceCaptureEnabled();

        if (forceCapture && simulatedCaptures.length > 0) {
            moves = simulatedCaptures;
        } else {
            // Under optional capturing (forceCapture = false), both captures and standard moves are legal
            moves = [...simulatedCaptures];
            
            // Generate standard moves
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (Math.sign(currBoard[r][c]) === currTurn) {
                        const normals = getPieceNormalMoves(r, c, currBoard);
                        normals.forEach(m => {
                            moves.push({
                                fromR: r,
                                fromC: c,
                                toR: m.r,
                                toC: m.c,
                                isJump: false
                            });
                        });
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
        // Record move to log
        const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const rowNums = ['8', '7', '6', '5', '4', '3', '2', '1'];
        const fromStr = colLetters[fromC] + rowNums[fromR];
        const toStr = colLetters[toC] + rowNums[toR];
        let actionStr = isJump ? 'x' : '→';
        const isKing = Math.abs(board[fromR][fromC]) === 2;
        
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

        // Finalize log entry and add to log
        const logEntry = {
            player: turn,
            moveNum: Math.floor(totalMoves / 2) + 1,
            desc: `${isKing ? '♔ ' : ''}${fromStr} ${actionStr} ${toStr}${promoted ? ' = ♔' : ''}`
        };
        moveLog.push(logEntry);
        renderMoveLog();

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
                
                // If it is CPU's turn, trigger the next capture automatically
                if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
                    cpuMakeDecision();
                }
                saveGameToLocalStorage();
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

        // Save state snapshot right at the start of Player's Turn
        if (turn === 1 && multiJumpPiece === null) {
            saveSnapshot();
        }

        saveGameToLocalStorage();

        // If VS CPU mode, trigger CPU turn
        if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
            cpuMakeDecision();
        }
    }

    // Win condition checker
    function checkGameOver() {
        if (p1Count === 0) {
            endGame(-1, "Player 2 captures all pieces!");
            return true;
        }
        if (p2Count === 0) {
            endGame(1, "Player 1 captures all pieces!");
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
        localStorage.removeItem('damma-saved-game');
        if (winner === 1) {
            SoundSystem.play('win');
            const p1Name = gameStateManager.gameMode === 'vs-cpu' ? 'PLAYER' : 'PLAYER 1';
            document.getElementById('result-message').textContent = `${p1Name} WINS!`;
            document.getElementById('result-message').className = "neon-text-blue";
        } else {
            SoundSystem.play('lose');
            const oppName = gameStateManager.gameMode === 'vs-cpu' ? 'CPU' : 'PLAYER 2';
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

        // Clear Screen with beautiful warm dark wood table vignette
        const screenGrad = ctx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.1,
            width / 2, height / 2, Math.max(width, height) * 0.8
        );
        screenGrad.addColorStop(0, '#1e110a'); // Warm wood amber center
        screenGrad.addColorStop(1, '#0c0603'); // Extremely dark chocolate/ebony edge
        ctx.fillStyle = screenGrad;
        ctx.fillRect(0, 0, width, height);

        // Render soft dust particles/wood texture overlay on the background
        ctx.save();
        ctx.globalAlpha = 0.015;
        ctx.fillStyle = '#fff';
        for (let pi = 0; pi < 100; pi++) {
            const px = (Math.sin(pi * 4543.3) * 0.5 + 0.5) * width;
            const py = (Math.cos(pi * 2321.7) * 0.5 + 0.5) * height;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        pulseCycle = (pulseCycle + 0.05) % (Math.PI * 2);
        const pulseRatio = (Math.sin(pulseCycle) + 1) / 2; // 0 to 1 pulsing

        // 1. Draw Arcade Outer Board Border (Premium Handcrafted Traditional Wood Frame)
        ctx.save();
        
        // Frame outer shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 8;
        
        // Draw elegant thick wood frame around the board with rounded corners
        const framePadding = Math.max(12, boardSize * 0.04);
        const frameX = boardX - framePadding;
        const frameY = boardY - framePadding;
        const frameSize = boardSize + framePadding * 2;
        const borderRadius = 12;

        // Draw frame backing path with rounded corners
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(frameX, frameY, frameSize, frameSize, borderRadius);
        } else {
            // Fallback rounded rect
            ctx.rect(frameX, frameY, frameSize, frameSize);
        }
        
        // Fill frame with mahogany/teak wood gradient
        const frameGrad = ctx.createRadialGradient(
            width / 2, height / 2, boardSize / 3,
            width / 2, height / 2, frameSize / 2
        );
        frameGrad.addColorStop(0, '#5a3118'); // Mahogany light core
        frameGrad.addColorStop(0.7, '#3c1d0c'); // Mahogany dark body
        frameGrad.addColorStop(1, '#250f05'); // Espresso edge
        ctx.fillStyle = frameGrad;
        ctx.fill();
        ctx.restore(); // Restore to clear shadows for inner details

        // Draw wood grain lines across the frame
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.strokeStyle = '#fff8e7';
        ctx.lineWidth = 1;
        // Wavy vertical grains on the frame
        for (let gx = frameX; gx < frameX + frameSize; gx += 10) {
            ctx.beginPath();
            ctx.moveTo(gx, frameY);
            ctx.bezierCurveTo(
                gx + 12 * Math.sin(gx * 0.02), frameY + frameSize * 0.25,
                gx - 12 * Math.cos(gx * 0.02), frameY + frameSize * 0.75,
                gx, frameY + frameSize
            );
            ctx.stroke();
        }
        ctx.restore();

        // Draw frame borders and carving bevels
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 248, 230, 0.15)'; // light reflection inner bevel
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boardX, boardY, boardSize, boardSize);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; // dark cut outer bevel
        ctx.lineWidth = 2;
        ctx.strokeRect(boardX - 1, boardY - 1, boardSize + 2, boardSize + 2);
        
        // Draw elegant traditional carved geometric borders on the wooden frame (zig-zags or diamond accents)
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)'; // Gold carving tone
        ctx.lineWidth = 1;
        ctx.beginPath();
        const borderInset = framePadding * 0.4;
        if (ctx.roundRect) {
            ctx.roundRect(
                frameX + borderInset, frameY + borderInset,
                frameSize - borderInset * 2, frameSize - borderInset * 2,
                borderRadius * 0.7
            );
        } else {
            ctx.rect(
                frameX + borderInset, frameY + borderInset,
                frameSize - borderInset * 2, frameSize - borderInset * 2
            );
        }
        ctx.stroke();

        // Draw beautiful corner metal plates / brass brackets (traditional look)
        ctx.fillStyle = '#e5b842'; // Burnished brass
        ctx.strokeStyle = '#997315'; // Dark brass shadow
        ctx.lineWidth = 1;
        const cornerSize = framePadding * 0.8;
        
        // Top-Left corner brass plate
        ctx.beginPath();
        ctx.moveTo(frameX, frameY);
        ctx.lineTo(frameX + cornerSize * 1.5, frameY);
        ctx.lineTo(frameX + cornerSize, frameY + cornerSize);
        ctx.lineTo(frameX, frameY + cornerSize * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Top-Right
        ctx.beginPath();
        ctx.moveTo(frameX + frameSize, frameY);
        ctx.lineTo(frameX + frameSize - cornerSize * 1.5, frameY);
        ctx.lineTo(frameX + frameSize - cornerSize, frameY + cornerSize);
        ctx.lineTo(frameX + frameSize, frameY + cornerSize * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(frameX, frameY + frameSize);
        ctx.lineTo(frameX + cornerSize * 1.5, frameY + frameSize);
        ctx.lineTo(frameX + cornerSize, frameY + frameSize - cornerSize);
        ctx.lineTo(frameX, frameY + frameSize - cornerSize * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(frameX + frameSize, frameY + frameSize);
        ctx.lineTo(frameX + frameSize - cornerSize * 1.5, frameY + frameSize);
        ctx.lineTo(frameX + frameSize - cornerSize, frameY + frameSize - cornerSize);
        ctx.lineTo(frameX + frameSize, frameY + frameSize - cornerSize * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw small rivets on corner plates
        ctx.fillStyle = '#4a3308';
        const rivetOffset = cornerSize * 0.4;
        const drawRivet = (rx, ry) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
            ctx.fill();
        };
        drawRivet(frameX + rivetOffset, frameY + rivetOffset);
        drawRivet(frameX + frameSize - rivetOffset, frameY + rivetOffset);
        drawRivet(frameX + rivetOffset, frameY + frameSize - rivetOffset);
        drawRivet(frameX + frameSize - rivetOffset, frameY + frameSize - rivetOffset);
        
        ctx.restore();

        // 2. Draw standard Checkerboard cells (Realistic wood grain)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = boardX + c * cellSize;
                const y = boardY + r * cellSize;
                const isDarkCell = (r + c) % 2 === 1;

                ctx.save();
                
                if (isDarkCell) {
                    // Dark Mahogany Wood Cell
                    const cellGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    cellGrad.addColorStop(0, '#361c0e'); // rich walnut dark
                    cellGrad.addColorStop(1, '#241005'); // espresso brown
                    ctx.fillStyle = cellGrad;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    // Grain lines inside the dark cell
                    ctx.strokeStyle = 'rgba(255, 230, 200, 0.04)';
                    ctx.lineWidth = 1;
                    for (let gi = 2; gi < cellSize; gi += 6) {
                        ctx.beginPath();
                        ctx.moveTo(x + gi, y);
                        ctx.bezierCurveTo(
                            x + gi + Math.sin(gi * 0.1) * 3, y + cellSize * 0.3,
                            x + gi - Math.cos(gi * 0.1) * 3, y + cellSize * 0.7,
                            x + gi, y + cellSize
                        );
                        ctx.stroke();
                    }
                    
                    // Dark overlay for board cells to look deep and rich
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.fillRect(x, y, cellSize, cellSize);
                } else {
                    // Light Maple/Oak Wood Cell
                    const cellGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    cellGrad.addColorStop(0, '#dfc19c'); // warm cream wood/beveled oak
                    cellGrad.addColorStop(1, '#cdab83'); // sand wood
                    ctx.fillStyle = cellGrad;
                    ctx.fillRect(x, y, cellSize, cellSize);
                    
                    // Subtle grain lines inside the light cell
                    ctx.strokeStyle = 'rgba(100, 60, 30, 0.08)';
                    ctx.lineWidth = 1;
                    for (let gi = 2; gi < cellSize; gi += 6) {
                        ctx.beginPath();
                        ctx.moveTo(x + gi, y);
                        ctx.bezierCurveTo(
                            x + gi + Math.sin(gi * 0.1) * 2, y + cellSize * 0.3,
                            x + gi - Math.cos(gi * 0.1) * 2, y + cellSize * 0.7,
                            x + gi, y + cellSize
                        );
                        ctx.stroke();
                    }
                }

                // Inner bevel/shadow for cell depth to make them look slightly carved/beveled
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; // highlight
                ctx.beginPath();
                ctx.moveTo(x, y + cellSize);
                ctx.lineTo(x, y);
                ctx.lineTo(x + cellSize, y);
                ctx.stroke();

                ctx.restore();
            }
        }

        // 3. Highlight Mandatory Capturing Pieces (glowing pulsing red-gold rings)
        if (isForceCaptureEnabled() && (turn === 1 || gameStateManager.gameMode !== 'vs-cpu')) {
            if (mandatoryCaptures.length > 0) {
                ctx.save();
                ctx.lineWidth = 2.5 + pulseRatio * 2.5;
                ctx.strokeStyle = `rgba(230, 57, 70, ${0.5 + pulseRatio * 0.5})`;
                ctx.shadowColor = '#e63946';
                ctx.shadowBlur = 12;
                
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
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ffd700'; // Golden glow
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 14;
            
            // Draw a traditional double-ring indicator
            ctx.beginPath();
            ctx.arc(scx, scy, cellSize * 0.44, 0, Math.PI * 2);
            ctx.stroke();
            
            // Inner subtle ring
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(scx, scy, cellSize * 0.38, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }

        // 5. Render Valid moves destinations (warm colors instead of harsh neon)
        validMoves.forEach(m => {
            const tcx = boardX + m.c * cellSize + cellSize / 2;
            const tcy = boardY + m.r * cellSize + cellSize / 2;
            ctx.save();
            ctx.lineWidth = 2.5;
            // Warm green-gold for normal moves, coral-red for jump captures
            ctx.strokeStyle = m.isJump ? '#e63946' : '#2ecc71';
            ctx.fillStyle = m.isJump ? 'rgba(230, 57, 70, 0.25)' : 'rgba(46, 204, 113, 0.2)';
            ctx.shadowColor = m.isJump ? '#e63946' : '#2ecc71';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.arc(tcx, tcy, cellSize * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw a tiny target center dot
            ctx.beginPath();
            ctx.arc(tcx, tcy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = m.isJump ? '#ff6b6b' : '#a3e635';
            ctx.fill();
            ctx.restore();
        });

        // 6. Draw actual Game Pieces (Premium traditional wooden and gemstone materials)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = board[r][c];
                if (val !== 0) {
                    const cx = boardX + c * cellSize + cellSize / 2;
                    const cy = boardY + r * cellSize + cellSize / 2;
                    const radius = cellSize * 0.35;
                    const isPlayer1 = val > 0;
                    const isKing = Math.abs(val) === 2;

                    const activeColor = isPlayer1 ? getP1Color() : getP2Color();

                    ctx.save();
                    
                    // Piece shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                    ctx.shadowBlur = selectedPiece && selectedPiece.r === r && selectedPiece.c === c ? 14 : 6;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 3;

                    // Base metallic/glass piece radial gradient
                    const baseGrad = ctx.createRadialGradient(
                        cx - radius * 0.25, cy - radius * 0.25, radius * 0.05,
                        cx, cy, radius
                    );

                    activeColor.baseGrad.forEach(stop => {
                        baseGrad.addColorStop(stop.offset, stop.color);
                    });

                    // Draw outer ring
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = baseGrad;
                    ctx.fill();
                    
                    // Darker outer rim stroke for 3D depth
                    ctx.strokeStyle = activeColor.rimStroke;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Concentric accent ring ridges for 3D texture
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
                    ctx.strokeStyle = isPlayer1 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(cx, cy, radius * 0.68, 0, Math.PI * 2);
                    ctx.strokeStyle = isPlayer1 ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Central inlaid gemstone (Highly polished core dome)
                    ctx.save();
                    const gemRadius = radius * 0.45;
                    const gemGrad = ctx.createRadialGradient(
                        cx - gemRadius * 0.3, cy - gemRadius * 0.3, gemRadius * 0.05,
                        cx, cy, gemRadius
                    );

                    activeColor.gemGrad.forEach(stop => {
                        gemGrad.addColorStop(stop.offset, stop.color);
                    });

                    // Glow if selected/active
                    if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) {
                        ctx.shadowColor = activeColor.glowColor;
                        ctx.shadowBlur = 12;
                    } else {
                        ctx.shadowColor = activeColor.glowColor + '66'; // ~40% opacity in hex
                        ctx.shadowBlur = 6;
                    }

                    ctx.beginPath();
                    ctx.arc(cx, cy, gemRadius, 0, Math.PI * 2);
                    ctx.fillStyle = gemGrad;
                    ctx.fill();
                    ctx.restore();

                    // Specular gloss light crescent arc on top-left edge
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(cx - radius * 0.18, cy - radius * 0.18, radius * 0.32, Math.PI * 0.95, Math.PI * 1.55);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();

                    // Accent inner groove
                    ctx.beginPath();
                    ctx.arc(cx, cy, gemRadius * 0.5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    // Gold Outer Ring for Kings to make them stand out on the board
                    if (isKing) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(cx, cy, radius + 2.5, 0, Math.PI * 2);
                        ctx.strokeStyle = '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#ffd700';
                        ctx.shadowBlur = 8;
                        ctx.stroke();
                        ctx.restore();
                    }

                    // King Indicator (Elegant traditional golden carved crown)
                    if (isKing) {
                        ctx.save();
                        // Luxurious gold crown glow
                        ctx.shadowColor = '#ffd700';
                        ctx.shadowBlur = 12;
                        
                        // Dark golden base shading for contrast
                        ctx.fillStyle = '#b8860b';
                        ctx.beginPath();
                        const cw = radius * 0.58;
                        const ch = radius * 0.48;
                        const bx = cx - cw / 2;
                        const by = cy - ch / 2 - 2;

                        ctx.moveTo(bx - 1, by + ch + 1);
                        ctx.lineTo(bx - 1, by - 1);
                        ctx.lineTo(bx + cw * 0.25, by + ch * 0.4 - 1);
                        ctx.lineTo(bx + cw * 0.5, by - ch * 0.1 - 1);
                        ctx.lineTo(bx + cw * 0.75, by + ch * 0.4 - 1);
                        ctx.lineTo(bx + cw + 1, by - 1);
                        ctx.lineTo(bx + cw + 1, by + ch + 1);
                        ctx.closePath();
                        ctx.fill();

                        // Main golden crown body gradient (shining 24k gold)
                        const crownGrad = ctx.createLinearGradient(bx, by, bx + cw, by + ch);
                        crownGrad.addColorStop(0, '#ffffff'); // Glare shine
                        crownGrad.addColorStop(0.3, '#ffd700'); // Pure gold
                        crownGrad.addColorStop(1, '#d4af37'); // Metallic brass gold
                        ctx.fillStyle = crownGrad;

                        ctx.beginPath();
                        ctx.moveTo(bx, by + ch);
                        ctx.lineTo(bx, by);
                        ctx.lineTo(bx + cw * 0.25, by + ch * 0.4);
                        ctx.lineTo(bx + cw * 0.5, by - ch * 0.1);
                        ctx.lineTo(bx + cw * 0.75, by + ch * 0.4);
                        ctx.lineTo(bx + cw, by);
                        ctx.lineTo(bx + cw, by + ch);
                        ctx.closePath();
                        ctx.fill();

                        // Crown design separator line
                        ctx.strokeStyle = '#4e3308';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(bx, by + ch - 1.5);
                        ctx.lineTo(bx + cw, by + ch - 1.5);
                        ctx.stroke();

                        // Tiny diamond sparkles on the crown peaks
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(cx, by - ch * 0.1, 1.8, 0, Math.PI * 2);
                        ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
                        ctx.arc(bx + cw, by, 1.5, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
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

            // Must select a piece that has mandatory captures available, if list exists and force capture is enabled
            const forceCapture = isForceCaptureEnabled();
            if (forceCapture && mandatoryCaptures.length > 0) {
                const canCapture = mandatoryCaptures.some(m => m.fromR === r && m.fromC === c);
                if (!canCapture) {
                    SoundSystem.play('error');
                    document.getElementById('instruction-text').textContent = "⚠️ CAPTURE MANDATORY! Tap a piece glowing in crimson.";
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

        function terminate() {
        isTerminated = true;
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('touchstart', onTouchStart);
        if (animationId) cancelAnimationFrame(animationId);
    }

    // EXPORT CORE ACTIONS FOR THE STATE MANAGER
    return {
        restart() {
            initBoard(true);
        },
        terminate() {
            terminate();
        },
        getTurn() {
            return turn;
        },
        getMultiJumpPiece() {
            return multiJumpPiece;
        },
        getMandatoryCaptures() {
            return mandatoryCaptures;
        },
        triggerColorUpdate() {
            updateHUD();
        },
        undo() {
            if (gameStateManager.gameMode !== 'vs-cpu') return;
            if (turn === 1) {
                if (historyStack.length <= 1) return;
                historyStack.pop(); // pop current turn's start state
            }
            const previousState = historyStack[historyStack.length - 1];
            if (previousState) {
                restoreSnapshot(previousState);
            }
        },
        canUndo() {
            if (gameStateManager.gameMode !== 'vs-cpu') return false;
            if (turn === 1) {
                return historyStack.length > 1;
            } else {
                return historyStack.length > 0;
            }
        }
    };
}
