/**
 * 🌐 ONLINE MULTIPLAYER MODULE
 * Dynamic lazy-loading wrapper for Firebase, Auth, Firestore, Matchmaking, and Chat UI.
 * Loaded ONLY when the user clicks "PLAY ONLINE".
 */

let isOnlineInitialized = false;

export async function initOnlineMultiplayerModule() {
    if (isOnlineInitialized) {
        const modal = document.getElementById('online-lobby-modal');
        if (modal) modal.classList.add('active');
        return;
    }

    // Show loading spinner on online button
    const onlineBtn = document.getElementById('menu-play-online-btn');
    const originalText = onlineBtn ? onlineBtn.innerHTML : '';
    if (onlineBtn) {
        onlineBtn.innerHTML = '⏳ Loading Online Service...';
    }

    try {
        const onlineUI = await import('../online/onlineUI');
        onlineUI.initOnlineUI();
        isOnlineInitialized = true;

        const modal = document.getElementById('online-lobby-modal');
        if (modal) modal.classList.add('active');
    } catch (error) {
        console.error("Failed to load online multiplayer module:", error);
    } finally {
        if (onlineBtn) {
            onlineBtn.innerHTML = originalText;
        }
    }
}
