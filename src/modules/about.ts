/**
 * ℹ️ ABOUT MODULE
 * About Axumit Studios, game rules documentation, version info.
 * Loaded dynamically on-demand when user clicks About.
 */

export function initAboutModule() {
    const modal = document.getElementById('about-modal');
    if (modal) modal.classList.add('active');

    const closeBtn = document.getElementById('about-modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }
}
