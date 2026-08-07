/**
 * 👤 PROFILE MODULE
 * User Profile stats, nickname manager, avatar grid selector, country flags.
 * Loaded dynamically on-demand when user opens Profile modal or tab.
 */

export const ProfileManager = {
    init() {
        this.bindEvents();
        this.loadProfile();
    },

    loadProfile() {
        const name = localStorage.getItem('damma-profile-name') || 'Warrior';
        const country = localStorage.getItem('damma-profile-country') || 'Ethiopia';
        const avatar = localStorage.getItem('damma-profile-avatar') || 'warrior';

        const nameInput = document.getElementById('profile-name-input') as HTMLInputElement | null;
        if (nameInput) nameInput.value = name;

        const countryInput = document.getElementById('profile-country-input') as HTMLInputElement | null;
        if (countryInput) countryInput.value = country;

        document.querySelectorAll('.p-name-label').forEach(lbl => {
            lbl.textContent = name;
        });

        document.querySelectorAll('#avatar-grid button').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-avatar') === avatar);
        });
    },

    bindEvents() {
        const nameInput = document.getElementById('profile-name-input') as HTMLInputElement | null;
        if (nameInput) {
            nameInput.addEventListener('change', () => {
                const val = nameInput.value.trim() || 'Warrior';
                localStorage.setItem('damma-profile-name', val);
                this.loadProfile();
            });
        }

        const countryInput = document.getElementById('profile-country-input') as HTMLInputElement | null;
        if (countryInput) {
            countryInput.addEventListener('change', () => {
                const val = countryInput.value.trim() || 'Ethiopia';
                localStorage.setItem('damma-profile-country', val);
                this.loadProfile();
            });
        }

        document.querySelectorAll('#avatar-grid button').forEach(btn => {
            btn.addEventListener('click', () => {
                const avatar = btn.getAttribute('data-avatar') || 'warrior';
                localStorage.setItem('damma-profile-avatar', avatar);
                this.loadProfile();
            });
        });
    }
};

export function initProfileModule() {
    ProfileManager.init();
}
