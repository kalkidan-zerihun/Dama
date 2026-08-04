/* ==========================================================================
   🎮 GAME ENGINE AND MAIN STATS FOR DAMMA
   ========================================================================== */

window.addEventListener('error', (e) => {
    if (e && e.message && e.message.includes('ResizeObserver')) {
        e.stopImmediatePropagation();
        e.preventDefault();
    }
});

import en from './translations/en.js';
import am from './translations/am.js';
import { initOnlineUI, getCurrentOnlineRoomId } from './src/online/onlineUI.js';
import { sendOnlineMove } from './src/online/roomService.js';

const translations = { en, am };

let cleanupGameOverCanvas = null;

function t(key, defaultValue = "") {
    const lang = localStorage.getItem('damma-language-toggle-bar') || 'en';
    return translations[lang]?.[key] || translations['en']?.[key] || defaultValue || key;
}

function bootstrapLocalization() {
    // Find all elements in the DOM that might match a translation value
    // Let's first search explicit settings labels, titles, descriptions, etc.
    document.querySelectorAll('.setting-label-bold, .pane-title, .pane-sub-title, .toggle-heading, .toggle-subtext, .stats-board-title, .about-game-title, .about-version, .about-dev, .about-studio, .about-description, .about-footer-tag, .github-link-accent').forEach(el => {
        const text = el.textContent.trim();
        const matchingKey = Object.keys(en).find(key => en[key] === text);
        if (matchingKey) {
            el.setAttribute('data-i18n', matchingKey);
        }
    });

    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.hasAttribute('data-i18n')) return;
        const children = Array.from(el.childNodes);
        const textNodes = children.filter(node => node.nodeType === Node.TEXT_NODE);
        
        if (textNodes.length === 1 && children.length === 1) {
            const trimmedText = (textNodes[0]?.textContent || '').trim();
            if (trimmedText) {
                const matchingKey = Object.keys(en).find(key => en[key] === trimmedText);
                if (matchingKey) {
                    el.setAttribute('data-i18n', matchingKey);
                }
            }
        }
    });

    // Preset cards
    document.querySelectorAll('.preset-card').forEach(card => {
        const nameEl = card.querySelector('.preset-name');
        const descEl = card.querySelector('.preset-desc');
        if (nameEl) {
            const text = nameEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) nameEl.setAttribute('data-i18n', matchingKey);
        }
        if (descEl) {
            const text = descEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) descEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Board theme names
    document.querySelectorAll('.board-theme-card').forEach(card => {
        const nameEl = card.querySelector('.theme-name');
        if (nameEl) {
            const text = nameEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) nameEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Settings nav text
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        const textEl = item.querySelector('.nav-text');
        if (textEl) {
            const text = textEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) textEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Bento card labels and descriptions
    document.querySelectorAll('.bento-card').forEach(card => {
        const labelEl = card.querySelector('.bento-label');
        const descEl = card.querySelector('.bento-desc');
        if (labelEl) {
            const text = labelEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) labelEl.setAttribute('data-i18n', matchingKey);
        }
        if (descEl) {
            const text = descEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) descEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Data action items
    document.querySelectorAll('.data-action-item').forEach(item => {
        const h4El = item.querySelector('.data-info h4');
        const spanEl = item.querySelector('.data-info span');
        const btnEl = item.querySelector('.data-action-btn');
        if (h4El) {
            const text = h4El.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) h4El.setAttribute('data-i18n', matchingKey);
        }
        if (spanEl) {
            const text = spanEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) spanEl.setAttribute('data-i18n', matchingKey);
        }
        if (btnEl) {
            const text = btnEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) btnEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Premium extras content cards
    document.querySelectorAll('.prem-card').forEach(card => {
        const h4El = card.querySelector('h4');
        const pEl = card.querySelector('p');
        const ctaBtn = card.querySelector('.premium-cta-btn') || card.querySelector('.puzz-launch-btn');
        if (h4El) {
            const text = h4El.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) h4El.setAttribute('data-i18n', matchingKey);
        }
        if (pEl) {
            const text = pEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) pEl.setAttribute('data-i18n', matchingKey);
        }
        if (ctaBtn) {
            const text = ctaBtn.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) ctaBtn.setAttribute('data-i18n', matchingKey);
        }
    });

    // Profile stats labels
    document.querySelectorAll('.stat-box').forEach(box => {
        const lblEl = box.querySelector('.stat-lbl');
        if (lblEl) {
            const text = lblEl.textContent.trim();
            const matchingKey = Object.keys(en).find(key => en[key] === text);
            if (matchingKey) lblEl.setAttribute('data-i18n', matchingKey);
        }
    });

    // Profile faves labels
    document.querySelectorAll('.fave-item span').forEach(spanEl => {
        const text = spanEl.textContent.trim();
        const matchingKey = Object.keys(en).find(key => en[key] === text);
        if (matchingKey) spanEl.setAttribute('data-i18n', matchingKey);
    });
}

function applyLocalization() {
    const lang = localStorage.getItem('damma-language-toggle-bar') || 'en';
    
    // 1. All elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = translations[lang]?.[key] || translations['en']?.[key];
        if (translation) {
            el.textContent = translation;
        }
    });

    // 2. Select elements dropdown option list translations
    const selectOptionsMap = {
        'stone-style-select': {
            'classic': 'opt_classic_flat',
            'glossy': 'opt_glossy',
            'wooden': 'opt_wooden',
            'marble': 'opt_marble',
            'glass': 'opt_glass',
            'metal': 'opt_metal',
            'clay': 'opt_clay',
            'premium_gold': 'opt_premium_gold',
            'premium_obsidian': 'opt_premium_obsidian'
        },
        'rule-move-timer': {
            '0': 'opt_unlimited',
            '15': 'opt_15_sec',
            '30': 'opt_30_sec',
            '45': 'opt_45_sec',
            '60': 'opt_60_sec'
        },
        'ai-personality-select': {
            'balanced': 'opt_personality_balanced',
            'aggressive': 'opt_personality_aggressive',
            'defensive': 'opt_personality_defensive',
            'tactical': 'opt_personality_tactical',
            'random': 'opt_personality_random'
        },
        'gameplay-anim-speed': {
            'slow': 'opt_speed_slow',
            'normal': 'opt_speed_normal',
            'fast': 'opt_speed_fast',
            'instant': 'opt_speed_instant'
        },
        'access-colorblind': {
            'none': 'opt_no_assist',
            'protanopia': 'opt_protanopia',
            'deuteranopia': 'opt_deuteranopia',
            'tritanopia': 'opt_tritanopia'
        }
    };

    for (const [selectId, options] of Object.entries(selectOptionsMap)) {
        const selectEl = document.getElementById(selectId);
        if (selectEl) {
            Array.from(selectEl.options).forEach(opt => {
                const translationKey = options[opt.value];
                if (translationKey) {
                    opt.textContent = t(translationKey);
                }
            });
        }
    }
}

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
        if (localStorage.getItem('damma-audio-mute-all') === 'true') return;

        // Individual discrete sound disables
        if (type === 'click' && localStorage.getItem('damma-sfx-click-sound') === 'false') return;
        if (type === 'error' && localStorage.getItem('damma-sfx-click-sound') === 'false') return;
        if (type === 'move' && localStorage.getItem('damma-sfx-move-sound') === 'false') return;
        if (type === 'capture' && localStorage.getItem('damma-sfx-capture-sound') === 'false') return;
        if (type === 'king' && localStorage.getItem('damma-sfx-victory-sound') === 'false') return;
        if (type === 'win' && localStorage.getItem('damma-sfx-victory-sound') === 'false') return;
        if (type === 'lose' && localStorage.getItem('damma-sfx-victory-sound') === 'false') return;

        this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Dynamic gain scaling based on master and SFX volume
        const masterVol = parseFloat(localStorage.getItem('damma-master-volume') ?? '80') / 100;
        const sfxVol = parseFloat(localStorage.getItem('damma-sfx-volume') ?? '80') / 100;
        const volumeScale = masterVol * sfxVol;

        const volumeNode = this.ctx.createGain();
        volumeNode.gain.setValueAtTime(volumeScale, this.ctx.currentTime);
        volumeNode.connect(this.ctx.destination);
        
        osc.connect(gain);
        gain.connect(volumeNode);

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
            case 'hover':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
                osc.start(now);
                osc.stop(now + 0.04);
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
window.SoundSystem = SoundSystem;

// ==========================================
// ⚙️ GAME RULES STATE & PERSISTENCE
// ==========================================
let forceCaptureEnabled = (localStorage.getItem('damma-rule-mandatory-capture') !== null)
    ? (localStorage.getItem('damma-rule-mandatory-capture') !== 'false')
    : (localStorage.getItem('damma-force-capture') !== 'false');

function isForceCaptureEnabled() {
    return localStorage.getItem('damma-rule-mandatory-capture') !== 'false';
}

function setForceCaptureEnabled(enabled) {
    forceCaptureEnabled = enabled;
    localStorage.setItem('damma-rule-mandatory-capture', enabled ? 'true' : 'false');
    localStorage.setItem('damma-force-capture', enabled ? 'true' : 'false');
    updateDynamicUI();
    if (gameStateManager.activeGameInstance) {
        gameStateManager.activeGameInstance.triggerColorUpdate();
    }
}

// ========================
// 🎨 PIECE COLORS DATABASE (Basic & Classic Colors)
// ========================
const PIECE_COLORS = [
    {
        id: 'white',
        name: 'Classic White',
        rimStroke: '#777777',
        glowColor: '#ffffff',
        preview: 'radial-gradient(circle at 35% 35%, #FFFFFF, #E6E6E6, #A0A0A0)',
        baseGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.25, color: '#F5F5F7' },
            { offset: 0.65, color: '#E1E1E6' },
            { offset: 0.88, color: '#CCCCCC' },
            { offset: 1, color: '#999999' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.25, color: '#FAFAFC' },
            { offset: 0.55, color: '#EDEDF2' },
            { offset: 0.85, color: '#D1D1D6' },
            { offset: 1, color: '#A1A1A6' }
        ]
    },
    {
        id: 'black',
        name: 'Classic Black',
        rimStroke: '#111111',
        glowColor: '#cccccc',
        preview: 'radial-gradient(circle at 35% 35%, #666666, #222222, #050505)',
        baseGrad: [
            { offset: 0, color: '#666666' },
            { offset: 0.25, color: '#3D3D3D' },
            { offset: 0.65, color: '#222222' },
            { offset: 0.88, color: '#141414' },
            { offset: 1, color: '#050505' }
        ],
        gemGrad: [
            { offset: 0, color: '#888888' },
            { offset: 0.25, color: '#555555' },
            { offset: 0.55, color: '#333333' },
            { offset: 0.85, color: '#1C1C1C' },
            { offset: 1, color: '#0A0A0A' }
        ]
    },
    {
        id: 'gold',
        name: 'Imperial Gold',
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
        id: 'red',
        name: 'Imperial Red',
        rimStroke: '#5F0F1A',
        glowColor: '#ef4444',
        preview: 'radial-gradient(circle at 35% 35%, #FCA5A5, #DC2626, #7F1D1D)',
        baseGrad: [
            { offset: 0, color: '#FCA5A5' },
            { offset: 0.2, color: '#EF4444' },
            { offset: 0.6, color: '#C1121F' },
            { offset: 0.9, color: '#7F1D1D' },
            { offset: 1, color: '#450A0A' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#FEE2E2' },
            { offset: 0.5, color: '#EF4444' },
            { offset: 0.8, color: '#991B1B' },
            { offset: 1, color: '#450A0A' }
        ]
    },
    {
        id: 'dark-brown',
        name: 'Traditional Brown',
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
    },
    {
        id: 'blue',
        name: 'Royal Blue',
        rimStroke: '#0D2D54',
        glowColor: '#3b82f6',
        preview: 'radial-gradient(circle at 35% 35%, #93C5FD, #2563EB, #1E3A8A)',
        baseGrad: [
            { offset: 0, color: '#93C5FD' },
            { offset: 0.2, color: '#3B82F6' },
            { offset: 0.6, color: '#1D4ED8' },
            { offset: 0.9, color: '#1E3A8A' },
            { offset: 1, color: '#0F172A' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#BFDBFE' },
            { offset: 0.5, color: '#3B82F6' },
            { offset: 0.8, color: '#1D4ED8' },
            { offset: 1, color: '#172554' }
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
        id: 'gray',
        name: 'Steel Gray',
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
        id: 'cyan',
        name: 'Ocean Cyan',
        rimStroke: '#065F46',
        glowColor: '#06b6d4',
        preview: 'radial-gradient(circle at 35% 35%, #A5F3FC, #0891B2, #0E7490)',
        baseGrad: [
            { offset: 0, color: '#A5F3FC' },
            { offset: 0.2, color: '#06B6D4' },
            { offset: 0.6, color: '#0891B2' },
            { offset: 0.9, color: '#0E7490' },
            { offset: 1, color: '#115E59' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#CFFAFE' },
            { offset: 0.5, color: '#06B6D4' },
            { offset: 0.8, color: '#0E7490' },
            { offset: 1, color: '#155E75' }
        ]
    },
    {
        id: 'orange',
        name: 'Sunburnt Orange',
        rimStroke: '#7C2D12',
        glowColor: '#f97316',
        preview: 'radial-gradient(circle at 35% 35%, #FED7AA, #EA580C, #9A3412)',
        baseGrad: [
            { offset: 0, color: '#FED7AA' },
            { offset: 0.2, color: '#F97316' },
            { offset: 0.6, color: '#D97706' },
            { offset: 0.9, color: '#9A3412' },
            { offset: 1, color: '#431407' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#FFEDD5' },
            { offset: 0.5, color: '#F97316' },
            { offset: 0.8, color: '#9A3412' },
            { offset: 1, color: '#7C2D12' }
        ]
    },
    {
        id: 'emerald',
        name: 'Axumite Emerald',
        rimStroke: '#064E3B',
        glowColor: '#10b981',
        preview: 'radial-gradient(circle at 35% 35%, #A7F3D0, #059669, #064E3B)',
        baseGrad: [
            { offset: 0, color: '#A7F3D0' },
            { offset: 0.2, color: '#10B981' },
            { offset: 0.6, color: '#059669' },
            { offset: 0.9, color: '#064E3B' },
            { offset: 1, color: '#022C22' }
        ],
        gemGrad: [
            { offset: 0, color: '#FFFFFF' },
            { offset: 0.2, color: '#D1FAE5' },
            { offset: 0.5, color: '#10B981' },
            { offset: 0.8, color: '#047857' },
            { offset: 1, color: '#064E3B' }
        ]
    }
];

// Load colors from localStorage (Default Player 1: Classic White, Default Player 2: Classic Black)
let selectedP1ColorId = localStorage.getItem('damma-p1-color') || 'white';
let selectedP2ColorId = localStorage.getItem('damma-p2-color') || 'black';

// Migrate legacy default (gold & light-green) to basic classic (white & black)
if (selectedP1ColorId === 'gold' && selectedP2ColorId === 'light-green') {
    selectedP1ColorId = 'white';
    selectedP2ColorId = 'black';
    localStorage.setItem('damma-p1-color', 'white');
    localStorage.setItem('damma-p2-color', 'black');
}

// Enforce distinct fallback on load if corrupted
if (selectedP1ColorId === selectedP2ColorId) {
    selectedP1ColorId = 'white';
    selectedP2ColorId = 'black';
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
            if (errorEl) {
                errorEl.textContent = `⚠️ This color is already in use by the other player. Please choose a different color.`;
                errorEl.style.display = 'block';
            }
            return false;
        }
        selectedP1ColorId = colorId;
        localStorage.setItem('damma-p1-color', colorId);
    } else {
        if (colorId === selectedP1ColorId) {
            SoundSystem.play('error');
            if (errorEl) {
                errorEl.textContent = `⚠️ This color is already in use by the other player. Please choose a different color.`;
                errorEl.style.display = 'block';
            }
            return false;
        }
        selectedP2ColorId = colorId;
        localStorage.setItem('damma-p2-color', colorId);
    }
    
    if (errorEl) errorEl.style.display = 'none';
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
    const p2Label = document.getElementById('p2-label');
    const turnText = document.getElementById('turn-indicator-text');

    if (gameStateManager.gameMode === 'online') {
        const onlineData = typeof window.getOnlineUsernames === 'function' ? window.getOnlineUsernames() : null;
        if (onlineData) {
            const myUid = typeof window.getCurrentUserUid === 'function' ? window.getCurrentUserUid() : null;
            const isP1 = myUid === onlineData.p1Uid;

            if (p1Label) {
                p1Label.textContent = isP1 ? `${onlineData.p1Username} (YOU)` : `${onlineData.p1Username}`;
            }
            if (p2Label) {
                p2Label.textContent = !isP1 ? `${onlineData.p2Username} (YOU)` : `${onlineData.p2Username}`;
            }

            if (turnText) {
                let currentTurn = onlineData.currentTurn || 1;
                if (gameStateManager.activeGameInstance) {
                    currentTurn = gameStateManager.activeGameInstance.getTurn();
                }
                const myRole = isP1 ? 1 : -1;
                const isMyTurn = currentTurn === myRole;
                const activeOppName = isP1 ? onlineData.p2Username : onlineData.p1Username;

                if (isMyTurn) {
                    turnText.textContent = 'YOUR TURN';
                    turnText.style.color = '#ffd700';
                    turnText.style.textShadow = '0 0 6px #ffd700';
                } else {
                    turnText.textContent = `${activeOppName.toUpperCase()}'S TURN`;
                    turnText.style.color = '#3b82f6';
                    turnText.style.textShadow = '0 0 6px #3b82f6';
                }
            }
        }
    } else {
        if (p1Label) {
            if (gameStateManager.gameMode === 'vs-cpu') {
                p1Label.textContent = t('player_label_you', `PLAYER (YOU)`);
            } else {
                p1Label.textContent = t('player1_label_you', `PLAYER 1 (YOU)`);
            }
        }
        
        if (p2Label) {
            if (gameStateManager.gameMode === 'vs-cpu') {
                const difficultyStr = t(gameStateManager.difficulty, gameStateManager.difficulty.toUpperCase());
                p2Label.textContent = `${t('cpu_label', 'CPU')} (${difficultyStr})`;
            } else {
                p2Label.textContent = t('player2_label', `PLAYER 2`);
            }
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
    
    if (turnText && gameStateManager.gameMode !== 'online') {
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
            const p1Name = gameStateManager.gameMode === 'vs-cpu' ? t('player_label', 'PLAYER') : t('player1_label', 'PLAYER 1');
            turnText.textContent = t('turn_format', "{name}'S TURN").replace('{name}', p1Name);
            turnText.style.color = p1Col.glowColor;
            turnText.style.textShadow = `0 0 6px ${p1Col.glowColor}`;
            if (instructionText) {
                instructionText.textContent = isMultiJump
                    ? t('instruction_multi_jump', "Multi-jump available! Tap the destination to capture.")
                    : (hasMandatory ? t('instruction_capture_mandatory', "⚠️ CAPTURE MANDATORY! Tap glowing piece.") : t('select_piece_to_move', `Select your piece to move.`));
            }
        } else {
            if (gameStateManager.gameMode === 'vs-cpu') {
                turnText.textContent = t('cpu_thinking', "CPU IS THINKING...");
                turnText.style.color = p2Col.glowColor;
                turnText.style.textShadow = `0 0 6px ${p2Col.glowColor}`;
                if (instructionText) {
                    instructionText.textContent = t('instruction_cpu_thinking', "CPU is planning its move...");
                }
            } else {
                const p2Name = t('player2_label', 'PLAYER 2');
                turnText.textContent = t('turn_format', "{name}'S TURN").replace('{name}', p2Name);
                turnText.style.color = p2Col.glowColor;
                turnText.style.textShadow = `0 0 6px ${p2Col.glowColor}`;
                if (instructionText) {
                    instructionText.textContent = isMultiJump
                        ? t('instruction_multi_jump', "Multi-jump available! Tap the destination to capture.")
                        : (hasMandatory ? t('instruction_capture_mandatory', "⚠️ CAPTURE MANDATORY! Tap glowing piece.") : t('select_piece_to_move', `Select your piece to move.`));
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
        window.dispatchEvent(new Event('resize'));
    },

    setSoundEnabled(enabled) {
        this.soundEnabled = !!enabled;
        localStorage.setItem('damma-sound-enabled', this.soundEnabled ? 'true' : 'false');
        localStorage.setItem('damma-audio-mute-all', this.soundEnabled ? 'false' : 'true');
        this.updateSoundUI();
    },

    toggleSound() {
        this.setSoundEnabled(!this.soundEnabled);
    },

    updateSoundUI() {
        const btnIds = ['sound-toggle-btn', 'hud-sound-btn'];
        btnIds.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                const iconPath = btn.querySelector('svg path');
                if (iconPath) {
                    if (this.soundEnabled) {
                        iconPath.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
                        iconPath.setAttribute('fill', '#ffd700');
                    } else {
                        iconPath.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
                        iconPath.setAttribute('fill', '#c5b5a5');
                    }
                }
                btn.style.borderColor = this.soundEnabled ? 'rgba(229, 184, 66, 0.5)' : 'rgba(255,255,255,0.15)';
                btn.style.color = this.soundEnabled ? 'var(--neon-yellow)' : 'var(--text-secondary)';
                btn.setAttribute('title', this.soundEnabled ? 'Mute Sound' : 'Unmute Sound');
            }
        });

        const muteAllBox = document.getElementById('audio-mute-all');
        if (muteAllBox) {
            muteAllBox.checked = !this.soundEnabled;
        }
    }
};
window.gameStateManager = gameStateManager;

// ========================
// 🎬 SPLASH SCREEN TIMEOUT
// ========================
function initializeGameApp() {
    try {
        // Bootstrap localization schemas
        bootstrapLocalization();

        // Initialize color palettes and HUD styling on startup
        renderPalettes();
        updateDynamicUI();

        // Initialize sound preferences
        const storedSound = localStorage.getItem('damma-sound-enabled');
        if (storedSound !== null) {
            gameStateManager.soundEnabled = (storedSound === 'true');
        } else {
            const muteAll = localStorage.getItem('damma-audio-mute-all');
            if (muteAll !== null) {
                gameStateManager.soundEnabled = (muteAll !== 'true');
            } else {
                gameStateManager.soundEnabled = true;
            }
        }
        gameStateManager.updateSoundUI();

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

        // Check if HUD sound toggle was clicked
        const hudSoundToggle = document.getElementById('hud-sound-btn');
        if (hudSoundToggle) {
            hudSoundToggle.addEventListener('click', () => {
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
                const btn = e.target.closest('.toggle-btn');
                if (btn) {
                    SoundSystem.play('click');
                    document.querySelectorAll('#mode-selector .toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    gameStateManager.gameMode = btn.getAttribute('data-mode') || 'vs-cpu';
                    
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
                const btn = e.target.closest('.toggle-btn');
                if (btn) {
                    SoundSystem.play('click');
                    document.querySelectorAll('#difficulty-selector .toggle-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    gameStateManager.difficulty = btn.getAttribute('data-level') || 'medium';
                    
                    // Refresh P2 label text to include difficulty
                    updateDynamicUI();
                }
            });
        }

        // Start Game Button listener
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            const handleStartGame = (e) => {
                if (e) {
                    e.preventDefault();
                }
                SoundSystem.play('click');
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.terminate();
                }
                localStorage.removeItem('damma-saved-game');
                gameStateManager.showScreen('gameplay-screen');
                // Initialize gameplay logic via engine function
                gameStateManager.activeGameInstance = createGame();
                // Force the gameplay HUD colors to match selection
                updateDynamicUI();
            };

            startGameBtn.addEventListener('click', handleStartGame);
            startGameBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                    handleStartGame(e);
                }
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
                if (typeof cleanupGameOverCanvas === 'function') {
                    cleanupGameOverCanvas();
                    cleanupGameOverCanvas = null;
                }
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.terminate();
                }
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
                if (typeof cleanupGameOverCanvas === 'function') {
                    cleanupGameOverCanvas();
                    cleanupGameOverCanvas = null;
                }
                gameStateManager.showScreen('main-menu');
            });
        }

        // Initialize comprehensive system settings bindings
        setupSettingsPanel();

        // Initialize Tutorial Manager, Daily Challenge, and Pause Manager Systems
        if (typeof TutorialManager !== 'undefined') TutorialManager.init();
        if (typeof DailyChallengeSystem !== 'undefined') DailyChallengeSystem.init();
        if (typeof PauseManager !== 'undefined') PauseManager.init();

        // Initialize premium landing page enhancements
        setupPremiumMainMenu();
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

function setupPremiumMainMenu() {
    // 1. INITIATE BACKGROUND DUST PARTICLES
    let cleanupParticles = null;
    try {
        cleanupParticles = initMenuParticles();
    } catch (e) {
        console.error("Failed to initialize menu particles:", e);
    }

    // 2. BACKGROUND MOUSE PARALLAX EFFECT
    const menu = document.getElementById('main-menu');
    const bg = document.getElementById('menu-parallax-bg');
    if (menu && bg) {
        menu.addEventListener('mousemove', (e) => {
            const rect = menu.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            bg.style.transform = `translate(calc(${x} * -15px), calc(${y} * -15px)) scale(1.02)`;
        });
        menu.addEventListener('mouseleave', () => {
            bg.style.transform = 'translate(0, 0) scale(1)';
        });
    }

    // 3. SECURE BROWSER AUDIO RESUME ON FIRST USER INTERACTION
    const resumeAudio = () => {
        if (SoundSystem.ctx && SoundSystem.ctx.state === 'suspended') {
            SoundSystem.ctx.resume().then(() => {
                AmbientSynth.start();
            });
        } else {
            AmbientSynth.start();
        }
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
        window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    // 4. ATTACH HOVER & CLICK PLUCK SOUND TO MENUS
    const playMenuHover = () => {
        const muteAll = localStorage.getItem('damma-audio-mute-all') === 'true';
        const enabled = localStorage.getItem('damma-sfx-enabled') !== 'false';
        if (!muteAll && enabled) {
            SoundSystem.play('hover');
        }
    };
    document.querySelectorAll('#main-menu button, #main-menu .toggle-btn, .exit-modal-btn').forEach(btn => {
        btn.addEventListener('mouseenter', playMenuHover);
    });

    // 5. WIRE NAVIGATION SHORTCUTS TO SETTINGS MODAL TABS
    const openSettingsWithTab = (targetTab) => {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('active');
            if (typeof loadAllSettingsIntoUI === 'function') {
                loadAllSettingsIntoUI();
            }
            const tabItem = Array.from(document.querySelectorAll('.settings-nav-item'))
                .find(item => item.getAttribute('data-tab') === targetTab);
            if (tabItem) {
                tabItem.click();
            }
        }
    };

    document.getElementById('menu-how-to-play-btn')?.addEventListener('click', () => {
        SoundSystem.play('click');
        openSettingsWithTab('tutorial');
    });

    document.getElementById('menu-achievements-btn')?.addEventListener('click', () => {
        SoundSystem.play('click');
        openSettingsWithTab('extra');
    });

    document.getElementById('menu-settings-btn')?.addEventListener('click', () => {
        SoundSystem.play('click');
        openSettingsWithTab('appearance');
    });

    // 6. WIRE IMMERSIVE EXIT CONFIRMATION MODAL
    const exitBtn = document.getElementById('menu-exit-btn');
    const exitModal = document.getElementById('exit-modal');
    const exitConfirm = document.getElementById('exit-confirm-btn');
    const exitCancel = document.getElementById('exit-cancel-btn');

    if (exitBtn && exitModal) {
        exitBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            exitModal.classList.add('active');
        });
    }

    if (exitCancel && exitModal) {
        exitCancel.addEventListener('click', () => {
            SoundSystem.play('click');
            exitModal.classList.remove('active');
        });
    }

    if (exitConfirm) {
        exitConfirm.addEventListener('click', () => {
            SoundSystem.play('click');
            const content = exitModal.querySelector('.exit-modal-content');
            if (content) {
                content.style.transition = 'opacity 0.4s ease';
                content.style.opacity = '0';
                setTimeout(() => {
                    content.innerHTML = `
                        <span class="exit-modal-icon" style="font-size: 4.5rem; margin-bottom: 8px;">👑</span>
                        <h2 class="exit-modal-title" style="color: #ffd700; font-family: 'Cinzel', serif;">THANK YOU!</h2>
                        <p class="exit-modal-subtitle" style="font-family: 'Lora', serif; color: rgba(255,255,255,0.7); margin-top: 8px;">Damma has shut down gracefully. We look forward to your next match!</p>
                    `;
                    content.style.opacity = '1';
                }, 400);
            }
            
            setTimeout(() => {
                exitModal.classList.remove('active');
                try {
                    window.close();
                } catch (e) {}
            }, 2600);
        });
    }
}

function initMenuParticles() {
    const canvas = document.getElementById('menu-particles-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    function resize() {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height + canvas.height,
            size: Math.random() * 2.0 + 0.6,
            speedY: -(Math.random() * 0.35 + 0.15),
            speedX: Math.random() * 0.2 - 0.1,
            opacity: Math.random() * 0.5 + 0.2,
            hue: 42 + Math.random() * 6, // rich gold tones
            angle: Math.random() * Math.PI * 2,
            wobbleSpeed: Math.random() * 0.02 + 0.005
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw subtle centered glow
        const grad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 50, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
        grad.addColorStop(0, 'rgba(229, 184, 66, 0.03)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let p of particles) {
            p.y += p.speedY;
            p.angle += p.wobbleSpeed;
            p.x += p.speedX + Math.sin(p.angle) * 0.12;

            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${p.opacity})`;
            ctx.shadowColor = `hsla(${p.hue}, 85%, 60%, 0.4)`;
            ctx.shadowBlur = p.size * 2;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
    };
}

// Initialization logic moved to the bottom of the file to prevent TDZ/initialization order issues.


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
    let piecesCaptured = 0;
    let kingsCreated = 0;
    let startTime = Date.now();
    let isCpuThinking = false;
    let animationId = null;
    let isTerminated = false;
    let lastFpsUpdateTime = 0;
    let frameCount = 0;
    let fps = 60;
    let pulseCycle = 0;

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

    let resizeObserver = null;

    // Resizing Rule
    function resize() {
        if (isTerminated) return;
        const container = canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        width = container.clientWidth || rect.width || window.innerWidth;
        height = container.clientHeight || rect.height || (window.innerHeight - 140);

        if (width <= 0) width = Math.max(300, window.innerWidth);
        if (height <= 0) height = Math.max(300, window.innerHeight - 140);

        canvas.width = width;
        canvas.height = height;

        // Make board fit perfectly within screen container without clipping or HUD overlap
        const availWidth = width * 0.96;
        const availHeight = height * 0.96;
        boardSize = Math.min(availWidth, availHeight);
        if (boardSize > 640) boardSize = 640;
        if (boardSize < 180) boardSize = 180;
        
        boardX = (width - boardSize) / 2;
        boardY = (height - boardSize) / 2;
        cellSize = boardSize / 8;

        render();
    }

    if (window.ResizeObserver) {
        const container = canvas.parentElement;
        if (container) {
            let resizeRafId = null;
            resizeObserver = new ResizeObserver(() => {
                if (resizeRafId) cancelAnimationFrame(resizeRafId);
                resizeRafId = requestAnimationFrame(() => {
                    resize();
                });
            });
            resizeObserver.observe(container);
        }
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(resize);
    setTimeout(resize, 50);

    // ==========================================
    // ♟️ BOARD INITIALIZATION (8x8 CHECKERBOARD)
    // ==========================================
    let activeDailyMeta = null;
    let myOnlineRole = null;

    function saveGameToLocalStorage() {
        if (gameStateManager.gameMode === 'online') return;
        try {
            localStorage.setItem('damma-saved-game', JSON.stringify({
                board,
                turn,
                p1Count,
                p2Count,
                totalMoves,
                startTime,
                historyStack,
                activeDailyMeta,
                moveLog: [...moveLog], // NEW
                multiJumpPiece: multiJumpPiece ? { r: multiJumpPiece.r, c: multiJumpPiece.c } : null
            }));
        } catch (e) {
            console.error("Failed to save game to localStorage:", e);
        }
    }

    function initBoard(forceFresh = false) {
        const challengeBoardStr = localStorage.getItem('damma-challenge-board');
        const activeMetaStr = localStorage.getItem('damma-active-daily-meta');
        if (activeMetaStr) {
            try {
                activeDailyMeta = JSON.parse(activeMetaStr);
            } catch (e) {
                activeDailyMeta = null;
            }
        }

        if (challengeBoardStr) {
            try {
                const challengeData = JSON.parse(challengeBoardStr);
                if (challengeData && Array.isArray(challengeData.board) && challengeData.board.length === 8 && challengeData.board.every(row => Array.isArray(row) && row.length === 8)) {
                    board = challengeData.board;
                    turn = challengeData.turn || 1;
                    p1Count = challengeData.p1Count;
                    p2Count = challengeData.p2Count;
                    totalMoves = 0;
                    startTime = Date.now();
                    multiJumpPiece = null;
                    historyStack = [];
                    selectedPiece = null;
                    validMoves = [];
                    moveLog = [];
                    isCpuThinking = false;

                    if (challengeData.dailyId && challengeData.todayStr) {
                        activeDailyMeta = { dailyId: challengeData.dailyId, todayStr: challengeData.todayStr, title: challengeData.title || "Daily Challenge" };
                        localStorage.setItem('damma-active-daily-meta', JSON.stringify(activeDailyMeta));
                    }

                    localStorage.removeItem('damma-challenge-board'); // Consumed

                    updateHUD();
                    renderMoveLog();
                    scanMandatoryCaptures();
                    return;
                }
            } catch (e) {
                console.error("Failed to load challenge board:", e);
            }
        }

        if (!forceFresh && gameStateManager.gameMode !== 'online') {
            const saved = localStorage.getItem('damma-saved-game');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data && Array.isArray(data.board) && data.board.length === 8 && data.board.every(row => Array.isArray(row) && row.length === 8)) {
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
                        if (data.activeDailyMeta) {
                            activeDailyMeta = data.activeDailyMeta;
                        }
                        
                        if (cpuTimeoutId) {
                            clearTimeout(cpuTimeoutId);
                            cpuTimeoutId = null;
                        }
                        
                        moveLog = data.moveLog || [];
                        updateHUD();
                        renderMoveLog();
                        scanMandatoryCaptures();
                        return;
                    }
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

    let turnTimerInterval = null;
    let turnTimeRemaining = 0;

    function startTurnTimer() {
        if (turnTimerInterval) {
            clearInterval(turnTimerInterval);
            turnTimerInterval = null;
        }

        const timerBadge = document.getElementById('hud-timer-badge');
        const timerText = document.getElementById('hud-timer-text');
        if (!timerBadge || !timerText) return;

        const limitStr = localStorage.getItem('damma-rule-match-timer') || '0';
        const limitSec = parseInt(limitStr, 10);

        if (isNaN(limitSec) || limitSec <= 0) {
            timerBadge.style.display = 'none';
            timerBadge.classList.remove('warning');
            return;
        }

        timerBadge.style.display = 'inline-flex';
        timerBadge.classList.remove('warning');
        turnTimeRemaining = limitSec;
        timerText.textContent = `${turnTimeRemaining}s`;

        turnTimerInterval = setInterval(() => {
            if (isTerminated || (typeof PauseManager !== 'undefined' && PauseManager.isPaused) || gameStateManager.currentScreen !== 'gameplay-screen') {
                return;
            }

            turnTimeRemaining--;
            if (turnTimeRemaining <= 5 && turnTimeRemaining > 0) {
                timerBadge.classList.add('warning');
                SoundSystem.play('click');
            } else {
                timerBadge.classList.remove('warning');
            }

            if (turnTimeRemaining <= 0) {
                timerText.textContent = '0s';
                clearInterval(turnTimerInterval);
                turnTimerInterval = null;
                SoundSystem.play('error');

                const activePlayerName = turn === 1 ? 'Player 1' : (gameStateManager.gameMode === 'vs-cpu' ? 'CPU' : 'Player 2');
                logMove(`⏱️ Time expired! ${activePlayerName} turn skipped.`);

                multiJumpPiece = null;
                turn = -turn;
                scanMandatoryCaptures();
                updateHUD();

                if (checkGameOver()) return;

                if (turn === 1 && multiJumpPiece === null) {
                    saveSnapshot();
                }
                saveGameToLocalStorage();

                if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
                    cpuMakeDecision();
                }
            } else {
                timerText.textContent = `${turnTimeRemaining}s`;
            }
        }, 1000);
    }

    // Update stats on HUD
    function updateHUD() {
        document.getElementById('p1-score').textContent = p1Count;
        document.getElementById('p2-score').textContent = p2Count;
        updateDynamicUI();
        startTurnTimer();
    }

    // ==========================================
    // ⚔️ MOVE GENERATION AND JUMP MANDATE RULES
    // ==========================================

    function getPieceJumpSequences(r, c, currentBoard) {
        const jumps = getPieceJumps(r, c, currentBoard);
        if (jumps.length === 0) {
            return [[]]; // Base case: no more jumps
        }

        const multiCapture = localStorage.getItem('damma-rule-multi-capture') !== 'false';
        if (!multiCapture) {
            // If multi-capture is disabled, max length is 1 jump
            return jumps.map(j => [j]);
        }

        const sequences = [];
        for (const j of jumps) {
            // Clone the board and apply the jump
            const nextBoard = currentBoard.map(row => [...row]);
            const piece = nextBoard[r][c];
            nextBoard[j.r][j.c] = piece;
            nextBoard[r][c] = 0;
            nextBoard[j.capturedPiece.r][j.capturedPiece.c] = 0;

            // Check if promoted. If promoted, sequence ends immediately (no multi-jump on promotion row)
            let promoted = false;
            if (piece === 1 && j.r === 0) promoted = true;
            if (piece === -1 && j.r === 7) promoted = true;

            if (promoted) {
                sequences.push([j]);
            } else {
                const subSequences = getPieceJumpSequences(j.r, j.c, nextBoard);
                let addedSub = false;
                for (const subSeq of subSequences) {
                    if (subSeq.length > 0) {
                        sequences.push([j, ...subSeq]);
                        addedSub = true;
                    }
                }
                if (!addedSub) {
                    sequences.push([j]);
                }
            }
        }
        return sequences;
    }

    function scanMandatoryCaptures() {
        mandatoryCaptures = [];
        if (!board || !Array.isArray(board) || board.length < 8) return;
        
        const longestCapture = localStorage.getItem('damma-rule-longest-capture') !== 'false';
        const multiCapture = localStorage.getItem('damma-rule-multi-capture') !== 'false';

        // 1. Gather all sequences
        const allSequences = [];
        if (multiJumpPiece) {
            const seqs = getPieceJumpSequences(multiJumpPiece.r, multiJumpPiece.c, board);
            seqs.forEach(seq => {
                if (seq && seq.length > 0) {
                    allSequences.push({
                        fromR: multiJumpPiece.r,
                        fromC: multiJumpPiece.c,
                        seq: seq
                    });
                }
            });
        } else {
            for (let r = 0; r < 8; r++) {
                if (!board[r]) continue;
                for (let c = 0; c < 8; c++) {
                    if (board[r][c] !== undefined && Math.sign(board[r][c]) === turn) {
                        const seqs = getPieceJumpSequences(r, c, board);
                        seqs.forEach(seq => {
                            if (seq && seq.length > 0) {
                                allSequences.push({
                                    fromR: r,
                                    fromC: c,
                                    seq: seq
                                });
                            }
                        });
                    }
                }
            }
        }

        if (allSequences.length === 0) return;

        // 2. Find max sequence length
        let maxLen = 0;
        if (longestCapture) {
            allSequences.forEach(item => {
                if (item && item.seq && item.seq.length > maxLen) {
                    maxLen = item.seq.length;
                }
            });
        } else {
            maxLen = 1; // Standard mandatory capture just needs any sequence
        }

        // 3. Keep only the first jump of sequences that have length >= maxLen
        const added = new Set();
        allSequences.forEach(item => {
            if (item && item.seq && item.seq.length > 0 && (!longestCapture || item.seq.length === maxLen)) {
                const firstJump = item.seq[0];
                if (firstJump) {
                    const key = `${item.fromR},${item.fromC}->${firstJump.r},${firstJump.c}`;
                    if (!added.has(key)) {
                        added.add(key);
                        mandatoryCaptures.push({
                            fromR: item.fromR,
                            fromC: item.fromC,
                            toR: firstJump.r,
                            toC: firstJump.c,
                            capturedPiece: firstJump.capturedPiece,
                            maxLength: item.seq.length
                        });
                    }
                }
            }
        });
    }

    function isForceCaptureEnabled() {
        return localStorage.getItem('damma-rule-mandatory-capture') !== 'false';
    }

    // Get available diagonal jump captures for a single piece based on selected rule (Egregna or Toregna)
    function getPieceJumps(r, c, customBoard = board) {
        const jumps = [];
        if (!customBoard || !customBoard[r] || customBoard[r][c] === undefined) return jumps;
        const pieceType = customBoard[r][c];
        if (pieceType === 0) return jumps;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);
        const selectedRule = localStorage.getItem('damma-selected-rule') || 'egregna';

        if (isKing && selectedRule === 'toregna') {
            // Flying Kings in Toregna: capture from any distance along clear diagonal path, landing on first empty square after captured piece
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                let searchR = r + dr;
                let searchC = c + dc;
                while (searchR >= 0 && searchR < 8 && searchC >= 0 && searchC < 8) {
                    const cell = customBoard[searchR][searchC];
                    if (cell === 0) {
                        searchR += dr;
                        searchC += dc;
                    } else {
                        if (Math.sign(cell) === -playerSign) {
                            const landingR = searchR + dr;
                            const landingC = searchC + dc;
                            if (landingR >= 0 && landingR < 8 && landingC >= 0 && landingC < 8) {
                                if (customBoard[landingR][landingC] === 0) {
                                    jumps.push({
                                        r: landingR,
                                        c: landingC,
                                        capturedPiece: { r: searchR, c: searchC }
                                    });
                                }
                            }
                        }
                        break;
                    }
                }
            }
        } else {
            // Standard short-range diagonal jumps (Normal pieces in both rules, and Kings in Egregna)
            const dirs = isKing 
                ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                : (playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

            for (const [dr, dc] of dirs) {
                const midR = r + dr;
                const midC = c + dc;
                const targetR = r + dr * 2;
                const targetC = c + dc * 2;

                if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                    const targetCell = customBoard[targetR][targetC];
                    const midCell = customBoard[midR][midC];

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

    // Get standard diagonal moves (distance = 1 for normal pieces / Egregna Kings, multi-range for Toregna Flying Kings)
    function getPieceNormalMoves(r, c, customBoard = board) {
        const moves = [];
        if (!customBoard || !customBoard[r] || customBoard[r][c] === undefined) return moves;
        const pieceType = customBoard[r][c];
        if (pieceType === 0) return moves;

        const isKing = Math.abs(pieceType) === 2;
        const playerSign = Math.sign(pieceType);
        const selectedRule = localStorage.getItem('damma-selected-rule') || 'egregna';

        if (isKing && selectedRule === 'toregna') {
            // Flying Kings in Toregna: move any number of empty diagonal squares
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
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
            // 1 diagonal square for normal pieces (forward only) and Egregna Kings (all 4 directions)
            const dirs = isKing 
                ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                : (playerSign === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);

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
        if (isCpuThinking || turn === 1 || isTerminated || (typeof PauseManager !== 'undefined' && PauseManager.isPaused)) return;
        isCpuThinking = true;
        updateHUD();

        // 600ms-1200ms thinking delay to feel realistic and organic
        const thinkingTime = gameStateManager.difficulty === 'easy' ? 500 : (gameStateManager.difficulty === 'medium' ? 800 : 1200);

        setTimeout(() => {
            if (isTerminated || (typeof PauseManager !== 'undefined' && PauseManager.isPaused)) {
                isCpuThinking = false;
                return;
            }
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

        // Custom AI Ply depth override
        const depthVal = localStorage.getItem('damma-ai-thinking-depth') || 'normal';
        let depth = 2;
        if (depthVal === 'fast') depth = 1;
        else if (depthVal === 'normal') depth = 2;
        else if (depthVal === 'deep_thinking') depth = 4;
        else if (depthVal === 'expert_search') depth = 6;
        else {
            depth = gameStateManager.difficulty === 'medium' ? 2 : 4;
        }

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
        const personality = localStorage.getItem('damma-ai-personality') || 'balanced';

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const val = currBoard[r][c];
                let pieceVal = 0;
                let kingVal = 0;
                let centerBonus = 0;
                let backRowBonus = 0;

                if (personality === 'aggressive') {
                    pieceVal = 12;
                    kingVal = 22;
                    centerBonus = 2.5;
                } else if (personality === 'defensive') {
                    pieceVal = 10;
                    kingVal = 16;
                    centerBonus = 0.5;
                    backRowBonus = 4.0;
                } else if (personality === 'unpredictable') {
                    pieceVal = 10 + (Math.random() * 2 - 1);
                    kingVal = 18 + (Math.random() * 4 - 2);
                    centerBonus = 1.0;
                } else { // balanced
                    pieceVal = 10;
                    kingVal = 18;
                    centerBonus = 1.5;
                }

                if (val === -1) {
                    score += pieceVal; // CPU regular
                    score += r * 0.5; // Encourages advancing forward
                    if (r === 0 && personality === 'defensive') {
                        score += backRowBonus; // Keep CPU pieces on the CPU's back row (r=0)
                    }
                } else if (val === -2) {
                    score += kingVal; // CPU King
                } else if (val === 1) {
                    score -= pieceVal; // Player regular
                    score -= (7 - r) * 0.5; // Encourages player advancing (evaluated as bad for CPU)
                    if (r === 7 && personality === 'defensive') {
                        score -= backRowBonus; // Dislikes player occupying back row
                    }
                } else if (val === 2) {
                    score -= kingVal; // Player King
                }
                
                // Slight bonus for occupying center board rows (3,4) to make AI play smart
                if ((val !== 0) && (r === 3 || r === 4) && (c >= 2 && c <= 5)) {
                    score += Math.sign(val) * centerBonus;
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

            piecesCaptured++;
            SoundSystem.play('capture');
        } else {
            SoundSystem.play('move');
        }

        // King Promotion Check
        if (pieceType === 1 && toR === 0) {
            board[toR][toC] = 2; // Blue King promoted
            promoted = true;
            kingsCreated++;
            SoundSystem.play('king');
        } else if (pieceType === -1 && toR === 7) {
            board[toR][toC] = -2; // Pink King promoted
            promoted = true;
            kingsCreated++;
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
        const multiCapture = localStorage.getItem('damma-rule-multi-capture') !== 'false';
        if (isJump && !promoted && multiCapture) {
            const extraJumps = getPieceJumps(toR, toC);
            if (extraJumps.length > 0) {
                // Yes! Locked into multi-jump for this specific piece
                multiJumpPiece = { r: toR, c: toC };
                scanMandatoryCaptures();
                updateHUD();
                
                if (gameStateManager.gameMode === 'online') {
                    const roomId = getCurrentOnlineRoomId();
                    if (roomId) {
                        sendOnlineMove(roomId, board, p1Count, p2Count, turn, totalMoves, null, null);
                    }
                }

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
        let isGameOver = false;
        let gameOverWinner = 0; // 1 = P1, -1 = P2
        let winReason = null;

        if (p1Count === 0) {
            isGameOver = true;
            gameOverWinner = -1; // P2 wins
            winReason = 'capture';
        } else if (p2Count === 0) {
            isGameOver = true;
            gameOverWinner = 1; // P1 wins
            winReason = 'capture';
        } else {
            // Check if active player has any legal moves
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
                isGameOver = true;
                gameOverWinner = -turn; // Opponent wins
                winReason = 'no_moves';
            }
        }

        // If ONLINE mode, sync move state (including win/ended status) to Firestore
        if (gameStateManager.gameMode === 'online') {
            const roomId = getCurrentOnlineRoomId();
            if (roomId) {
                let winnerUid = null;
                if (isGameOver) {
                    winnerUid = gameOverWinner === 1 ? 'p1' : 'p2';
                }
                sendOnlineMove(roomId, board, p1Count, p2Count, turn, totalMoves, winnerUid, winReason);
            }
        }

        if (isGameOver) {
            endGame(
                gameOverWinner, 
                winReason === 'capture' 
                    ? (gameOverWinner === 1 ? "Player 1 captures all pieces!" : "Player 2 captures all pieces!")
                    : "No moves left for opponent!"
            );
            return;
        }

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

        if (gameStateManager.gameMode === 'online') {
            // Online mode handles game over display & rating updates via room listener in onlineUI.ts
            return;
        }

        // Stop any previous game over animation
        if (typeof cleanupGameOverCanvas === 'function') {
            cleanupGameOverCanvas();
            cleanupGameOverCanvas = null;
        }

        const mode = gameStateManager.gameMode;
        const difficulty = gameStateManager.difficulty;

        const screenEl = document.getElementById('game-over-screen');
        const badgeIconEl = document.getElementById('gameover-badge-icon');
        const titleTextEl = document.getElementById('gameover-title-text');
        const subtitleTextEl = document.getElementById('gameover-subtitle-text');
        const modeTagEl = document.getElementById('gameover-mode-tag');
        const diffTagEl = document.getElementById('gameover-diff-tag');

        if (!screenEl) return;

        // Clean up previous result classes
        screenEl.classList.remove('win-cpu', 'lose-cpu', 'win-p1', 'win-p2', 'draw', 'shake-anim');

        const isVsCpu = (mode === 'vs-cpu');
        
        // Dynamic game mode tag
        if (modeTagEl) {
            modeTagEl.textContent = isVsCpu ? t('vs_cpu', 'VS CPU') : t('two_players', '2 PLAYERS');
        }

        // Dynamic difficulty tag
        if (diffTagEl) {
            if (isVsCpu) {
                diffTagEl.style.display = 'inline-flex';
                diffTagEl.textContent = t(difficulty, difficulty.toUpperCase());
            } else {
                diffTagEl.style.display = 'none';
            }
        }

        // Determine result outcomes, sounds, titles, and styles
        if (winner === 0) {
            SoundSystem.play('win'); // Plays standard success tone for draw
            if (titleTextEl) titleTextEl.textContent = t('draw_title', "IT'S A DRAW!");
            if (subtitleTextEl) subtitleTextEl.textContent = t('draw_subtitle', "Well Played!");
            if (badgeIconEl) badgeIconEl.textContent = "🤝";
            screenEl.classList.add('draw');
        } else if (winner === 1) {
            SoundSystem.play('win');
            const metaStr = localStorage.getItem('damma-active-daily-meta');
            const meta = activeDailyMeta || (metaStr ? JSON.parse(metaStr) : null);
            if (meta && meta.dailyId && meta.todayStr) {
                localStorage.setItem(`damma-daily-${meta.todayStr}-${meta.dailyId}`, 'true');
                localStorage.removeItem('damma-active-daily-meta');
                localStorage.removeItem('damma-active-daily-challenge');
                activeDailyMeta = null;
                DailyChallengeSystem.showSuccessModal(meta);
                return;
            }
            if (isVsCpu) {
                if (titleTextEl) titleTextEl.textContent = t('you_win', "🏆 YOU WIN!");
                if (subtitleTextEl) subtitleTextEl.textContent = t('you_win_subtitle', "Congratulations! You defeated the AI.");
                if (badgeIconEl) badgeIconEl.textContent = "🏆";
                screenEl.classList.add('win-cpu');
            } else {
                const p1Name = t('player1_label', 'PLAYER 1');
                if (titleTextEl) titleTextEl.textContent = t('p1_win_title', "{name} WINS!").replace('{name}', p1Name);
                if (subtitleTextEl) subtitleTextEl.textContent = t('congrats_p1', "Congratulations to Player 1!");
                if (badgeIconEl) badgeIconEl.textContent = "👑";
                screenEl.classList.add('win-p1');
            }
        } else {
            if (isVsCpu) {
                SoundSystem.play('lose');
                if (titleTextEl) titleTextEl.textContent = t('cpu_win_title', "CPU WINS");
                if (subtitleTextEl) subtitleTextEl.textContent = t('cpu_win_subtitle', "Better luck next time!");
                if (badgeIconEl) badgeIconEl.textContent = "💀";
                screenEl.classList.add('lose-cpu');
                
                if (localStorage.getItem('damma-access-reduced-motion') !== 'true') {
                    screenEl.classList.add('shake-anim');
                }
            } else {
                SoundSystem.play('win');
                const p2Name = t('player2_label', 'PLAYER 2');
                if (titleTextEl) titleTextEl.textContent = t('p2_win_title', "{name} WINS!").replace('{name}', p2Name);
                if (subtitleTextEl) subtitleTextEl.textContent = t('congrats_p2', "Congratulations to Player 2!");
                if (badgeIconEl) badgeIconEl.textContent = "👑";
                screenEl.classList.add('win-p2');
            }
        }

        const diffMs = Date.now() - startTime;

        // Transition screen
        gameStateManager.showScreen('game-over-screen');

        // Start premium high performance particle systems
        cleanupGameOverCanvas = startGameOverCanvasAnimation(winner, mode, difficulty);

        terminate();
    }


    // ==========================================
    // 🎨 RENDER PIPELINE (CANVAS DRAWINGS)
    // ==========================================

    function render() {
        if (isTerminated || !board || !Array.isArray(board) || board.length < 8) return;

        // Clear Screen with beautiful table vignette matching active color theme
        let innerBg = '#1e110a';
        let outerBg = '#0c0603';
        const activeTheme = document.documentElement.getAttribute('data-theme') || 
                            (document.body ? document.body.getAttribute('data-theme') : 'dark');

        if (activeTheme === 'light') {
            innerBg = '#fbf5eb';
            outerBg = '#d8c8b2';
        } else if (activeTheme === 'royal') {
            innerBg = '#1e173b';
            outerBg = '#080612';
        } else if (activeTheme === 'emerald') {
            innerBg = '#103826';
            outerBg = '#030d08';
        }

        const screenGrad = ctx.createRadialGradient(
            width / 2, height / 2, Math.min(width, height) * 0.1,
            width / 2, height / 2, Math.max(width, height) * 0.8
        );
        screenGrad.addColorStop(0, innerBg);
        screenGrad.addColorStop(1, outerBg);
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
        const boardTheme = localStorage.getItem('damma-board-theme') || 'traditional_wood';
        let darkCellGrad1 = '#361c0e', darkCellGrad2 = '#241005';
        let lightCellGrad1 = '#dfc19c', lightCellGrad2 = '#cdab83';

        if (boardTheme === 'traditional_wood') {
            darkCellGrad1 = '#5c3818'; darkCellGrad2 = '#38200c';
            lightCellGrad1 = '#dfc19c'; lightCellGrad2 = '#cdab83';
        } else if (boardTheme === 'dark_wood') {
            darkCellGrad1 = '#2a1708'; darkCellGrad2 = '#150b04';
            lightCellGrad1 = '#a67c52'; lightCellGrad2 = '#8c6239';
        } else if (boardTheme === 'mahogany') {
            darkCellGrad1 = '#44100b'; darkCellGrad2 = '#2b0a07';
            lightCellGrad1 = '#c47b6a'; lightCellGrad2 = '#a95a4a';
        } else if (boardTheme === 'marble') {
            darkCellGrad1 = '#2c3e50'; darkCellGrad2 = '#1a252f';
            lightCellGrad1 = '#ecf0f1'; lightCellGrad2 = '#bdc3c7';
        } else if (boardTheme === 'green_felt') {
            darkCellGrad1 = '#134e0a'; darkCellGrad2 = '#0a2e05';
            lightCellGrad1 = '#2ecc71'; lightCellGrad2 = '#27ae60';
        } else if (boardTheme === 'black_minimal') {
            darkCellGrad1 = '#000000'; darkCellGrad2 = '#111111';
            lightCellGrad1 = '#2c3e50'; lightCellGrad2 = '#34495e';
        } else if (boardTheme === 'white_minimal') {
            darkCellGrad1 = '#bdc3c7'; darkCellGrad2 = '#95a5a6';
            lightCellGrad1 = '#ffffff'; lightCellGrad2 = '#f5f6fa';
        } else if (boardTheme === 'royal_gold') {
            darkCellGrad1 = '#8a640f'; darkCellGrad2 = '#543b05';
            lightCellGrad1 = '#f7f1e3'; lightCellGrad2 = '#dcdde1';
        } else if (boardTheme === 'ancient_ethiopia') {
            darkCellGrad1 = '#4b2413'; darkCellGrad2 = '#32160b';
            lightCellGrad1 = '#e5b842'; lightCellGrad2 = '#c69c35';
        } else if (boardTheme === 'coffee_house') {
            darkCellGrad1 = '#4e3629'; darkCellGrad2 = '#2a1b14';
            lightCellGrad1 = '#d2b48c'; lightCellGrad2 = '#c3a175';
        } else if (boardTheme === 'axumit') {
            darkCellGrad1 = '#340e11'; darkCellGrad2 = '#1d0406';
            lightCellGrad1 = '#d4af37'; lightCellGrad2 = '#b89025';
        } else if (boardTheme === 'night_mode') {
            darkCellGrad1 = '#111118'; darkCellGrad2 = '#050508';
            lightCellGrad1 = '#222538'; lightCellGrad2 = '#191c2b';
        } else if (boardTheme === 'emerald_valley') {
            darkCellGrad1 = '#0f4c3a'; darkCellGrad2 = '#072e22';
            lightCellGrad1 = '#a8e6cf'; lightCellGrad2 = '#dcedc1';
        } else if (boardTheme === 'imperial_crimson') {
            darkCellGrad1 = '#6b111c'; darkCellGrad2 = '#3a0208';
            lightCellGrad1 = '#f9d5d5'; lightCellGrad2 = '#eeb9b9';
        } else if (boardTheme === 'obsidian_ash') {
            darkCellGrad1 = '#1f1f1f'; darkCellGrad2 = '#0d0d0d';
            lightCellGrad1 = '#b2bec3'; lightCellGrad2 = '#636e72';
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const x = boardX + c * cellSize;
                const y = boardY + r * cellSize;
                const isDarkCell = (r + c) % 2 === 1;

                ctx.save();
                
                if (isDarkCell) {
                    // Dark Mahogany Wood Cell
                    const cellGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    cellGrad.addColorStop(0, darkCellGrad1);
                    cellGrad.addColorStop(1, darkCellGrad2);
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
                    cellGrad.addColorStop(0, lightCellGrad1);
                    cellGrad.addColorStop(1, lightCellGrad2);
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
        const highlightForced = localStorage.getItem('damma-rule-highlight-forced') !== 'false';
        if (highlightForced && isForceCaptureEnabled() && (turn === 1 || gameStateManager.gameMode !== 'vs-cpu')) {
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

        // 4.5. Show Move Hints ON/OFF (Subtle golden dashed rings around all pieces with legal moves)
        const showHints = localStorage.getItem('damma-rule-show-hints') !== 'false';
        if (showHints && (turn === 1 || gameStateManager.gameMode !== 'vs-cpu')) {
            ctx.save();
            ctx.lineWidth = 2.0;
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.45)'; // Subtle gold
            ctx.setLineDash([4, 4]); // Dashed circle
            for (let r = 0; r < 8; r++) {
                if (!board[r]) continue;
                for (let c = 0; c < 8; c++) {
                    if (board[r][c] !== undefined && Math.sign(board[r][c]) === turn) {
                        let hasMove = false;
                        if (isForceCaptureEnabled() && mandatoryCaptures.length > 0) {
                            hasMove = mandatoryCaptures.some(m => m.fromR === r && m.fromC === c);
                        } else {
                            hasMove = getPieceJumps(r, c).length > 0 || getPieceNormalMoves(r, c).length > 0;
                        }

                        if (hasMove) {
                            const cx = boardX + c * cellSize + cellSize / 2;
                            const cy = boardY + r * cellSize + cellSize / 2;
                            ctx.beginPath();
                            ctx.arc(cx, cy, cellSize * 0.43, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                }
            }
            ctx.restore();
        }

        // 5. Render Valid moves destinations (warm colors instead of harsh neon)
        const showLegal = localStorage.getItem('damma-rule-show-legal') !== 'false';
        if (showLegal) {
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
        }

        // 6. Draw actual Game Pieces (Premium traditional wooden and gemstone materials)
        for (let r = 0; r < 8; r++) {
            if (!board[r]) continue;
            for (let c = 0; c < 8; c++) {
                const val = board[r][c];
                if (val !== 0 && val !== undefined) {
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

        // Draw Board Coordinates Grid Labels (A1 to H8) around the board edge
        const showCoordinates = localStorage.getItem('damma-gameplay-coordinates') !== 'false';
        if (showCoordinates) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 248, 230, 0.65)';
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const rowNums = ['8', '7', '6', '5', '4', '3', '2', '1'];
            
            for (let i = 0; i < 8; i++) {
                const cellCenter = i * cellSize + cellSize / 2;
                ctx.fillText(colLetters[i], boardX + cellCenter, boardY - framePadding / 2);
                ctx.fillText(colLetters[i], boardX + cellCenter, boardY + boardSize + framePadding / 2);
                ctx.fillText(rowNums[i], boardX - framePadding / 2, boardY + cellCenter);
                ctx.fillText(rowNums[i], boardX + boardSize + framePadding / 2, boardY + cellCenter);
            }
            ctx.restore();
        }

        // Calculate and Draw real-time FPS Counter
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdateTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (now - lastFpsUpdateTime));
            frameCount = 0;
            lastFpsUpdateTime = now;
        }

        const showFps = localStorage.getItem('damma-gameplay-fps-counter') === 'true';
        if (showFps) {
            ctx.save();
            ctx.fillStyle = 'rgba(46, 204, 113, 0.85)';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`FPS: ${fps}`, width - 15, 20);
            ctx.restore();
        }

        animationId = requestAnimationFrame(render);
    }

    // ==========================================
    // 🔘 TOUCH CONTROLS AND INPUT HANDLERS
    // ==========================================

    function handleInteraction(clientX, clientY) {
        if (isCpuThinking || isTerminated || (typeof PauseManager !== 'undefined' && PauseManager.isPaused)) return;

        if (gameStateManager.gameMode === 'online') {
            if (myOnlineRole !== null && turn !== myOnlineRole) {
                return; // Ignore board clicks if it's the opponent's turn in online match
            }
        }

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
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('touchstart', onTouchStart);
        if (animationId) cancelAnimationFrame(animationId);
    }

    // EXPORT CORE ACTIONS FOR THE STATE MANAGER
    return {
        syncOnlineBoard(newBoard, newTurn, myRole) {
            if (myRole !== undefined && myRole !== null) {
                myOnlineRole = myRole;
            }
            if (newBoard && Array.isArray(newBoard) && newBoard.length === 8) {
                board = newBoard.map(row => [...row]);
                turn = newTurn;
                let p1 = 0, p2 = 0;
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (board[r][c] > 0) p1++;
                        else if (board[r][c] < 0) p2++;
                    }
                }
                p1Count = p1;
                p2Count = p2;
                selectedPiece = null;
                validMoves = [];
                scanMandatoryCaptures();
                updateHUD();
                render();
            }
        },
        checkCpuTurn() {
            if (turn === -1 && gameStateManager.gameMode === 'vs-cpu') {
                cpuMakeDecision();
            }
        },
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
window.createGame = createGame;

// ==========================================
// 🎉 GAME OVER SCREENS REDESIGN HELPERS
// ==========================================

function startGameOverCanvasAnimation(winner, mode, difficulty) {
    const canvas = document.getElementById('gameover-canvas');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animationsDisabled = localStorage.getItem('damma-access-reduced-motion') === 'true';

    let particles = [];
    let fireworks = [];
    let frames = 0;
    let gameOverAnimationId = null;

    const random = (min, max) => Math.random() * (max - min) + min;

    const isPlayerCpuWin = (winner === 1 && mode === 'vs-cpu');
    const isCpuWin = (winner === -1 && mode === 'vs-cpu');
    const isP1Win = (winner === 1 && mode !== 'vs-cpu');
    const isP2Win = (winner === -1 && mode !== 'vs-cpu');
    const isDraw = (winner === 0);

    class Particle {
        constructor(type) {
            this.type = type; // 'confetti', 'spark', 'flame', 'particle', 'star'
            this.x = random(0, canvas.width);
            
            if (type === 'confetti') {
                this.y = random(-100, -10);
                this.vx = random(-2, 2);
                this.vy = random(2, 5);
                this.size = random(6, 12);
                this.color = this.getRandomConfettiColor();
                this.rotation = random(0, Math.PI * 2);
                this.rotationSpeed = random(-0.1, 0.1);
                this.wobble = random(0, Math.PI * 2);
                this.wobbleSpeed = random(0.02, 0.05);
            } else if (type === 'flame') {
                this.x = random(canvas.width / 2 - 180, canvas.width / 2 + 180);
                this.y = random(canvas.height / 2 + 30, canvas.height / 2 + 130);
                this.vx = random(-1, 1);
                this.vy = random(-1.5, -0.4);
                this.size = random(8, 16);
                this.color = `rgba(${Math.floor(random(220, 255))}, ${Math.floor(random(50, 100))}, ${Math.floor(random(0, 30))}, 0.55)`;
                this.life = 0;
                this.maxLife = random(30, 60);
            } else if (type === 'particle') {
                this.x = random(0, canvas.width);
                this.y = random(canvas.height + 10, canvas.height + 40);
                this.vx = random(-0.4, 0.4);
                this.vy = random(-1.2, -0.3);
                this.size = random(1.5, 4);
                this.color = this.getThemeColor();
                this.life = 0;
                this.maxLife = random(120, 220);
            } else if (type === 'star') {
                this.x = random(0, canvas.width);
                this.y = random(0, canvas.height);
                this.vx = 0;
                this.vy = 0;
                this.size = random(1, 2.5);
                this.alpha = random(0.1, 0.8);
                this.alphaSpeed = random(0.004, 0.015);
            }
        }

        getRandomConfettiColor() {
            if (isP1Win) {
                return `hsl(${random(195, 225)}, 90%, ${random(50, 70)}%)`;
            } else if (isP2Win) {
                return `hsl(${random(105, 135)}, 90%, ${random(40, 60)}%)`;
            } else {
                const colors = ['#ffd700', '#ffc107', '#ffeb3b', '#ffa500', '#ffffff', '#b8860b'];
                return colors[Math.floor(Math.random() * colors.length)];
            }
        }

        getThemeColor() {
            if (isPlayerCpuWin) return `rgba(255, 215, 0, ${random(0.35, 0.75)})`;
            if (isCpuWin) return `rgba(230, 57, 70, ${random(0.35, 0.75)})`;
            if (isP1Win) return `rgba(59, 130, 246, ${random(0.35, 0.75)})`;
            if (isP2Win) return `rgba(34, 197, 94, ${random(0.35, 0.75)})`;
            return `rgba(6, 182, 212, ${random(0.35, 0.75)})`;
        }

        update() {
            if (this.type === 'confetti') {
                this.y += this.vy;
                this.x += this.vx + Math.sin(this.wobble) * 0.4;
                this.rotation += this.rotationSpeed;
                this.wobble += this.wobbleSpeed;
                if (this.y > canvas.height) {
                    this.y = -10;
                    this.x = random(0, canvas.width);
                }
            } else if (this.type === 'flame') {
                this.y += this.vy;
                this.x += this.vx;
                this.size -= 0.15;
                this.life++;
                if (this.size < 0) this.size = 0;
            } else if (this.type === 'particle') {
                this.y += this.vy;
                this.x += this.vx;
                this.life++;
                if (this.y < -10) {
                    this.y = canvas.height + random(10, 30);
                    this.x = random(0, canvas.width);
                }
            } else if (this.type === 'star') {
                this.alpha += this.alphaSpeed;
                if (this.alpha > 1 || this.alpha < 0.1) {
                    this.alphaSpeed = -this.alphaSpeed;
                }
            }
        }

        draw() {
            ctx.save();
            if (this.type === 'confetti') {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size / 2);
            } else if (this.type === 'flame') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalCompositeOperation = 'screen';
                ctx.fill();
            } else if (this.type === 'particle') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            } else if (this.type === 'star') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.fill();
            }
            ctx.restore();
        }
    }

    class Firework {
        constructor() {
            this.x = random(canvas.width * 0.15, canvas.width * 0.85);
            this.y = canvas.height;
            this.targetY = random(canvas.height * 0.15, canvas.height * 0.4);
            this.vy = random(-7, -11);
            this.size = 2.5;
            this.color = isP1Win ? '#3b82f6' : (isP2Win ? '#22c55e' : '#ffd700');
            this.exploded = false;
            this.particles = [];
        }

        update() {
            if (!this.exploded) {
                this.y += this.vy;
                if (this.y <= this.targetY) {
                    this.exploded = true;
                    this.explode();
                }
            } else {
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.05; // gravity
                    p.life--;
                    if (p.life <= 0) {
                        this.particles.splice(i, 1);
                    }
                }
            }
        }

        explode() {
            if (animationsDisabled) return;
            const count = random(35, 55);
            for (let i = 0; i < count; i++) {
                const angle = random(0, Math.PI * 2);
                const speed = random(1.2, 4.5);
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: this.color,
                    size: random(1.2, 2.5),
                    life: random(30, 50)
                });
            }
        }

        draw() {
            if (!this.exploded) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
            } else {
                this.particles.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fill();
                });
            }
        }
    }

    const starCount = animationsDisabled ? 10 : 35;
    for (let i = 0; i < starCount; i++) {
        particles.push(new Particle('star'));
    }

    if (!isCpuWin && !animationsDisabled) {
        const confettiCount = isDraw ? 10 : 70;
        for (let i = 0; i < confettiCount; i++) {
            particles.push(new Particle('confetti'));
        }
    }

    const floatingCount = animationsDisabled ? 8 : 25;
    for (let i = 0; i < floatingCount; i++) {
        particles.push(new Particle('particle'));
    }

    const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frames++;

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        if (isCpuWin && !animationsDisabled) {
            if (frames % 2 === 0) {
                particles.push(new Particle('flame'));
            }
            particles = particles.filter(p => p.type !== 'flame' || p.life < p.maxLife);
        }

        if ((isPlayerCpuWin || isP1Win || isP2Win) && !animationsDisabled) {
            if (frames % 80 === 0 && fireworks.length < 3) {
                fireworks.push(new Firework());
            }
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const fw = fireworks[i];
                fw.update();
                fw.draw();
                if (fw.exploded && fw.particles.length === 0) {
                    fireworks.splice(i, 1);
                }
            }
        }

        gameOverAnimationId = requestAnimationFrame(loop);
    };

    loop();

    const cleanup = () => {
        window.removeEventListener('resize', resizeCanvas);
        if (gameOverAnimationId) {
            cancelAnimationFrame(gameOverAnimationId);
            gameOverAnimationId = null;
        }
    };

    return cleanup;
}

// ==========================================================================
// ⚙️ COMPREHENSIVE SYSTEM CONFIGURATION & BINDINGS
// ==========================================================================

const AmbientSynth = {
    intervalId: null,
    isPlaying: false,
    currentStep: 0,
    // Pentatonic scale degrees approx C Major pentatonic (C, D, E, G, A)
    scale: [
        130.81, // C3
        146.83, // D3
        164.81, // E3
        196.00, // G3
        220.00, // A3
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
        659.25, // E5
        783.99, // G5
        880.00  // A5
    ],
    // Rhythmic, authentic Tizita melody sequence
    melody: [
        5, 6, 7, 9, 8, 7, 6, 5,
        4, 5, 6, 7, 5, 4, 2, 4,
        5, 7, 9, 10, 9, 7, 6, 7,
        5, 6, 4, 2, 1, 2, 4, 5
    ],

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentStep = 0;
        
        // Schedule steps every 600ms (100 BPM)
        this.intervalId = setInterval(() => {
            const enabled = localStorage.getItem('damma-sfx-ambient-enabled') !== 'false';
            const muteAll = localStorage.getItem('damma-audio-mute-all') === 'true';
            if (enabled && !muteAll && SoundSystem.ctx) {
                try {
                    if (SoundSystem.ctx.state === 'suspended') {
                        SoundSystem.ctx.resume();
                    }
                    this.playStep();
                } catch (e) {
                    // Fail-safe
                }
            }
        }, 600);
    },

    playStep() {
        const now = SoundSystem.ctx.currentTime;
        
        const masterVol = parseFloat(localStorage.getItem('damma-master-volume') ?? '80') / 100;
        const musicVol = parseFloat(localStorage.getItem('damma-music-volume') ?? '50') / 100;
        const volumeScale = masterVol * musicVol * 0.08; // quiet traditional music background

        if (volumeScale <= 0) return;

        const noteIndex = this.melody[this.currentStep % this.melody.length];
        const freq = this.scale[noteIndex];
        
        // Main string pluck note
        this.playPluck(freq, volumeScale, now, 'triangle', 0.6);
        
        // Accent resonance note (soft double)
        if (this.currentStep % 4 === 0) {
            const harmonyIndex = noteIndex - 3 >= 0 ? noteIndex - 3 : 0;
            const harmonyFreq = this.scale[harmonyIndex];
            this.playPluck(harmonyFreq, volumeScale * 0.4, now, 'sine', 0.4);
        }

        this.currentStep++;
    },

    playPluck(freq, volume, time, oscType = 'triangle', decay = 0.6) {
        if (!SoundSystem.ctx) return;
        const osc = SoundSystem.ctx.createOscillator();
        const gain = SoundSystem.ctx.createGain();
        const filter = SoundSystem.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.Q.setValueAtTime(1, time);

        osc.connect(gain);
        gain.connect(filter);
        filter.connect(SoundSystem.ctx.destination);

        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, time);

        // Exponential decay envelope simulating real plucked string resonance
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

        // Add subtle vibrato for acoustic feel
        osc.frequency.linearRampToValueAtTime(freq + (Math.random() * 2 - 1), time + decay);

        osc.start(time);
        osc.stop(time + decay + 0.1);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isPlaying = false;
    }
};

// ==========================================================================
// ⏸️ GAME PAUSE SYSTEM HANDLER
// ==========================================================================
const PauseManager = {
    isPaused: false,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Keyboard shortcut (Escape key)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
                if (gameStateManager.currentScreen === 'gameplay-screen') {
                    if (this.isPaused) {
                        this.resumeGame();
                    } else {
                        this.pauseGame();
                    }
                }
            }
        });

        // HUD Pause & Back buttons open pause menu
        const pauseBtn = document.getElementById('hud-pause-btn');
        const backBtn = document.getElementById('hud-back-btn');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.pauseGame();
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.pauseGame();
            });
        }

        // Resume Game button
        const resumeBtn = document.getElementById('pause-resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.resumeGame();
            });
        }

        // Restart Game button -> shows confirmation
        const restartBtn = document.getElementById('pause-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.showConfirm('restart');
            });
        }

        // Back to Main Menu button -> shows confirmation
        const menuBtn = document.getElementById('pause-main-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.showConfirm('menu');
            });
        }

        // Settings button -> opens settings modal without closing current game
        const settingsBtn = document.getElementById('pause-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                const settingsModal = document.getElementById('settings-modal');
                if (settingsModal) {
                    if (typeof loadAllSettingsIntoUI === 'function') loadAllSettingsIntoUI();
                    settingsModal.classList.add('active');
                }
            });
        }

        // Confirmation Yes/No buttons
        const menuYes = document.getElementById('pause-confirm-menu-yes');
        const menuNo = document.getElementById('pause-confirm-menu-no');

        if (menuYes) {
            menuYes.addEventListener('click', () => {
                SoundSystem.play('click');
                this.hideConfirm();
                this.closePauseModal();
                this.isPaused = false;
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.terminate();
                }
                localStorage.removeItem('damma-saved-game');
                gameStateManager.showScreen('main-menu');
            });
        }

        if (menuNo) {
            menuNo.addEventListener('click', () => {
                SoundSystem.play('click');
                this.hideConfirm();
            });
        }

        const restartYes = document.getElementById('pause-confirm-restart-yes');
        const restartNo = document.getElementById('pause-confirm-restart-no');

        if (restartYes) {
            restartYes.addEventListener('click', () => {
                SoundSystem.play('click');
                this.hideConfirm();
                this.closePauseModal();
                this.isPaused = false;
                if (gameStateManager.activeGameInstance) {
                    gameStateManager.activeGameInstance.restart();
                }
            });
        }

        if (restartNo) {
            restartNo.addEventListener('click', () => {
                SoundSystem.play('click');
                this.hideConfirm();
            });
        }
    },

    pauseGame() {
        if (gameStateManager.currentScreen !== 'gameplay-screen') return;
        this.isPaused = true;
        this.hideConfirm();
        const modal = document.getElementById('pause-modal');
        if (modal) modal.classList.add('active');
    },

    resumeGame() {
        this.isPaused = false;
        this.hideConfirm();
        this.closePauseModal();
        if (gameStateManager.activeGameInstance && typeof gameStateManager.activeGameInstance.checkCpuTurn === 'function') {
            gameStateManager.activeGameInstance.checkCpuTurn();
        }
    },

    closePauseModal() {
        const modal = document.getElementById('pause-modal');
        if (modal) modal.classList.remove('active');
    },

    showConfirm(type) {
        const actionsDiv = document.querySelector('.pause-menu-actions');
        const menuConfirm = document.getElementById('pause-main-menu-confirm');
        const restartConfirm = document.getElementById('pause-restart-confirm');

        if (actionsDiv) actionsDiv.style.display = 'none';

        if (type === 'menu' && menuConfirm) {
            menuConfirm.style.display = 'block';
            if (restartConfirm) restartConfirm.style.display = 'none';
        } else if (type === 'restart' && restartConfirm) {
            restartConfirm.style.display = 'block';
            if (menuConfirm) menuConfirm.style.display = 'none';
        }
    },

    hideConfirm() {
        const actionsDiv = document.querySelector('.pause-menu-actions');
        const menuConfirm = document.getElementById('pause-main-menu-confirm');
        const restartConfirm = document.getElementById('pause-restart-confirm');

        if (actionsDiv) actionsDiv.style.display = 'flex';
        if (menuConfirm) menuConfirm.style.display = 'none';
        if (restartConfirm) restartConfirm.style.display = 'none';
    }
};

// ==========================================================================
// 📖 ADAPTIVE & INTERACTIVE TUTORIAL MANAGER (9 LESSONS)
// ==========================================================================
const TutorialManager = {
    currentRule: 'egregna', // 'egregna' or 'toregna'
    currentStep: 0,
    animationId: null,
    animProgress: 0,
    userBoardState: null,
    userSelectedPiece: null,
    stepCompleted: false,
    stepSubStage: 1,
    slidingPiece: null,
    victoryState: false,

    init() {
        this.currentRule = localStorage.getItem('damma-selected-rule') || 'egregna';
        this.bindEvents();
        this.renderStep(0);
    },

    setRule(rule) {
        if (rule !== 'egregna' && rule !== 'toregna') return;
        this.currentRule = rule;
        localStorage.setItem('damma-selected-rule', rule);
        
        // Sync rule switcher buttons
        const egregnaBtn = document.getElementById('tut-rule-egregna');
        const toregnaBtn = document.getElementById('tut-rule-toregna');
        if (egregnaBtn) egregnaBtn.classList.toggle('active', rule === 'egregna');
        if (toregnaBtn) toregnaBtn.classList.toggle('active', rule === 'toregna');

        // Sync rule selection cards in Settings pane if open
        document.querySelectorAll('.rule-variant-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-rule') === rule);
        });

        this.renderStep(this.currentStep);
    },

    getStepData() {
        return this.currentRule === 'toregna' ? this.getToregnaSteps() : this.getEgregnaSteps();
    },

    getEgregnaSteps() {
        return [
            // LESSON 1 / 9
            {
                tag: "LESSON 1 / 9 (EGREGNA)",
                title: "Board Setup & Objective",
                desc: "Damma (Egregna) is played on an 8x8 grid on <strong>dark squares</strong>. Gold pieces start on rows 5–7 and Dark pieces on rows 0–2.",
                highlight: "💡 <strong>Objective:</strong> Capture all opponent pieces OR block them so they have zero legal moves left!",
                initialBoard: () => [
                    [0,-1,0,-1,0,-1,0,-1],
                    [-1,0,-1,0,-1,0,-1,0],
                    [0,-1,0,-1,0,-1,0,-1],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [1,0,1,0,1,0,1,0],
                    [0,1,0,1,0,1,0,1],
                    [1,0,1,0,1,0,1,0]
                ],
                feedback: "💡 Tap any Gold starting piece to explore the Egregna board layout!"
            },
            // LESSON 2 / 9
            {
                tag: "LESSON 2 / 9 (EGREGNA)",
                title: "Moving Normal Pieces",
                desc: "Normal pieces move <strong>1 diagonal square forward</strong> toward the opponent's side. Backward moves are strictly forbidden.",
                highlight: "👣 <strong>Movement Rule:</strong> Tap your Gold piece at (5,3) to reveal legal destinations, then perform your move!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 4, c: 2 }, { r: 4, c: 4 }],
                arrows: [
                    { fromR: 5, fromC: 3, toR: 4, toC: 2, label: "Diag Left" },
                    { fromR: 5, fromC: 3, toR: 4, toC: 4, label: "Diag Right" }
                ],
                feedback: "👉 Tap your glowing Gold piece at (5,3) to reveal legal target spots!"
            },
            // LESSON 3 / 9
            {
                tag: "LESSON 3 / 9 (EGREGNA)",
                title: "Capturing Enemy Pieces",
                desc: "Capture an opponent piece by <strong>jumping diagonally over an adjacent enemy</strong> into an empty landing square directly behind it!",
                highlight: "🎯 <strong>Adjacent Jump:</strong> Leap over an adjacent enemy to eliminate them from play.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    b[4][4] = -1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 3, c: 5, isCapture: true, removeCap: { r: 4, c: 4 } }],
                arrows: [{ fromR: 5, fromC: 3, toR: 3, toC: 5, label: "Jump & Capture!" }],
                feedback: "⚔️ Tap your Gold piece at (5,3), then tap green target (3,5) to capture!"
            },
            // LESSON 4 / 9
            {
                tag: "LESSON 4 / 9 (EGREGNA)",
                title: "Mandatory Capture Rule",
                desc: "In Egregna, <strong>if a capture is available, you MUST capture</strong>! Non-capturing moves are forbidden when a jump is possible.",
                highlight: "⚠️ <strong>Mandatory Rule:</strong> Jumps take strict priority over normal moves.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1; // Piece A (Can capture!)
                    b[4][4] = -1;
                    b[6][1] = 1; // Piece B (Normal move only)
                    return b;
                },
                capturePiece: { r: 5, c: 3 },
                normalPiece: { r: 6, c: 1 },
                targets: [{ r: 3, c: 5, isCapture: true, removeCap: { r: 4, c: 4 } }],
                arrows: [{ fromR: 5, fromC: 3, toR: 3, toC: 5, label: "FORCED CAPTURE!" }],
                feedback: "⚠️ Try tapping Piece B at (6,1) vs Piece A at (5,3) to see mandatory capture in action!"
            },
            // LESSON 5 / 9
            {
                tag: "LESSON 5 / 9 (EGREGNA)",
                title: "Multiple Captures (Chain Jumps)",
                desc: "If landing after a jump opens another capture, your piece <strong>must continue jumping</strong> in the same turn to clear all targets!",
                highlight: "🔥 <strong>Chain Jumps:</strong> Sweep across multiple enemy pieces in a single master turn.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][2] = 1;
                    b[5][3] = -1;
                    b[3][5] = -1;
                    return b;
                },
                feedback: "🔥 Tap Gold piece at (6,2) to launch your double-capture chain sweep!"
            },
            // LESSON 6 / 9
            {
                tag: "LESSON 6 / 9 (EGREGNA)",
                title: "King Promotion ('Crowning')",
                desc: "Reaching row 0 crowns your piece into an <strong>Egregna King 👑</strong>!",
                highlight: "👑 <strong>Crowning:</strong> Unlocks 1-step backward and multi-directional diagonal movement.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[1][3] = 1;
                    return b;
                },
                source: { r: 1, c: 3 },
                targets: [{ r: 0, c: 4, promoteToKing: true }, { r: 0, c: 2, promoteToKing: true }],
                arrows: [{ fromR: 1, fromC: 3, toR: 0, toC: 4, label: "CROWN 👑" }],
                feedback: "👑 Tap your Gold piece at (1,3) and step into row 0 to earn your Crown!"
            },
            // LESSON 7 / 9
            {
                tag: "LESSON 7 / 9 (EGREGNA)",
                title: "Egregna King Movement (1 Square)",
                desc: "In <strong>Egregna</strong>, Kings move <strong>1 diagonal square</strong> in any of the 4 directions (forward or backward). No long-distance sliding.",
                highlight: "👑 <strong>1-Square Rule:</strong> Short-range 1-step diagonal movement in all 4 directions.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[4][4] = 2; // Egregna King
                    return b;
                },
                source: { r: 4, c: 4 },
                targets: [{ r: 3, c: 3 }, { r: 3, c: 5 }, { r: 5, c: 3 }, { r: 5, c: 5 }],
                arrows: [
                    { fromR: 4, fromC: 4, toR: 3, toC: 3, label: "1 Step" },
                    { fromR: 4, fromC: 4, toR: 3, toC: 5, label: "1 Step" },
                    { fromR: 4, fromC: 4, toR: 5, toC: 3, label: "1 Step" },
                    { fromR: 4, fromC: 4, toR: 5, toC: 5, label: "1 Step" }
                ],
                feedback: "👑 Tap your Egregna King at (4,4), then tap any adjacent green target square!"
            },
            // LESSON 8 / 9
            {
                tag: "LESSON 8 / 9 (EGREGNA)",
                title: "Egregna King Captures",
                desc: "In <strong>Egregna</strong>, Kings capture adjacent enemy pieces by <strong>jumping 1 square over them</strong> into an empty landing square directly behind them.",
                highlight: "⚔️ <strong>Adjacent King Jump:</strong> Leap over adjacent enemies to eliminate them in any direction.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[4][4] = 2; // Egregna King
                    b[3][5] = -1; // Dark Enemy A
                    b[5][3] = -1; // Dark Enemy B
                    return b;
                },
                source: { r: 4, c: 4 },
                targets: [
                    { r: 2, c: 6, isCapture: true, removeCap: { r: 3, c: 5 } },
                    { r: 6, c: 2, isCapture: true, removeCap: { r: 5, c: 3 } }
                ],
                arrows: [
                    { fromR: 4, fromC: 4, toR: 2, toC: 6, label: "Adjacent Jump" },
                    { fromR: 4, fromC: 4, toR: 6, toC: 2, label: "Adjacent Jump" }
                ],
                feedback: "⚔️ Tap your Egregna King at (4,4), then tap green target (2,6) or (6,2) to capture!"
            },
            // LESSON 9 / 9
            {
                tag: "LESSON 9 / 9 (EGREGNA)",
                title: "Egregna Master Strategy",
                desc: "1. <strong>Center Control</strong>: Lock down rows 3–4 with protected formations.<br>2. <strong>King Safeguarding</strong>: Keep Kings behind defensive rows; 1-step Kings can get cornered if isolated!<br>3. <strong>Short-Range Traps</strong>: Force opponent pieces into tight 1-square capture traps!",
                highlight: "🧠 <strong>Egregna Strategy:</strong> Control the center, protect 1-step Kings, and set tight positional traps.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 2; // Gold Egregna King
                    b[6][2] = 1; // Gold Defender Piece
                    b[3][5] = -1; // Opponent Piece
                    return b;
                },
                feedback: "🧠 Step 1: Tap Gold King at (5,3) and step forward to (4,4) to lock down the center!"
            }
        ];
    },

    getToregnaSteps() {
        return [
            // LESSON 1 / 9
            {
                tag: "LESSON 1 / 9 (TOREGNA)",
                title: "Board Setup & Objective",
                desc: "Damma (Toregna) is played on an 8x8 grid on <strong>dark squares</strong>. Gold pieces start on rows 5–7 and Dark pieces on rows 0–2.",
                highlight: "💡 <strong>Objective:</strong> Capture all opponent pieces OR block them completely.",
                initialBoard: () => [
                    [0,-1,0,-1,0,-1,0,-1],
                    [-1,0,-1,0,-1,0,-1,0],
                    [0,-1,0,-1,0,-1,0,-1],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [1,0,1,0,1,0,1,0],
                    [0,1,0,1,0,1,0,1],
                    [1,0,1,0,1,0,1,0]
                ],
                feedback: "💡 Tap any Gold starting piece to explore the Toregna board layout!"
            },
            // LESSON 2 / 9
            {
                tag: "LESSON 2 / 9 (TOREGNA)",
                title: "Moving Normal Pieces",
                desc: "Normal pieces move <strong>1 diagonal square forward</strong> toward the opponent's side. Backward moves are strictly forbidden.",
                highlight: "👣 <strong>Movement Rule:</strong> Advance 1 square diagonally forward.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 4, c: 2 }, { r: 4, c: 4 }],
                arrows: [
                    { fromR: 5, fromC: 3, toR: 4, toC: 2, label: "Diag Left" },
                    { fromR: 5, fromC: 3, toR: 4, toC: 4, label: "Diag Right" }
                ],
                feedback: "👉 Tap your glowing Gold piece at (5,3) to reveal legal target spots!"
            },
            // LESSON 3 / 9
            {
                tag: "LESSON 3 / 9 (TOREGNA)",
                title: "Capturing Enemy Pieces",
                desc: "Capture an opponent piece by <strong>jumping diagonally over an adjacent enemy</strong> into an empty landing square directly behind it!",
                highlight: "🎯 <strong>Adjacent Jump:</strong> Leap over an adjacent enemy to eliminate them from play.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;
                    b[4][4] = -1;
                    return b;
                },
                source: { r: 5, c: 3 },
                targets: [{ r: 3, c: 5, isCapture: true, removeCap: { r: 4, c: 4 } }],
                arrows: [{ fromR: 5, fromC: 3, toR: 3, toC: 5, label: "Jump & Capture!" }],
                feedback: "⚔️ Tap your Gold piece at (5,3), then tap green target (3,5) to capture!"
            },
            // LESSON 4 / 9
            {
                tag: "LESSON 4 / 9 (TOREGNA)",
                title: "Mandatory Capture Rule",
                desc: "In Toregna, <strong>if a capture is available, you MUST capture</strong>! Non-capturing moves are forbidden when a jump is possible.",
                highlight: "⚠️ <strong>Mandatory Rule:</strong> Jumps take strict priority over normal moves.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1; // Piece A (Can capture!)
                    b[4][4] = -1;
                    b[6][1] = 1; // Piece B (Normal move only)
                    return b;
                },
                capturePiece: { r: 5, c: 3 },
                normalPiece: { r: 6, c: 1 },
                targets: [{ r: 3, c: 5, isCapture: true, removeCap: { r: 4, c: 4 } }],
                arrows: [{ fromR: 5, fromC: 3, toR: 3, toC: 5, label: "FORCED CAPTURE!" }],
                feedback: "⚠️ Try tapping Piece B at (6,1) vs Piece A at (5,3) to see mandatory capture in action!"
            },
            // LESSON 5 / 9
            {
                tag: "LESSON 5 / 9 (TOREGNA)",
                title: "Multiple Captures (Chain Jumps)",
                desc: "If landing after a jump opens another capture, your piece <strong>must continue jumping</strong> in the same turn to clear all targets!",
                highlight: "🔥 <strong>Chain Jumps:</strong> Sweep across multiple enemy pieces in a single master turn.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][2] = 1;
                    b[5][3] = -1;
                    b[3][5] = -1;
                    return b;
                },
                feedback: "🔥 Tap Gold piece at (6,2) to launch your double-capture chain sweep!"
            },
            // LESSON 6 / 9
            {
                tag: "LESSON 6 / 9 (TOREGNA)",
                title: "King Promotion ('Crowning')",
                desc: "Reaching row 0 crowns your piece into a powerful <strong>Flying King 🚀</strong>!",
                highlight: "👑 <strong>Crowning:</strong> Promotes piece into a Flying King with long-range diagonal movement.",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[1][3] = 1;
                    return b;
                },
                source: { r: 1, c: 3 },
                targets: [{ r: 0, c: 4, promoteToKing: true }, { r: 0, c: 2, promoteToKing: true }],
                arrows: [{ fromR: 1, fromC: 3, toR: 0, toC: 4, label: "CROWN 👑" }],
                feedback: "👑 Tap your Gold piece at (1,3) and step into row 0 to earn your Crown!"
            },
            // LESSON 7 / 9
            {
                tag: "LESSON 7 / 9 (TOREGNA)",
                title: "Toregna Flying King Movement",
                desc: "In <strong>Toregna</strong>, Kings become <strong>Flying Kings 🚀</strong>! They slide unlimited diagonal squares across open paths in all 4 directions!",
                highlight: "🚀 <strong>Flying King Rule:</strong> Slide long distances along open diagonal rays in a single move!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][1] = 2; // Toregna Flying King
                    return b;
                },
                source: { r: 6, c: 1 },
                targets: [
                    { r: 5, c: 2 }, { r: 4, c: 3 }, { r: 3, c: 4 }, { r: 2, c: 5 }, { r: 1, c: 6 }
                ],
                arrows: [{ fromR: 6, fromC: 1, toR: 1, toC: 6, label: "Long Slide 🚀" }],
                feedback: "🚀 Tap Flying King at (6,1), then tap target (1,6) to slide across the entire diagonal!"
            },
            // LESSON 8 / 9
            {
                tag: "LESSON 8 / 9 (TOREGNA)",
                title: "Toregna Flying King Captures",
                desc: "Flying Kings capture enemy pieces <strong>from any distance</strong> along an open diagonal ray! Jump over a distant enemy and choose <strong>ANY empty landing square behind it</strong>.",
                highlight: "🎯 <strong>Long-Distance Strike:</strong> Jump over distant enemies and choose your preferred landing spot!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][0] = 2; // Toregna Flying King
                    b[4][3] = -1; // Distant enemy
                    return b;
                },
                source: { r: 7, c: 0 },
                targets: [
                    { r: 3, c: 4, isCapture: true, removeCap: { r: 4, c: 3 } },
                    { r: 2, c: 5, isCapture: true, removeCap: { r: 4, c: 3 } },
                    { r: 1, c: 6, isCapture: true, removeCap: { r: 4, c: 3 } }
                ],
                arrows: [{ fromR: 7, fromC: 0, toR: 2, toC: 5, label: "Flying Capture 🎯" }],
                feedback: "🎯 Tap Flying King at (7,0), then tap target (2,5) to execute a long-distance jump strike!"
            },
            // LESSON 9 / 9
            {
                tag: "LESSON 9 / 9 (TOREGNA)",
                title: "Toregna Master Strategy",
                desc: "1. <strong>Highway Dominance</strong>: Keep long diagonal paths open for your Flying Kings.<br>2. <strong>Long-Distance Sweeps</strong>: Chain long jumps across distant enemy pieces.<br>3. <strong>Defensive Clogging</strong>: Block open diagonal lines to neutralize enemy Flying Kings!",
                highlight: "⚡ <strong>Toregna Strategy:</strong> Control long diagonals to unleash long-range Flying King sweeps!",
                initialBoard: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][0] = 2; // Toregna Flying King
                    b[4][3] = -1; // Enemy A
                    b[2][5] = -1; // Enemy B
                    return b;
                },
                feedback: "⚡ Step 1: Tap Flying King at (7,0) and jump distant enemy at (4,3) landing at (3,4)!"
            }
        ];
    },

    bindEvents() {
        const prevBtn = document.getElementById('tutorial-prev-btn');
        const nextBtn = document.getElementById('tutorial-next-btn');
        const restartBtn = document.getElementById('tutorial-restart-btn');
        const skipBtn = document.getElementById('tutorial-skip-btn');

        const egregnaBtn = document.getElementById('tut-rule-egregna');
        const toregnaBtn = document.getElementById('tut-rule-toregna');

        if (egregnaBtn) {
            egregnaBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.setRule('egregna');
            });
        }

        if (toregnaBtn) {
            toregnaBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.setRule('toregna');
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                if (this.currentStep > 0) {
                    this.renderStep(this.currentStep - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                const steps = this.getStepData();
                if (this.currentStep < steps.length - 1) {
                    this.renderStep(this.currentStep + 1);
                } else {
                    const modal = document.getElementById('settings-modal');
                    if (modal) modal.classList.remove('active');
                }
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.restartCurrentStep();
            });
        }

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.renderStep(8); // Jump to strategy lesson
            });
        }

        // Interactive canvas clicks & touch events
        const canvas = document.getElementById('tutorial-demo-canvas');
        if (canvas) {
            const handleInteract = (e) => {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const x = clientX - rect.left;
                const y = clientY - rect.top;

                const col = Math.floor((x / canvas.width) * 8);
                const row = Math.floor((y / canvas.height) * 8);

                this.handleCanvasClick(row, col);
            };

            canvas.addEventListener('click', handleInteract);
            canvas.addEventListener('touchstart', handleInteract, { passive: false });
        }
    },

    restartCurrentStep() {
        this.renderStep(this.currentStep);
    },

    renderStep(stepIdx) {
        this.currentStep = stepIdx;
        this.userSelectedPiece = null;
        this.stepCompleted = false;
        this.stepSubStage = 1;
        this.slidingPiece = null;
        this.victoryState = false;

        const steps = this.getStepData();
        const step = steps[stepIdx];
        if (!step) return;

        this.userBoardState = step.initialBoard();

        const counterEl = document.getElementById('tutorial-step-counter');
        const tagEl = document.getElementById('tutorial-step-tag');
        const titleEl = document.getElementById('tutorial-step-title');
        const descEl = document.getElementById('tutorial-step-desc');
        const boxEl = document.getElementById('tutorial-highlights-box');
        const feedbackBadge = document.getElementById('tutorial-feedback-badge');

        if (counterEl) counterEl.textContent = `Step ${stepIdx + 1} of ${steps.length}`;
        if (tagEl) tagEl.textContent = step.tag;
        if (titleEl) titleEl.textContent = step.title;
        if (descEl) descEl.innerHTML = step.desc;
        if (boxEl) boxEl.innerHTML = step.highlight;
        if (feedbackBadge) feedbackBadge.textContent = step.feedback;

        const prevBtn = document.getElementById('tutorial-prev-btn');
        const nextBtn = document.getElementById('tutorial-next-btn');
        if (prevBtn) prevBtn.disabled = (stepIdx === 0);
        if (nextBtn) {
            if (stepIdx === steps.length - 1) {
                nextBtn.textContent = 'Finish 🏆';
            } else {
                nextBtn.textContent = 'Next ➡';
            }
        }

        const dotsContainer = document.getElementById('tutorial-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            steps.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `tutorial-dot ${idx === stepIdx ? 'active' : ''}`;
                dot.addEventListener('click', () => {
                    SoundSystem.play('click');
                    this.renderStep(idx);
                });
                dotsContainer.appendChild(dot);
            });
        }

        this.animProgress = 0;
        this.startCanvasLoop();
    },

    handleCanvasClick(r, c) {
        if (this.slidingPiece) return; // Wait for animation
        const steps = this.getStepData();
        const step = steps[this.currentStep];
        if (!step) return;

        const feedbackBadge = document.getElementById('tutorial-feedback-badge');

        // LESSON 1: Board Setup
        if (this.currentStep === 0) {
            if (this.userBoardState[r][c] !== 0) {
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                this.stepCompleted = true;
                if (feedbackBadge) {
                    const pName = this.userBoardState[r][c] > 0 ? "Gold Piece (Player 1)" : "Dark Piece (Player 2)";
                    feedbackBadge.textContent = `✨ ${pName} at row ${r}, col ${c}! Click Next to proceed.`;
                }
            }
            return;
        }

        // LESSON 2: Moving Pieces
        if (this.currentStep === 1) {
            if (r === 5 && c === 3 && this.userBoardState[5][3] > 0) {
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "🎯 Piece selected! Now tap target square (4,2) or (4,4).";
            } else if (this.userSelectedPiece && (r === 4 && (c === 2 || c === 4))) {
                this.animateSlide(this.userSelectedPiece.r, this.userSelectedPiece.c, r, c, null, false, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "🎉 Excellent move! Normal pieces advance 1 diagonal square forward.";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        // LESSON 3: Capturing
        if (this.currentStep === 2) {
            if (r === 5 && c === 3 && this.userBoardState[5][3] > 0) {
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "⚔️ Piece selected! Tap green target square (3,5) to capture!";
            } else if (this.userSelectedPiece && r === 3 && c === 5) {
                this.animateSlide(5, 3, 3, 5, { r: 4, c: 4 }, false, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "💥 Target captured! Enemy piece eliminated.";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        // LESSON 4: Mandatory Capture
        if (this.currentStep === 3) {
            if (r === 6 && c === 1) { // Non-capture piece
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "❌ Capturing is mandatory! You cannot move Piece B. Select Piece A at (5,3).";
            } else if (r === 5 && c === 3) { // Capture piece
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "🎯 Correct! Piece A has a capture. Tap green target square (3,5)!";
            } else if (this.userSelectedPiece && r === 3 && c === 5) {
                this.animateSlide(5, 3, 3, 5, { r: 4, c: 4 }, false, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "🎉 Correct! Mandatory capture enforced.";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        // LESSON 5: Multiple Capture (Chain Jumps)
        if (this.currentStep === 4) {
            if (this.stepSubStage === 1) {
                if (r === 6 && c === 2) {
                    this.userSelectedPiece = { r, c };
                    SoundSystem.play('click');
                    if (feedbackBadge) feedbackBadge.textContent = "🔥 Tap green target (4,4) to make your first jump!";
                } else if (this.userSelectedPiece && r === 4 && c === 4) {
                    this.animateSlide(6, 2, 4, 4, { r: 5, c: 3 }, false, () => {
                        this.stepSubStage = 2;
                        this.userSelectedPiece = { r: 4, c: 4 };
                        if (feedbackBadge) feedbackBadge.textContent = "🔥 Chain jump available! Tap target square (2,6) to complete multi-capture!";
                    });
                }
            } else if (this.stepSubStage === 2) {
                if (r === 2 && c === 6) {
                    this.animateSlide(4, 4, 2, 6, { r: 3, c: 5 }, false, () => {
                        this.stepCompleted = true;
                        if (feedbackBadge) feedbackBadge.textContent = "💥 Double capture sweep complete! Multi-jump mastered.";
                    });
                    this.userSelectedPiece = null;
                }
            }
            return;
        }

        // LESSON 6: King Promotion
        if (this.currentStep === 5) {
            if (r === 1 && c === 3 && this.userBoardState[1][3] > 0) {
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "👑 Tap target square (0,4) to step into row 0!";
            } else if (this.userSelectedPiece && r === 0 && (c === 4 || c === 2)) {
                this.animateSlide(1, 3, r, c, null, true, () => {
                    this.stepCompleted = true;
                    if (feedbackBadge) feedbackBadge.textContent = "👑 Crowned! Reaching row 0 instantly turns your piece into a King!";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        // LESSON 7: Variant King Rules
        if (this.currentStep === 6) {
            const isEgregna = (this.currentRule === 'egregna');
            if (isEgregna) {
                if (r === 4 && c === 4) {
                    this.userSelectedPiece = { r, c };
                    SoundSystem.play('click');
                    if (feedbackBadge) feedbackBadge.textContent = "👑 Tap (2,6) to jump capture OR tap adjacent diagonal squares!";
                } else if (this.userSelectedPiece && r === 2 && c === 6) {
                    this.animateSlide(4, 4, 2, 6, { r: 3, c: 5 }, false, () => {
                        this.stepCompleted = true;
                        if (feedbackBadge) feedbackBadge.textContent = "👑 Egregna short-range King capture executed!";
                    });
                    this.userSelectedPiece = null;
                }
            } else { // Toregna Flying King
                if (r === 6 && c === 1) {
                    this.userSelectedPiece = { r, c };
                    SoundSystem.play('click');
                    if (feedbackBadge) feedbackBadge.textContent = "🚀 Flying King selected! Tap target (2,5) for a long-distance jump!";
                } else if (this.userSelectedPiece && r === 2 && c === 5) {
                    this.animateSlide(6, 1, 2, 5, { r: 4, c: 3 }, false, () => {
                        this.stepCompleted = true;
                        if (feedbackBadge) feedbackBadge.textContent = "🚀 Long-range Flying King capture executed!";
                    });
                    this.userSelectedPiece = null;
                }
            }
            return;
        }

        // LESSON 8: Winning Conditions
        if (this.currentStep === 7) {
            if (r === 5 && c === 2) {
                this.userSelectedPiece = { r, c };
                SoundSystem.play('click');
                if (feedbackBadge) feedbackBadge.textContent = "⚔️ Tap target square (3,4) to execute final strike!";
            } else if (this.userSelectedPiece && r === 3 && c === 4) {
                this.animateSlide(5, 2, 3, 4, { r: 4, c: 3 }, false, () => {
                    this.stepCompleted = true;
                    this.victoryState = true;
                    SoundSystem.play('victory');
                    if (feedbackBadge) feedbackBadge.textContent = "🏆 Match Won! Total elimination clears opponent from board!";
                });
                this.userSelectedPiece = null;
            }
            return;
        }

        // LESSON 9: Ethiopian Master Strategy
        if (this.currentStep === 8) {
            if (this.stepSubStage === 1) {
                if (r === 5 && c === 3) {
                    this.userSelectedPiece = { r, c };
                    SoundSystem.play('click');
                    if (feedbackBadge) feedbackBadge.textContent = "🧠 Move Piece A to (3,4) as sacrifice bait!";
                } else if (this.userSelectedPiece && r === 3 && c === 4) {
                    this.animateSlide(5, 3, 3, 4, null, false, () => {
                        // CPU forced jump response!
                        setTimeout(() => {
                            this.animateSlide(2, 5, 4, 3, { r: 3, c: 4 }, false, () => {
                                this.stepSubStage = 2;
                                this.userSelectedPiece = null;
                                if (feedbackBadge) feedbackBadge.textContent = "⚡ Opponent took the bait! Tap Piece B at (6,1) to counter-sweep!";
                            });
                        }, 400);
                    });
                }
            } else if (this.stepSubStage === 2) {
                if (r === 6 && c === 1) {
                    this.userSelectedPiece = { r, c };
                    SoundSystem.play('click');
                    if (feedbackBadge) feedbackBadge.textContent = "💥 Tap target square (2,5) to complete counter-sweep!";
                } else if (this.userSelectedPiece && r === 2 && c === 5) {
                    this.animateSlide(6, 1, 2, 5, { r: 4, c: 3 }, false, () => {
                        this.stepCompleted = true;
                        this.victoryState = true;
                        SoundSystem.play('victory');
                        if (feedbackBadge) feedbackBadge.textContent = "🎉 Genius tactical sacrifice! You are ready to dominate Damma!";
                    });
                    this.userSelectedPiece = null;
                }
            }
            return;
        }
    },

    animateSlide(fromR, fromC, toR, toC, removeCap, promoteToKing, onComplete) {
        SoundSystem.play(removeCap ? 'capture' : 'move');
        this.slidingPiece = {
            fromR, fromC, toR, toC,
            progress: 0,
            removeCap,
            promoteToKing,
            onComplete
        };
    },

    startCanvasLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const canvas = document.getElementById('tutorial-demo-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const loop = () => {
            this.animProgress += 0.015;
            if (this.animProgress > 100) this.animProgress = 0;

            if (this.slidingPiece) {
                this.slidingPiece.progress += 0.05;
                if (this.slidingPiece.progress >= 1) {
                    const sp = this.slidingPiece;
                    let pVal = this.userBoardState[sp.fromR][sp.fromC];
                    if (sp.promoteToKing) {
                        pVal = 2;
                        SoundSystem.play('king');
                    }
                    this.userBoardState[sp.fromR][sp.fromC] = 0;
                    this.userBoardState[sp.toR][sp.toC] = pVal;
                    if (sp.removeCap) {
                        this.userBoardState[sp.removeCap.r][sp.removeCap.c] = 0;
                    }
                    const cb = sp.onComplete;
                    this.slidingPiece = null;
                    if (cb) cb();
                }
            }

            this.drawBoardState(ctx, canvas);
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    },

    drawBoardState(ctx, canvas) {
        const size = canvas.width;
        const cellSize = size / 8;
        ctx.clearRect(0, 0, size, size);

        // 1. Draw Board Grid & Territory Overlays
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const isDark = (r + c) % 2 === 1;
                ctx.fillStyle = isDark ? '#322316' : '#d2a679';
                ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

                // Highlight dark squares slightly in Lesson 1
                if (this.currentStep === 0 && isDark) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                }

                // Lesson 1 Territory Overlays
                if (this.currentStep === 0) {
                    if (r >= 5) {
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    } else if (r <= 2) {
                        ctx.fillStyle = 'rgba(230, 57, 70, 0.12)';
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
                    }
                }

                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
        }

        // 2. Draw Lesson Highlights & Target Pulses
        const step = this.getStepData()[this.currentStep];

        // Highlight selected piece
        if (this.userSelectedPiece) {
            const { r, c } = this.userSelectedPiece;
            const cx = (c + 0.5) * cellSize;
            const cy = (r + 0.5) * cellSize;
            const pulse = Math.sin(this.animProgress * 6) * 3 + cellSize * 0.42;

            ctx.beginPath();
            ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3.5;
            ctx.stroke();
        } else if (step && step.source) {
            const { r, c } = step.source;
            const cx = (c + 0.5) * cellSize;
            const cy = (r + 0.5) * cellSize;
            const pulse = Math.sin(this.animProgress * 5) * 3 + cellSize * 0.4;

            ctx.beginPath();
            ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        }

        // Draw Target Landing Rings
        if (this.currentStep === 1 && this.userSelectedPiece) {
            [{ r: 4, c: 2 }, { r: 4, c: 4 }].forEach(t => this.drawTargetRing(ctx, t.r, t.c, cellSize));
        } else if (this.currentStep === 2 && this.userSelectedPiece) {
            this.drawTargetRing(ctx, 3, 5, cellSize);
        } else if (this.currentStep === 3 && this.userSelectedPiece) {
            this.drawTargetRing(ctx, 3, 5, cellSize);
        } else if (this.currentStep === 4) {
            if (this.stepSubStage === 1 && this.userSelectedPiece) {
                this.drawTargetRing(ctx, 4, 4, cellSize);
            } else if (this.stepSubStage === 2) {
                this.drawTargetRing(ctx, 2, 6, cellSize);
            }
        } else if (this.currentStep === 5 && this.userSelectedPiece) {
            this.drawTargetRing(ctx, 0, 4, cellSize, true);
        } else if (this.currentStep === 6 && this.userSelectedPiece) {
            const isEgregna = (this.currentRule === 'egregna');
            if (isEgregna) {
                this.drawTargetRing(ctx, 2, 6, cellSize);
            } else {
                [{ r: 5, c: 2 }, { r: 3, c: 4 }, { r: 2, c: 5 }, { r: 1, c: 6 }].forEach(t => this.drawTargetRing(ctx, t.r, t.c, cellSize));
            }
        } else if (this.currentStep === 7 && this.userSelectedPiece) {
            this.drawTargetRing(ctx, 3, 4, cellSize);
        } else if (this.currentStep === 8) {
            if (this.stepSubStage === 1 && this.userSelectedPiece) {
                this.drawTargetRing(ctx, 3, 4, cellSize);
            } else if (this.stepSubStage === 2) {
                this.drawTargetRing(ctx, 2, 5, cellSize);
            }
        }

        // 3. Draw Static Arrows
        if (step && step.arrows && !this.slidingPiece) {
            step.arrows.forEach(arr => {
                const x1 = (arr.fromC + 0.5) * cellSize;
                const y1 = (arr.fromR + 0.5) * cellSize;
                const x2 = (arr.toC + 0.5) * cellSize;
                const y2 = (arr.toR + 0.5) * cellSize;
                this.drawArrow(ctx, x1, y1, x2, y2, '#ffd700', arr.label);
            });
        }

        // 4. Draw Board Pieces
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.slidingPiece && r === this.slidingPiece.fromR && c === this.slidingPiece.fromC) {
                    continue; // Skip animated piece
                }
                const pVal = this.userBoardState[r][c];
                if (pVal !== 0) {
                    this.drawTutorialPiece(ctx, (c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 0.36, pVal);
                }
            }
        }

        // 5. Draw Animated Sliding Piece
        if (this.slidingPiece) {
            const sp = this.slidingPiece;
            const ease = sp.progress < 0.5 ? 2 * sp.progress * sp.progress : 1 - Math.pow(-2 * sp.progress + 2, 2) / 2;
            const curR = sp.fromR + (sp.toR - sp.fromR) * ease;
            const curC = sp.fromC + (sp.toC - sp.fromC) * ease;

            let pVal = this.userBoardState[sp.fromR][sp.fromC];
            if (sp.promoteToKing && sp.progress > 0.8) pVal = 2;

            this.drawTutorialPiece(ctx, (curC + 0.5) * cellSize, (curR + 0.5) * cellSize, cellSize * 0.38, pVal, true);
        }

        // 6. Draw Victory Banner
        if (this.victoryState) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, size * 0.35, size, size * 0.3);

            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, size * 0.35, size, size * 0.3);

            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${Math.round(size * 0.08)}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏆 VICTORY!', size / 2, size * 0.45);

            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(size * 0.045)}px sans-serif`;
            ctx.fillText('Lesson Complete', size / 2, size * 0.55);
            ctx.restore();
        }
    },

    drawTargetRing(ctx, r, c, cellSize, isCrown = false) {
        const cx = (c + 0.5) * cellSize;
        const cy = (r + 0.5) * cellSize;
        const pulse = Math.sin(this.animProgress * 6) * 3 + cellSize * 0.35;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(46, 204, 113, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (isCrown) {
            ctx.fillStyle = '#ffd700';
            ctx.font = `${Math.round(cellSize * 0.5)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', cx, cy);
        }
        ctx.restore();
    },

    drawTutorialPiece(ctx, x, y, radius, pVal, isGlowing = false) {
        const isPlayer1 = pVal > 0;
        const isKing = Math.abs(pVal) === 2;
        const activeColor = isPlayer1 ? getP1Color() : getP2Color();

        ctx.save();
        if (isGlowing) {
            ctx.shadowColor = activeColor.glowColor;
            ctx.shadowBlur = 14;
        }

        const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
        activeColor.baseGrad.forEach(stop => {
            grad.addColorStop(stop.offset, stop.color);
        });

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = activeColor.rimStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (isKing) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(radius * 1.1)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', x, y);
        }

        ctx.restore();
    },

    drawArrow(ctx, fromx, fromy, tox, toy, color, label) {
        const headlen = 10;
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        if (label) {
            const midx = (fromx + tox) / 2;
            const midy = (fromy + toy) / 2;
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#000';
            const txtWidth = ctx.measureText(label).width;
            ctx.fillRect(midx - txtWidth / 2 - 4, midy - 8, txtWidth + 8, 16);
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, midx, midy);
        }
        ctx.restore();
    }
};

// ==========================================================================
// 📅 TRADITIONAL DAILY CHALLENGE SYSTEM (VERIFIED SOLVABLE PUZZLES)
// ==========================================================================
const DailyChallengeSystem = {
    selectedDifficulty: 'medium',

    puzzles: {
        easy: [
            {
                id: 'easy_1',
                title: 'Axumite Spear Strike',
                desc: 'Execute a clean double jump sweep with your gold piece to capture both CPU pieces!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][3] = 1;  // Player 1
                    b[4][3] = -1; // CPU
                    b[2][3] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            },
            {
                id: 'easy_2',
                title: 'Tigray Gateway Leap',
                desc: 'Perform a double jump sweep to promote into row 0 and clear the CPU!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][2] = 1;  // Player 1
                    b[5][2] = -1; // CPU
                    b[3][2] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            },
            {
                id: 'easy_3',
                title: 'Semien Mountain Strike',
                desc: 'Sweep through CPU defenses with a double jump sequence!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][4] = 1;  // Player 1
                    b[5][3] = -1; // CPU
                    b[5][1] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            },
            {
                id: 'easy_4',
                title: 'Abyssinian Pinpoint',
                desc: 'Capture the CPU defender to claim total victory on the board!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[4][3] = 1;  // Player 1
                    b[3][3] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 1 };
                }
            },
            {
                id: 'easy_5',
                title: 'Bale Ridge Double Leap',
                desc: 'Jump over two CPU pieces along the column to finish the puzzle!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][4] = 1;  // Player 1
                    b[5][4] = -1; // CPU
                    b[3][4] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            }
        ],

        medium: [
            {
                id: 'med_1',
                title: 'Lalibela Triple Sweep',
                desc: 'Execute a triple jump sequence across the board and promote to King!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][3] = 1;  // Player 1
                    b[6][3] = -1; // CPU
                    b[4][3] = -1; // CPU
                    b[2][3] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 3 };
                }
            },
            {
                id: 'med_2',
                title: 'Gondar Fortress L-Sweep',
                desc: 'Capture all CPU defenders in an L-shaped jump maneuver!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][1] = 1;  // Player 1
                    b[5][1] = -1; // CPU
                    b[3][1] = -1; // CPU
                    b[2][2] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 3 };
                }
            },
            {
                id: 'med_3',
                title: 'Harar Gate Crown Rush',
                desc: 'Execute a double jump that reaches row 0 for King promotion!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][5] = 1;  // Player 1
                    b[4][5] = -1; // CPU
                    b[2][5] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            },
            {
                id: 'med_4',
                title: 'Rift Valley Sideway Sweep',
                desc: 'Eliminate CPU stones with a double horizontal leap!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[4][6] = 1;  // Player 1
                    b[4][5] = -1; // CPU
                    b[4][3] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            },
            {
                id: 'med_5',
                title: 'Lake Tana Cross Capture',
                desc: 'Infiltrate the CPU row by jumping both blocking pieces!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[5][2] = 1;  // Player 1
                    b[4][2] = -1; // CPU
                    b[2][2] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            }
        ],

        hard: [
            {
                id: 'hard_1',
                title: 'Imperial Axum Flying King Sweep',
                desc: 'Use your Flying King to sweep across 3 CPU pieces along the column!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][1] = 2;  // Player 1 Flying King
                    b[5][1] = -1; // CPU
                    b[3][1] = -1; // CPU
                    b[1][1] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 3 };
                }
            },
            {
                id: 'hard_2',
                title: 'Great Rift Master Quad Sweep',
                desc: 'Execute a 4-piece chain capture across the board in 1 master turn!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][0] = 1;  // Player 1
                    b[6][0] = -1; // CPU
                    b[4][0] = -1; // CPU
                    b[2][0] = -1; // CPU
                    b[1][1] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 4 };
                }
            },
            {
                id: 'hard_3',
                title: 'Fasil Ghebbi Royal Checkmate',
                desc: 'Command your King to clear 3 CPU units positioned on row 7!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[7][7] = 2;  // Player 1 King
                    b[7][5] = -1; // CPU
                    b[7][3] = -1; // CPU
                    b[7][1] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 3 };
                }
            },
            {
                id: 'hard_4',
                title: 'Entoto Heights Royal Blitz',
                desc: 'Use your Flying King to leap through 2 CPU defenders across the map!',
                setup: () => {
                    const b = Array(8).fill(null).map(() => Array(8).fill(0));
                    b[6][0] = 2;  // Player 1 King
                    b[4][2] = -1; // CPU
                    b[2][4] = -1; // CPU
                    return { board: b, turn: 1, p1Count: 1, p2Count: 2 };
                }
            }
        ]
    },

    getDaySeed() {
        const todayStr = new Date().toISOString().split('T')[0];
        let hash = 0;
        for (let i = 0; i < todayStr.length; i++) {
            hash = ((hash << 5) - hash) + todayStr.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    },

    validatePuzzleSolvability(puzzle) {
        try {
            if (!puzzle || typeof puzzle.setup !== 'function') return false;
            const data = puzzle.setup();
            if (!data || !data.board) return false;
            
            const queue = [{ board: data.board, turn: data.turn || 1, p1Count: data.p1Count, p2Count: data.p2Count, depth: 0 }];
            const visited = new Set();
            
            while (queue.length > 0) {
                const state = queue.shift();
                if (state.p2Count === 0) return true;
                if (state.depth >= 6) continue;
                
                const key = JSON.stringify(state.board) + '_' + state.turn;
                if (visited.has(key)) continue;
                visited.add(key);
                
                const moves = this.getMovesForState(state.board, state.turn);
                if (moves.length === 0) {
                    if (state.turn === -1) return true;
                    continue;
                }
                
                for (const move of moves) {
                    const nextBoard = state.board.map(r => [...r]);
                    nextBoard[move.toR][move.toC] = nextBoard[move.fromR][move.fromC];
                    nextBoard[move.fromR][move.fromC] = 0;
                    let nextP1 = state.p1Count;
                    let nextP2 = state.p2Count;
                    
                    if (move.isJump && move.capturedPiece) {
                        const capVal = nextBoard[move.capturedPiece.r][move.capturedPiece.c];
                        nextBoard[move.capturedPiece.r][move.capturedPiece.c] = 0;
                        if (Math.sign(capVal) === 1) nextP1--;
                        else if (Math.sign(capVal) === -1) nextP2--;
                    }
                    
                    if (nextBoard[move.toR][move.toC] === 1 && move.toR === 0) nextBoard[move.toR][move.toC] = 2;
                    if (nextBoard[move.toR][move.toC] === -1 && move.toR === 7) nextBoard[move.toR][move.toC] = -2;
                    
                    queue.push({
                        board: nextBoard,
                        turn: -state.turn,
                        p1Count: nextP1,
                        p2Count: nextP2,
                        depth: state.depth + 1
                    });
                }
            }
            return false;
        } catch (e) {
            console.error("Error validating puzzle solvability:", e);
            return true;
        }
    },

    getMovesForState(currBoard, turn) {
        const selectedRule = localStorage.getItem('damma-selected-rule') || 'egregna';
        const jumps = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(currBoard[r][c]) === turn) {
                    const pieceVal = currBoard[r][c];
                    const isKing = Math.abs(pieceVal) === 2;
                    if (isKing && selectedRule === 'toregna') {
                        const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
                        for (const [dr, dc] of dirs) {
                            let searchR = r + dr, searchC = c + dc;
                            while (searchR >= 0 && searchR < 8 && searchC >= 0 && searchC < 8) {
                                const cell = currBoard[searchR][searchC];
                                if (cell === 0) {
                                    searchR += dr; searchC += dc;
                                } else {
                                    if (Math.sign(cell) === -turn) {
                                        const landingR = searchR + dr, landingC = searchC + dc;
                                        if (landingR >= 0 && landingR < 8 && landingC >= 0 && landingC < 8 && currBoard[landingR][landingC] === 0) {
                                            jumps.push({ fromR: r, fromC: c, toR: landingR, toC: landingC, isJump: true, capturedPiece: { r: searchR, c: searchC } });
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    } else {
                        const dirs = isKing 
                            ? [[-1,-1],[-1,1],[1,-1],[1,1]]
                            : (turn === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
                        
                        for (const [dr, dc] of dirs) {
                            const midR = r + dr, midC = c + dc;
                            const targetR = r + dr * 2, targetC = c + dc * 2;
                            if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                                if (currBoard[targetR][targetC] === 0 && currBoard[midR][midC] !== 0 && Math.sign(currBoard[midR][midC]) === -turn) {
                                    jumps.push({ fromR: r, fromC: c, toR: targetR, toC: targetC, isJump: true, capturedPiece: { r: midR, c: midC } });
                                }
                            }
                        }
                    }
                }
            }
        }
        if (jumps.length > 0) return jumps;

        const moves = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (Math.sign(currBoard[r][c]) === turn) {
                    const pieceVal = currBoard[r][c];
                    const isKing = Math.abs(pieceVal) === 2;
                    if (isKing && selectedRule === 'toregna') {
                        const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
                        for (const [dr, dc] of dirs) {
                            let targetR = r + dr, targetC = c + dc;
                            while (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
                                if (currBoard[targetR][targetC] === 0) {
                                    moves.push({ fromR: r, fromC: c, toR: targetR, toC: targetC, isJump: false });
                                } else {
                                    break;
                                }
                                targetR += dr; targetC += dc;
                            }
                        }
                    } else {
                        const dirs = isKing 
                            ? [[-1,-1],[-1,1],[1,-1],[1,1]]
                            : (turn === 1 ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
                        
                        for (const [dr, dc] of dirs) {
                            const targetR = r + dr, targetC = c + dc;
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
        return moves;
    },

    getCurrentPuzzle(diff) {
        const pool = this.puzzles[diff] || this.puzzles.medium;
        const seed = this.getDaySeed();
        let index = seed % pool.length;

        for (let i = 0; i < pool.length; i++) {
            const candidateIdx = (index + i) % pool.length;
            const puzzle = pool[candidateIdx];
            if (this.validatePuzzleSolvability(puzzle)) {
                return puzzle;
            }
        }
        return pool[0];
    },

    init() {
        this.bindEvents();
        this.updateUI();
    },

    openModal() {
        const modal = document.getElementById('daily-challenge-modal');
        if (modal) {
            this.updateUI();
            modal.classList.add('active');
        }
    },

    closeModal() {
        const modal = document.getElementById('daily-challenge-modal');
        if (modal) modal.classList.remove('active');
    },

    bindEvents() {
        const diffBtns = document.querySelectorAll('#daily-diff-tabs .diff-tab-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                SoundSystem.play('click');
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedDifficulty = btn.getAttribute('data-diff') || 'medium';
                this.updateUI();
            });
        });

        const menuDailyBtn = document.getElementById('daily-challenge-btn');
        if (menuDailyBtn) {
            menuDailyBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.openModal();
            });
        }

        const closeBtn = document.getElementById('close-daily-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.closeModal();
            });
        }

        const launchBtn = document.getElementById('daily-launch-btn');
        if (launchBtn) {
            launchBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                this.launchSelectedChallenge();
            });
        }

        // Daily Solved Modal buttons
        const solvedMenuBtn = document.getElementById('daily-solved-menu-btn');
        if (solvedMenuBtn) {
            solvedMenuBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                const modal = document.getElementById('daily-solved-modal');
                if (modal) modal.classList.remove('active');
                gameStateManager.showScreen('main-menu');
            });
        }

        const solvedNextBtn = document.getElementById('daily-solved-next-btn');
        if (solvedNextBtn) {
            solvedNextBtn.addEventListener('click', () => {
                SoundSystem.play('click');
                const modal = document.getElementById('daily-solved-modal');
                if (modal) modal.classList.remove('active');
                this.openModal();
            });
        }
    },

    updateUI() {
        const puzzle = this.getCurrentPuzzle(this.selectedDifficulty);
        const titleEl = document.getElementById('daily-challenge-title');
        const descEl = document.getElementById('daily-challenge-desc');
        const badgeEl = document.getElementById('daily-challenge-badge');
        const statusEl = document.getElementById('daily-challenge-status');
        const dateBadge = document.getElementById('daily-date-badge');
        const launchBtn = document.getElementById('daily-launch-btn');

        const todayStr = new Date().toISOString().split('T')[0];
        if (dateBadge) {
            const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            dateBadge.textContent = `CHALLENGE FOR ${formattedDate.toUpperCase()}`;
        }

        if (titleEl) titleEl.textContent = puzzle.title;
        if (descEl) descEl.textContent = puzzle.desc;
        if (badgeEl) badgeEl.textContent = `${this.selectedDifficulty.toUpperCase()} PUZZLE`;

        const isSolved = localStorage.getItem(`damma-daily-${todayStr}-${puzzle.id}`) === 'true';

        if (statusEl) {
            if (isSolved) {
                statusEl.textContent = '🏆 Completed';
                statusEl.classList.add('solved');
            } else {
                statusEl.textContent = '⚡ Unsolved';
                statusEl.classList.remove('solved');
            }
        }

        if (launchBtn) {
            launchBtn.textContent = isSolved ? '⚔️ Replay Challenge' : '⚔️ Launch Challenge';
        }
    },

    launchSelectedChallenge() {
        const puzzle = this.getCurrentPuzzle(this.selectedDifficulty);
        const data = puzzle.setup();
        const todayStr = new Date().toISOString().split('T')[0];

        const payload = JSON.stringify({
            board: data.board,
            turn: data.turn,
            p1Count: data.p1Count,
            p2Count: data.p2Count,
            dailyId: puzzle.id,
            todayStr: todayStr,
            title: puzzle.title
        });

        localStorage.setItem('damma-challenge-board', payload);
        localStorage.setItem('damma-active-daily-challenge', payload);
        localStorage.setItem('damma-active-daily-meta', JSON.stringify({
            dailyId: puzzle.id,
            todayStr: todayStr,
            title: puzzle.title
        }));

        if (gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.terminate();
        }
        localStorage.removeItem('damma-saved-game');
        this.closeModal();
        gameStateManager.showScreen('gameplay-screen');
        gameStateManager.activeGameInstance = createGame();
        updateDynamicUI();

        const instr = document.getElementById('instruction-text');
        if (instr) {
            instr.textContent = `👑 DAILY CHALLENGE [${this.selectedDifficulty.toUpperCase()}]: ${puzzle.title}`;
        }
        SoundSystem.play('king');
    },

    showSuccessModal(dailyMeta) {
        const modal = document.getElementById('daily-solved-modal');
        const pName = document.getElementById('daily-solved-puzzle-name');
        if (pName && dailyMeta && dailyMeta.title) {
            pName.textContent = dailyMeta.title;
        }
        if (modal) {
            modal.classList.add('active');
            SoundSystem.play('win');
        }
    }
};

function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = val;
}
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

const ThemeManager = {
    STORAGE_KEY: 'damma-theme',
    LEGACY_STORAGE_KEY: 'damma-accessibility-theme-mode',
    SUPPORTED_MODES: ['wood', 'dark', 'light', 'system'],

    init() {
        if (typeof window !== 'undefined' && window.matchMedia) {
            try {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    const currentMode = this.getSavedMode();
                    if (currentMode === 'system') {
                        this.applyTheme('system', false);
                    }
                });
            } catch (e) {
                console.error("System theme change listener error:", e);
            }
        }
        this.applyTheme(this.getSavedMode(), false);
    },

    getSavedMode() {
        let saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) {
            saved = localStorage.getItem(this.LEGACY_STORAGE_KEY);
            if (saved === 'auto') saved = 'system';
        }
        if (!saved || !this.SUPPORTED_MODES.includes(saved)) {
            return 'wood'; // Default theme on first install
        }
        return saved;
    },

    applyTheme(requestedMode, persist = true) {
        let mode = requestedMode;
        if (!mode || !this.SUPPORTED_MODES.includes(mode)) {
            mode = this.getSavedMode();
        }

        if (persist) {
            try {
                localStorage.setItem(this.STORAGE_KEY, mode);
                localStorage.setItem(this.LEGACY_STORAGE_KEY, mode);
            } catch (e) {
                console.error("Failed to save theme to localStorage:", e);
            }
        }

        let activeTheme = mode;
        if (mode === 'system') {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            activeTheme = prefersDark ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', activeTheme);
        document.documentElement.setAttribute('data-theme-mode', mode);
        if (document.body) {
            document.body.setAttribute('data-theme', activeTheme);
            document.body.setAttribute('data-theme-mode', mode);
        }

        document.querySelectorAll('#accessibility-theme-mode button').forEach(btn => {
            const val = btn.getAttribute('data-val');
            btn.classList.toggle('active', val === mode);
        });

        if (typeof redrawStonePreviews === 'function') {
            redrawStonePreviews();
        }

        if (typeof gameStateManager !== 'undefined' && gameStateManager.activeGameInstance) {
            gameStateManager.activeGameInstance.triggerColorUpdate();
        }
    }
};

function applyTheme(requestedMode) {
    ThemeManager.applyTheme(requestedMode, true);
}

// Call immediately on script execution to restore saved theme at start
ThemeManager.init();

function loadAllSettingsIntoUI() {
    try {
        // 1. RULES TAB
        setCheck('rule-mandatory-capture', localStorage.getItem('damma-rule-mandatory-capture') !== 'false');
        setCheck('rule-longest-capture', localStorage.getItem('damma-rule-longest-capture') !== 'false');
        setCheck('rule-backward-capture', localStorage.getItem('damma-rule-backward-capture') === 'true');
        setCheck('rule-flying-kings', localStorage.getItem('damma-rule-flying-kings') !== 'false');
        setCheck('rule-multi-capture', localStorage.getItem('damma-rule-multi-capture') !== 'false');
        setCheck('rule-show-legal', localStorage.getItem('damma-rule-show-legal') !== 'false');
        setCheck('rule-show-hints', localStorage.getItem('damma-rule-show-hints') !== 'false');
        setCheck('rule-highlight-forced', localStorage.getItem('damma-rule-highlight-forced') !== 'false');
        setCheck('rule-enable-undo', localStorage.getItem('damma-rule-enable-undo') !== 'false');
        setCheck('rule-auto-crown', localStorage.getItem('damma-rule-auto-crown') !== 'false');
        setCheck('rule-show-last', localStorage.getItem('damma-rule-show-last') !== 'false');
        setVal('rule-move-timer', localStorage.getItem('damma-rule-move-timer') || '0');
        setVal('rule-match-timer', localStorage.getItem('damma-rule-match-timer') || '0');

        const activePreset = localStorage.getItem('damma-rule-preset') || 'traditional';
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-preset') === activePreset);
        });

        // 1b. RULE VARIANT CARDS (Egregna / Toregna)
        const selectedRule = localStorage.getItem('damma-selected-rule') || 'egregna';
        document.querySelectorAll('.rule-variant-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-rule') === selectedRule);
        });

        // Sync main menu rules checkbox if present
        const forceCapToggle = document.getElementById('force-capture-toggle');
        if (forceCapToggle) {
            forceCapToggle.checked = localStorage.getItem('damma-rule-mandatory-capture') !== 'false';
        }

        // 2. BOARD THEMES TAB
        const activeBoardTheme = localStorage.getItem('damma-board-theme') || 'traditional_wood';
        document.querySelectorAll('.board-theme-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-board-theme') === activeBoardTheme);
        });

        // 4. AI TAB
        const aiStrength = localStorage.getItem('damma-ai-strength') || 'medium';
        document.querySelectorAll('#ai-strength-bar button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-val') === aiStrength);
        });
        setVal('ai-personality-select', localStorage.getItem('damma-ai-personality') || 'balanced');
        const aiDepth = localStorage.getItem('damma-ai-thinking-depth') || 'normal';
        document.querySelectorAll('#ai-depth-bar button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-val') === aiDepth);
        });
        setCheck('ai-show-thinking', localStorage.getItem('damma-ai-show-thinking') !== 'false');

        // 5. AUDIO TAB
        const masterVol = localStorage.getItem('damma-master-volume') || '80';
        setVal('range-master-volume', masterVol);
        setText('val-master-volume', `${masterVol}%`);

        const musicVol = localStorage.getItem('damma-music-volume') || '50';
        setVal('range-music-volume', musicVol);
        setText('val-music-volume', `${musicVol}%`);

        const sfxVol = localStorage.getItem('damma-sfx-volume') || '80';
        setVal('range-sfx-volume', sfxVol);
        setText('val-sfx-volume', `${sfxVol}%`);

        setCheck('sfx-move-sound', localStorage.getItem('damma-sfx-move-sound') !== 'false');
        setCheck('sfx-capture-sound', localStorage.getItem('damma-sfx-capture-sound') !== 'false');
        setCheck('sfx-victory-sound', localStorage.getItem('damma-sfx-victory-sound') !== 'false');
        setCheck('sfx-click-sound', localStorage.getItem('damma-sfx-click-sound') !== 'false');
        setCheck('sfx-ambient-enabled', localStorage.getItem('damma-sfx-ambient-enabled') !== 'false');
        setCheck('audio-mute-all', localStorage.getItem('damma-audio-mute-all') === 'true');

        if (typeof gameStateManager !== 'undefined') {
            gameStateManager.soundEnabled = localStorage.getItem('damma-audio-mute-all') !== 'true';
            gameStateManager.updateSoundUI();
        }

        // 6. GAMEPLAY TAB
        setVal('gameplay-anim-speed', localStorage.getItem('damma-gameplay-anim-speed') || 'normal');
        setCheck('gameplay-piece-anim', localStorage.getItem('damma-gameplay-piece-anim') !== 'false');
        setCheck('gameplay-board-rotation', localStorage.getItem('damma-gameplay-board-rotation') === 'true');
        setCheck('gameplay-coordinates', localStorage.getItem('damma-gameplay-coordinates') !== 'false');
        setCheck('gameplay-confirm-restart', localStorage.getItem('damma-gameplay-confirm-restart') !== 'false');
        setCheck('gameplay-confirm-exit', localStorage.getItem('damma-gameplay-confirm-exit') !== 'false');
        setCheck('gameplay-autosave', localStorage.getItem('damma-gameplay-autosave') !== 'false');
        setCheck('gameplay-resume', localStorage.getItem('damma-gameplay-resume') !== 'false');
        setCheck('gameplay-vibration', localStorage.getItem('damma-gameplay-vibration') !== 'false');
        setCheck('gameplay-fps-counter', localStorage.getItem('damma-gameplay-fps-counter') === 'true');

        // 7. ACCESSIBILITY TAB
        const accessMode = ThemeManager.getSavedMode();
        ThemeManager.applyTheme(accessMode, false);
        setCheck('access-high-contrast', localStorage.getItem('damma-access-high-contrast') === 'true');
        setCheck('access-large-text', localStorage.getItem('damma-access-large-text') === 'true');
        setCheck('access-large-pieces', localStorage.getItem('damma-access-large-pieces') === 'true');
        setVal('access-colorblind', localStorage.getItem('damma-access-colorblind') || 'none');
        setCheck('access-reduced-motion', localStorage.getItem('damma-access-reduced-motion') === 'true');

        // Apply accessibility class states directly to document body for real-time CSS triggers
        document.body.classList.toggle('access-large-text', localStorage.getItem('damma-access-large-text') === 'true');
        document.body.classList.toggle('access-high-contrast', localStorage.getItem('damma-access-high-contrast') === 'true');
        document.body.classList.toggle('access-reduced-motion', localStorage.getItem('damma-access-reduced-motion') === 'true');

        // 8. PROFILE TAB
        setVal('profile-name-input', localStorage.getItem('damma-profile-name') || 'Warrior');
        setVal('profile-country-input', localStorage.getItem('damma-profile-country') || 'Ethiopia');
        const activeAvatar = localStorage.getItem('damma-profile-avatar') || 'warrior';
        document.querySelectorAll('#avatar-grid button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-avatar') === activeAvatar);
        });

        // 9. PREMIUM HOLIDAY THEME
        setVal('premium-holiday-theme', localStorage.getItem('damma-premium-holiday-theme') || 'none');

        // 10. SYSTEM LANGUAGE
        const currentLang = localStorage.getItem('damma-language-toggle-bar') || 'en';
        document.querySelectorAll('#language-toggle-bar button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-val') === currentLang);
        });

        // Clear any residual legacy statistics keys from localStorage
        ['damma-stat-played', 'damma-stat-wins', 'damma-stat-losses', 'damma-stat-draws', 'damma-stat-streak'].forEach(k => {
            localStorage.removeItem(k);
        });

        // Custom nickname triggers
        const nameLabels = document.querySelectorAll('.p-name-label');
        if (nameLabels.length > 0) {
            nameLabels.forEach(lbl => {
                lbl.textContent = localStorage.getItem('damma-profile-name') || 'Warrior';
            });
        }

        // Apply dynamic translations
        applyLocalization();
    } catch (e) {
        console.error("Error populating system configuration UI:", e);
    }
}

function setupSettingsPanel() {
    // 1. MODAL VISIBILITY TRIGGERS
    const modal = document.getElementById('settings-modal');
    const openBtnMenu = document.getElementById('settings-toggle-btn');
    const menuSettingsBtn = document.getElementById('menu-settings-btn');
    const openBtnHud = document.getElementById('hud-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');

    const achievementsModal = document.getElementById('achievements-modal');
    const menuAchievBtn = document.getElementById('menu-achievements-btn');
    const closeAchievBtn = document.getElementById('close-achievements-btn');

    const menuHowToPlayBtn = document.getElementById('menu-how-to-play-btn');

    const showModal = () => {
        SoundSystem.play('click');
        if (modal) modal.classList.add('active');
        loadAllSettingsIntoUI();
    };

    const hideModal = () => {
        SoundSystem.play('click');
        if (modal) modal.classList.remove('active');
    };

    if (openBtnMenu) openBtnMenu.addEventListener('click', showModal);
    if (menuSettingsBtn) menuSettingsBtn.addEventListener('click', showModal);
    if (openBtnHud) openBtnHud.addEventListener('click', showModal);
    if (closeBtn) closeBtn.addEventListener('click', hideModal);

    // How to Play button -> Open Settings directly to Tutorial tab
    if (menuHowToPlayBtn) {
        menuHowToPlayBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            if (modal) modal.classList.add('active');
            loadAllSettingsIntoUI();
            
            // Switch tab to tutorial
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
            
            const tutNav = document.querySelector('.settings-nav-item[data-tab="tutorial"]');
            const tutPane = document.getElementById('pane-tutorial');
            if (tutNav) tutNav.classList.add('active');
            if (tutPane) tutPane.classList.add('active');

            if (typeof TutorialManager !== 'undefined') {
                TutorialManager.renderStep(TutorialManager.currentStep);
            }
        });
    }

    // Achievements Modal
    if (menuAchievBtn) {
        menuAchievBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            loadAllSettingsIntoUI();
            if (achievementsModal) achievementsModal.classList.add('active');
        });
    }
    if (closeAchievBtn) {
        closeAchievBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            if (achievementsModal) achievementsModal.classList.remove('active');
        });
    }

    if (openBtnMenu) openBtnMenu.addEventListener('click', showModal);
    if (openBtnHud) openBtnHud.addEventListener('click', showModal);
    if (closeBtn) closeBtn.addEventListener('click', hideModal);

    // Overlay click back-out
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // 2. SIDEBAR TAB SELECTIONS
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            SoundSystem.play('click');
            const targetTab = item.getAttribute('data-tab');
            
            // Toggle active classes
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Toggle pane content visibility
            document.querySelectorAll('.settings-pane').forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `pane-${targetTab}`) {
                    pane.classList.add('active');
                }
            });

            if (targetTab === 'tutorial' && typeof TutorialManager !== 'undefined') {
                TutorialManager.renderStep(TutorialManager.currentStep);
            }

            // Mobile sliding transition trigger
            const bodyEl = document.querySelector('#settings-modal .settings-body');
            if (bodyEl) {
                bodyEl.classList.add('show-pane');
            }
        });
    });

    // Mobile back to navigation list
    const backBtn = document.getElementById('settings-mobile-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            const bodyEl = document.querySelector('#settings-modal .settings-body');
            if (bodyEl) {
                bodyEl.classList.remove('show-pane');
            }
        });
    }

    // 3. LAZY AMBIENT AUDIO SYSTEM BOOT
    AmbientSynth.start();

    // 4. RULES BINDINGS
    const ruleKeys = [
        'rule-mandatory-capture',
        'rule-longest-capture',
        'rule-backward-capture',
        'rule-flying-kings',
        'rule-multi-capture',
        'rule-show-legal',
        'rule-show-hints',
        'rule-highlight-forced',
        'rule-enable-undo',
        'rule-auto-crown',
        'rule-show-last'
    ];

    ruleKeys.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                SoundSystem.play('click');
                localStorage.setItem(`damma-${id}`, el.checked ? 'true' : 'false');
                localStorage.setItem('damma-rule-preset', 'custom');
                loadAllSettingsIntoUI();
            });
        }
    });

    const moveTimerSelect = document.getElementById('rule-move-timer');
    if (moveTimerSelect) {
        moveTimerSelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-rule-move-timer', moveTimerSelect.value);
            localStorage.setItem('damma-rule-preset', 'custom');
            loadAllSettingsIntoUI();
        });
    }

    const matchTimerSelect = document.getElementById('rule-match-timer');
    if (matchTimerSelect) {
        matchTimerSelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-rule-match-timer', matchTimerSelect.value);
            localStorage.setItem('damma-rule-preset', 'custom');
            loadAllSettingsIntoUI();
            if (gameStateManager && gameStateManager.activeGameInstance) {
                gameStateManager.activeGameInstance.triggerColorUpdate();
            }
        });
    }

    // Rule Preset Cards Click Handler
    document.querySelectorAll('.preset-card').forEach(card => {
        card.addEventListener('click', () => {
            SoundSystem.play('click');
            const presetVal = card.getAttribute('data-preset');
            localStorage.setItem('damma-rule-preset', presetVal);

            if (presetVal === 'traditional') {
                localStorage.setItem('damma-rule-mandatory-capture', 'true');
                localStorage.setItem('damma-rule-longest-capture', 'true');
                localStorage.setItem('damma-rule-backward-capture', 'false');
                localStorage.setItem('damma-rule-flying-kings', 'true');
                localStorage.setItem('damma-rule-multi-capture', 'true');
            } else if (presetVal === 'flying_kings') {
                localStorage.setItem('damma-rule-mandatory-capture', 'false');
                localStorage.setItem('damma-rule-longest-capture', 'false');
                localStorage.setItem('damma-rule-backward-capture', 'true');
                localStorage.setItem('damma-rule-flying-kings', 'true');
                localStorage.setItem('damma-rule-multi-capture', 'true');
            } else if (presetVal === 'standard_kings') {
                localStorage.setItem('damma-rule-mandatory-capture', 'true');
                localStorage.setItem('damma-rule-longest-capture', 'false');
                localStorage.setItem('damma-rule-backward-capture', 'false');
                localStorage.setItem('damma-rule-flying-kings', 'false');
                localStorage.setItem('damma-rule-multi-capture', 'false');
            }

            loadAllSettingsIntoUI();
        });
    });

    // Rule Variant Cards (Egregna / Toregna) Click Handler
    document.querySelectorAll('.rule-variant-card').forEach(card => {
        card.addEventListener('click', () => {
            SoundSystem.play('click');
            const ruleVal = card.getAttribute('data-rule');
            localStorage.setItem('damma-selected-rule', ruleVal);
            loadAllSettingsIntoUI();
            if (typeof gameStateManager !== 'undefined' && gameStateManager.activeGameInstance) {
                gameStateManager.activeGameInstance.triggerColorUpdate();
            }
        });
    });

    // 5. BOARD THEMES BINDINGS
    document.querySelectorAll('.board-theme-card').forEach(card => {
        card.addEventListener('click', () => {
            SoundSystem.play('click');
            const boardVal = card.getAttribute('data-board-theme');
            localStorage.setItem('damma-board-theme', boardVal);
            loadAllSettingsIntoUI();
        });
    });

    // 7. AI BINDINGS
    document.querySelectorAll('#ai-strength-bar button').forEach(btn => {
        btn.addEventListener('click', () => {
            SoundSystem.play('click');
            const strVal = btn.getAttribute('data-val');
            localStorage.setItem('damma-ai-strength', strVal);
            gameStateManager.difficulty = strVal; // sync to engine difficulty
            loadAllSettingsIntoUI();
        });
    });

    const aiPersonalitySelect = document.getElementById('ai-personality-select');
    if (aiPersonalitySelect) {
        aiPersonalitySelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-ai-personality', aiPersonalitySelect.value);
            loadAllSettingsIntoUI();
        });
    }

    document.querySelectorAll('#ai-depth-bar button').forEach(btn => {
        btn.addEventListener('click', () => {
            SoundSystem.play('click');
            const depthVal = btn.getAttribute('data-val');
            localStorage.setItem('damma-ai-thinking-depth', depthVal);
            loadAllSettingsIntoUI();
        });
    });

    const aiShowThinkingBox = document.getElementById('ai-show-thinking');
    if (aiShowThinkingBox) {
        aiShowThinkingBox.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-ai-show-thinking', aiShowThinkingBox.checked ? 'true' : 'false');
            loadAllSettingsIntoUI();
        });
    }

    // 8. AUDIO BINDINGS
    const masterVolRange = document.getElementById('range-master-volume');
    if (masterVolRange) {
        masterVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-master-volume', masterVolRange.value);
            document.getElementById('val-master-volume').textContent = `${masterVolRange.value}%`;
        });
        masterVolRange.addEventListener('change', () => {
            SoundSystem.play('click');
        });
    }

    const musicVolRange = document.getElementById('range-music-volume');
    if (musicVolRange) {
        musicVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-music-volume', musicVolRange.value);
            document.getElementById('val-music-volume').textContent = `${musicVolRange.value}%`;
        });
        musicVolRange.addEventListener('change', () => {
            SoundSystem.play('click');
        });
    }

    const sfxVolRange = document.getElementById('range-sfx-volume');
    if (sfxVolRange) {
        sfxVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-sfx-volume', sfxVolRange.value);
            document.getElementById('val-sfx-volume').textContent = `${sfxVolRange.value}%`;
        });
        sfxVolRange.addEventListener('change', () => {
            SoundSystem.play('click');
        });
    }

    const sfxCheckboxes = [
        'sfx-move-sound',
        'sfx-capture-sound',
        'sfx-victory-sound',
        'sfx-click-sound',
        'sfx-ambient-enabled'
    ];

    sfxCheckboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                SoundSystem.play('click');
                localStorage.setItem(`damma-${id}`, el.checked ? 'true' : 'false');
                loadAllSettingsIntoUI();
            });
        }
    });

    const muteAllBox = document.getElementById('audio-mute-all');
    if (muteAllBox) {
        muteAllBox.addEventListener('change', () => {
            gameStateManager.setSoundEnabled(!muteAllBox.checked);
            SoundSystem.play('click');
        });
    }

    // 9. GAMEPLAY BINDINGS
    const gameplayKeys = [
        'gameplay-piece-anim',
        'gameplay-board-rotation',
        'gameplay-coordinates',
        'gameplay-confirm-restart',
        'gameplay-confirm-exit',
        'gameplay-autosave',
        'gameplay-resume',
        'gameplay-vibration',
        'gameplay-fps-counter'
    ];

    gameplayKeys.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                SoundSystem.play('click');
                localStorage.setItem(`damma-${id}`, el.checked ? 'true' : 'false');
                loadAllSettingsIntoUI();
            });
        }
    });

    const animSpeedSelect = document.getElementById('gameplay-anim-speed');
    if (animSpeedSelect) {
        animSpeedSelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-gameplay-anim-speed', animSpeedSelect.value);
            loadAllSettingsIntoUI();
        });
    }

    // 10. ACCESSIBILITY BINDINGS
    document.querySelectorAll('#accessibility-theme-mode button').forEach(btn => {
        btn.addEventListener('click', () => {
            SoundSystem.play('click');
            const modeVal = btn.getAttribute('data-val');
            ThemeManager.applyTheme(modeVal, true);
            loadAllSettingsIntoUI();
        });
    });

    const accessKeys = [
        'access-high-contrast',
        'access-large-text',
        'access-large-pieces',
        'access-reduced-motion'
    ];

    accessKeys.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                SoundSystem.play('click');
                localStorage.setItem(`damma-${id}`, el.checked ? 'true' : 'false');
                loadAllSettingsIntoUI();
            });
        }
    });

    const colorblindSelect = document.getElementById('access-colorblind');
    if (colorblindSelect) {
        colorblindSelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-access-colorblind', colorblindSelect.value);
            loadAllSettingsIntoUI();
        });
    }

    // 11. PROFILE CREATION & RECORD ACTIONS
    const nameInput = document.getElementById('profile-name-input');
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            localStorage.setItem('damma-profile-name', nameInput.value);
            // Sync current ELO labels and nickname displays in real-time
            document.querySelectorAll('.p-name-label').forEach(lbl => {
                lbl.textContent = nameInput.value;
            });
        });
    }

    const countryInput = document.getElementById('profile-country-input');
    if (countryInput) {
        countryInput.addEventListener('input', () => {
            localStorage.setItem('damma-profile-country', countryInput.value);
        });
    }

    document.querySelectorAll('#avatar-grid button').forEach(btn => {
        btn.addEventListener('click', () => {
            SoundSystem.play('click');
            const avVal = btn.getAttribute('data-avatar');
            localStorage.setItem('damma-profile-avatar', avVal);
            loadAllSettingsIntoUI();
        });
    });

    // 12. DATA MANAGEMENT WORKFLOWS
    // 📤 Export settings
    const exportBtn = document.getElementById('data-export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            try {
                const payload = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('damma-')) {
                        payload[key] = localStorage.getItem(key);
                    }
                }
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${localStorage.getItem('damma-profile-name') || 'Warrior'}_damma_settings.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                alert(t('alert_export_failed', "Failed to export settings text: ") + err.message);
            }
        });
    }

    // 📥 Import settings
    const importBtn = document.getElementById('data-import-btn');
    const importFileInput = document.getElementById('settings-import-file');
    if (importBtn && importFileInput) {
        importBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            importFileInput.click();
        });

        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    Object.keys(data).forEach(key => {
                        if (key.startsWith('damma-')) {
                            localStorage.setItem(key, data[key]);
                        }
                    });
                    SoundSystem.play('king');
                    loadAllSettingsIntoUI();
                    alert(t('alert_restore_success', "✨ Configuration and profile statistics restored successfully!"));
                } catch (err) {
                    alert(t('alert_invalid_backup', "⚠️ Invalid backup configuration file. Please provide a valid Damma JSON file."));
                }
            };
            reader.readAsText(file);
        });
    }

    // 🔄 Reset Settings to default
    const resetSettingsBtn = document.getElementById('data-reset-btn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', () => {
            if (confirm(t('confirm_restore_settings', "Are you sure you want to restore all settings?"))) {
                SoundSystem.play('click');
                const profileKeys = [
                    'damma-profile-name',
                    'damma-profile-country',
                    'damma-profile-avatar'
                ];
                // Save profile settings temporarily
                const profileData = {};
                profileKeys.forEach(k => {
                    profileData[k] = localStorage.getItem(k);
                });

                // Clear all damma keys
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('damma-')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));

                // Restore profile
                profileKeys.forEach(k => {
                    if (profileData[k] !== null) {
                        localStorage.setItem(k, profileData[k]);
                    }
                });

                loadAllSettingsIntoUI();
                alert(t('alert_settings_reset', "🔄 Settings reset to factory defaults successfully."));
            }
        });
    }

    // 🗑️ Delete Saved Matches
    const clearGameBtn = document.getElementById('data-clear-game-btn');
    if (clearGameBtn) {
        clearGameBtn.addEventListener('click', () => {
            if (confirm(t('confirm_delete_autosave', "Are you sure you want to delete any current autosaved in-progress matchups?"))) {
                SoundSystem.play('click');
                localStorage.removeItem('damma-saved-game');
                alert(t('alert_saved_matches_deleted', "🗑️ Saved matches deleted."));
            }
        });
    }

    // 13. PREMIUM EXTRA CONTENT ACTIONS
    const premiumHolidayThemeSelect = document.getElementById('premium-holiday-theme');
    if (premiumHolidayThemeSelect) {
        premiumHolidayThemeSelect.addEventListener('change', () => {
            SoundSystem.play('click');
            localStorage.setItem('damma-premium-holiday-theme', premiumHolidayThemeSelect.value);
            loadAllSettingsIntoUI();
        });
    }

    const langToggleBar = document.getElementById('language-toggle-bar');
    if (langToggleBar) {
        langToggleBar.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                SoundSystem.play('click');
                const lang = btn.getAttribute('data-val');
                localStorage.setItem('damma-language-toggle-bar', lang);
                loadAllSettingsIntoUI();
            });
        });
    }

    // 📅 Traditional Daily Challenge Button Click
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    if (dailyChallengeBtn) {
        dailyChallengeBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            if (typeof DailyChallengeSystem !== 'undefined') {
                DailyChallengeSystem.openModal();
            }
            if (modal) modal.classList.remove('active');
        });
    }

    // 🧩 Launch Puzzles Button Click
    const launchPuzzBtn = document.getElementById('launch-puzzles-btn');
    if (launchPuzzBtn) {
        launchPuzzBtn.addEventListener('click', () => {
            SoundSystem.play('click');
            // Seed puzzle layout (Tactical sequence)
            const seedBoard = Array(8).fill(null).map(() => Array(8).fill(0));
            seedBoard[3][4] = -1; // CPU regular
            seedBoard[1][6] = -1; // CPU regular
            seedBoard[5][2] = 1;  // Player regular
            seedBoard[6][1] = 1;  // Player regular

            localStorage.setItem('damma-challenge-board', JSON.stringify({
                board: seedBoard,
                turn: 1,
                p1Count: 2,
                p2Count: 2
            }));

            if (gameStateManager.activeGameInstance) {
                gameStateManager.activeGameInstance.terminate();
            }
            localStorage.removeItem('damma-saved-game');
            gameStateManager.showScreen('gameplay-screen');
            gameStateManager.activeGameInstance = createGame();
            updateDynamicUI();

            document.getElementById('instruction-text').textContent = "🧩 PUZZLE: Trigger a multi-capture to win instantly!";
            SoundSystem.play('king');

            if (modal) modal.classList.remove('active');
        });
    }

    // INITIAL RUN: Populate configuration and Online UI
    loadAllSettingsIntoUI();
    initOnlineUI();
}

// ==========================================================================
// 🚀 APPLICATION KICKSTART ENTRYPOINT
// ==========================================================================
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeGameApp);
} else {
    initializeGameApp();
}
