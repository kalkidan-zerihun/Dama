/**
 * ⚙️ SETTINGS MODULE
 * Handles Settings modal, themes, audio sliders, accessibility, data backup/restore.
 * Loaded dynamically on-demand when the user opens Settings.
 */

export const ThemeManager = {
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

    getSavedMode(): string {
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

    applyTheme(requestedMode?: string, persist = true) {
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
    }
};

function setCheck(id: string, val: boolean) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.checked = val;
}
function setVal(id: string, val: string) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (el) el.value = val;
}
function setText(id: string, val: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

export function loadAllSettingsIntoUI() {
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

        // Rule variant (Egregna / Toregna)
        const selectedRule = localStorage.getItem('damma-selected-rule') || 'egregna';
        document.querySelectorAll('.rule-variant-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-rule') === selectedRule);
        });

        // 2. AUDIO TAB
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

        // 3. ACCESSIBILITY TAB
        const accessMode = ThemeManager.getSavedMode();
        ThemeManager.applyTheme(accessMode, false);
        setCheck('access-high-contrast', localStorage.getItem('damma-access-high-contrast') === 'true');
        setCheck('access-large-text', localStorage.getItem('damma-access-large-text') === 'true');
        setCheck('access-large-pieces', localStorage.getItem('damma-access-large-pieces') === 'true');
        setVal('access-colorblind', localStorage.getItem('damma-access-colorblind') || 'none');
        setCheck('access-reduced-motion', localStorage.getItem('damma-access-reduced-motion') === 'true');

        document.body.classList.toggle('access-large-text', localStorage.getItem('damma-access-large-text') === 'true');
        document.body.classList.toggle('access-high-contrast', localStorage.getItem('damma-access-high-contrast') === 'true');
        document.body.classList.toggle('access-reduced-motion', localStorage.getItem('damma-access-reduced-motion') === 'true');

        // 4. PROFILE TAB
        setVal('profile-name-input', localStorage.getItem('damma-profile-name') || 'Warrior');
        setVal('profile-country-input', localStorage.getItem('damma-profile-country') || 'Ethiopia');
        const activeAvatar = localStorage.getItem('damma-profile-avatar') || 'warrior';
        document.querySelectorAll('#avatar-grid button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-avatar') === activeAvatar);
        });

        // Profile labels update
        document.querySelectorAll('.p-name-label').forEach(lbl => {
            lbl.textContent = localStorage.getItem('damma-profile-name') || 'Warrior';
        });
    } catch (e) {
        console.error("Error populating system configuration UI:", e);
    }
}

export function openSettingsModal(initialTab = 'rules') {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    loadAllSettingsIntoUI();
    modal.classList.add('active');

    // Switch active tab if requested
    if (initialTab) {
        document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));

        const targetNav = document.querySelector(`.settings-nav-item[data-tab="${initialTab}"]`);
        const targetPane = document.getElementById(`pane-${initialTab}`);
        if (targetNav) targetNav.classList.add('active');
        if (targetPane) targetPane.classList.add('active');
    }
}

export function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
}

export function initSettingsModule() {
    ThemeManager.init();

    // Bind settings triggers
    const modal = document.getElementById('settings-modal');
    const openBtnMenu = document.getElementById('settings-toggle-btn');
    const menuSettingsBtn = document.getElementById('menu-settings-btn');
    const openBtnHud = document.getElementById('hud-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');

    const showModal = () => openSettingsModal('rules');
    const hideModal = () => closeSettingsModal();

    if (openBtnMenu) openBtnMenu.addEventListener('click', showModal);
    if (menuSettingsBtn) menuSettingsBtn.addEventListener('click', showModal);
    if (openBtnHud) openBtnHud.addEventListener('click', showModal);
    if (closeBtn) closeBtn.addEventListener('click', hideModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }

    // Sidebar tab selections
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.settings-pane').forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `pane-${targetTab}`) {
                    pane.classList.add('active');
                }
            });

            if (targetTab === 'tutorial') {
                import('./tutorial.js').then(mod => mod.initTutorialModule());
            }

            const bodyEl = document.querySelector('#settings-modal .settings-body');
            if (bodyEl) bodyEl.classList.add('show-pane');
        });
    });

    const backBtn = document.getElementById('settings-mobile-back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const bodyEl = document.querySelector('#settings-modal .settings-body');
            if (bodyEl) bodyEl.classList.remove('show-pane');
        });
    }

    // Volume Sliders
    const masterVolRange = document.getElementById('range-master-volume') as HTMLInputElement | null;
    if (masterVolRange) {
        masterVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-master-volume', masterVolRange.value);
            const label = document.getElementById('val-master-volume');
            if (label) label.textContent = `${masterVolRange.value}%`;
        });
    }

    const musicVolRange = document.getElementById('range-music-volume') as HTMLInputElement | null;
    if (musicVolRange) {
        musicVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-music-volume', musicVolRange.value);
            const label = document.getElementById('val-music-volume');
            if (label) label.textContent = `${musicVolRange.value}%`;
        });
    }

    const sfxVolRange = document.getElementById('range-sfx-volume') as HTMLInputElement | null;
    if (sfxVolRange) {
        sfxVolRange.addEventListener('input', () => {
            localStorage.setItem('damma-sfx-volume', sfxVolRange.value);
            const label = document.getElementById('val-sfx-volume');
            if (label) label.textContent = `${sfxVolRange.value}%`;
        });
    }

    // Theme selector
    document.querySelectorAll('#accessibility-theme-mode button').forEach(btn => {
        btn.addEventListener('click', () => {
            const modeVal = btn.getAttribute('data-val') || 'wood';
            ThemeManager.applyTheme(modeVal, true);
            loadAllSettingsIntoUI();
        });
    });
}
