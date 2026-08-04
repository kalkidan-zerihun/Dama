import { 
  getSavedUsername, setUsername, validateUsernameFormat, 
  initPresence, updatePresenceStatus 
} from './userService';
import { 
  invitePlayerByUsername, listenToSentInvitation, cancelSentInvitation, 
  listenForIncomingInvitations, acceptInvitation, declineInvitation, 
  startRandomMatchmaking, cancelRandomMatchmaking, Invitation 
} from './matchmakingService';
import { 
  subscribeToRoom, sendOnlineMove, leaveOnlineRoom, requestOnlineRematch, RoomState 
} from './roomService';
import { ensureAuth, getCurrentUser } from './firebase';
import {
  getRankDetails, processRankedMatchRating, subscribeToLeaderboard,
  getUserRankProfile, getUserGlobalRank, getUserMatchHistory,
  searchPlayersByUsername, UserRankProfile, MatchHistoryItem
} from './rankingService';

function playSound(soundName: string) {
  if (typeof (window as any).SoundSystem?.play === 'function') {
    (window as any).SoundSystem.play(soundName);
  }
}

function getGSM(): any {
  return (window as any).gameStateManager || {};
}

let currentActiveRoomId: string | null = null;
let roomUnsubscribe: (() => void) | null = null;
let activeSentInvitationId: string | null = null;
let sentInvitationUnsub: (() => void) | null = null;
let isOnlineMatchActive = false;

// Global online state getters
export function isOnlineGame(): boolean {
  return isOnlineMatchActive && currentActiveRoomId !== null;
}

export function getCurrentOnlineRoomId(): string | null {
  return currentActiveRoomId;
}

/**
 * Initializes all Online UI components, modal event listeners, and incoming invitation handlers
 */
export function initOnlineUI() {
  ensureAuth().then(() => {
    initPresence('online');
  });

  // Listen for incoming invitations globally
  listenForIncomingInvitations((invitation: Invitation) => {
    showIncomingInvitationModal(invitation);
  });

  // 1. Bind Main Menu "Play Online" Button
  const playOnlineBtn = document.getElementById('menu-play-online-btn');
  if (playOnlineBtn) {
    playOnlineBtn.addEventListener('click', () => {
      playSound('click');
      const savedUser = getSavedUsername();
      if (!savedUser) {
        showUsernameModal(true); // First-time prompt
      } else {
        showPlayOnlineChoiceModal();
      }
    });
  }

  // 2. Bind Username Modal Controls
  const usernameSaveBtn = document.getElementById('username-save-btn');
  const usernameInput = document.getElementById('username-input') as HTMLInputElement;
  const usernameMsg = document.getElementById('username-validation-msg');

  if (usernameInput && usernameMsg) {
    usernameInput.addEventListener('input', () => {
      const val = usernameInput.value;
      const res = validateUsernameFormat(val);
      if (!res.valid) {
        usernameMsg.textContent = res.message;
        usernameMsg.style.color = '#ef4444';
      } else {
        usernameMsg.textContent = 'Username format is valid!';
        usernameMsg.style.color = '#10b981';
      }
    });
  }

  if (usernameSaveBtn && usernameInput) {
    usernameSaveBtn.addEventListener('click', async () => {
      playSound('click');
      const newName = usernameInput.value;
      if (usernameSaveBtn) usernameSaveBtn.textContent = 'Saving...';

      const result = await setUsername(newName);
      if (usernameSaveBtn) usernameSaveBtn.textContent = 'Continue';

      if (result.success) {
        hideModal('username-setup-modal');
        updateSettingsUsernameDisplay();
        showPlayOnlineChoiceModal();
      } else if (usernameMsg) {
        usernameMsg.textContent = result.message;
        usernameMsg.style.color = '#ef4444';
      }
    });
  }

  // 3. Choice Modal Options: By Username vs Random
  const choiceUsernameBtn = document.getElementById('online-choice-username-btn');
  const choiceRandomBtn = document.getElementById('online-choice-random-btn');

  if (choiceUsernameBtn) {
    choiceUsernameBtn.addEventListener('click', () => {
      playSound('click');
      hideModal('play-online-modal');
      showSearchUsernameModal();
    });
  }

  if (choiceRandomBtn) {
    choiceRandomBtn.addEventListener('click', () => {
      playSound('click');
      hideModal('play-online-modal');
      showRandomMatchModal();
    });
  }

  // 4. Search Username Modal Controls
  const searchBtn = document.getElementById('search-user-btn');
  const searchInput = document.getElementById('search-user-input') as HTMLInputElement;
  const searchMsg = document.getElementById('search-user-msg');
  const cancelSearchBtn = document.getElementById('cancel-user-search-btn');

  if (searchBtn && searchInput && searchMsg) {
    searchBtn.addEventListener('click', async () => {
      playSound('click');
      const target = searchInput.value.trim();
      if (!target) {
        searchMsg.textContent = 'Please enter a username to search.';
        searchMsg.style.color = '#ef4444';
        return;
      }

      searchMsg.textContent = 'Searching player in Firebase...';
      searchMsg.style.color = '#ffd700';

      const res = await invitePlayerByUsername(target);
      if (!res.success) {
        searchMsg.textContent = res.message;
        searchMsg.style.color = '#ef4444';
      } else {
        searchMsg.textContent = res.message;
        searchMsg.style.color = '#10b981';
        activeSentInvitationId = res.invitationId || null;

        if (activeSentInvitationId) {
          sentInvitationUnsub = listenToSentInvitation(
            activeSentInvitationId,
            (roomId) => {
              // Accepted!
              hideModal('search-username-modal');
              if (sentInvitationUnsub) sentInvitationUnsub();
              launchOnlineMatch(roomId);
            },
            () => {
              // Declined!
              searchMsg.textContent = 'Invitation Declined by opponent.';
              searchMsg.style.color = '#ef4444';
              if (sentInvitationUnsub) sentInvitationUnsub();
            }
          );
        }
      }
    });
  }

  if (cancelSearchBtn) {
    cancelSearchBtn.addEventListener('click', () => {
      playSound('click');
      if (activeSentInvitationId) {
        cancelSentInvitation(activeSentInvitationId);
        activeSentInvitationId = null;
      }
      if (sentInvitationUnsub) {
        sentInvitationUnsub();
        sentInvitationUnsub = null;
      }
      hideModal('search-username-modal');
    });
  }

  // 5. Random Matchmaking Cancel Button
  const cancelRandomBtn = document.getElementById('cancel-random-match-btn');
  if (cancelRandomBtn) {
    cancelRandomBtn.addEventListener('click', () => {
      playSound('click');
      cancelRandomMatchmaking();
      hideModal('random-match-modal');
    });
  }

  // 6. Settings Modal Username Edit Button
  const editUsernameBtn = document.getElementById('settings-change-username-btn');
  if (editUsernameBtn) {
    editUsernameBtn.addEventListener('click', () => {
      playSound('click');
      showUsernameModal(false);
    });
  }

  // 7. Bind Main Menu Leaderboard Button
  const leaderboardBtn = document.getElementById('menu-leaderboard-btn');
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
      playSound('click');
      openLeaderboardModal();
    });
  }

  // 8. Bind Leaderboard Search Input & Button
  const lbSearchBtn = document.getElementById('lb-search-btn');
  const lbSearchInput = document.getElementById('lb-search-input') as HTMLInputElement;

  if (lbSearchBtn && lbSearchInput) {
    const performLbSearch = async () => {
      const query = lbSearchInput.value.trim();
      if (!query) return;
      playSound('click');
      const results = await searchPlayersByUsername(query);
      renderLeaderboardSearchResults(results);
    };

    lbSearchBtn.addEventListener('click', performLbSearch);
    lbSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') performLbSearch();
    });
  }

  // Update Settings display on boot
  updateSettingsUsernameDisplay();
}

/**
 * Real-time Leaderboard Modal state & subscription
 */
let leaderboardUnsubscribe: (() => void) | null = null;

export function openLeaderboardModal() {
  showModal('leaderboard-modal');
  const container = document.getElementById('leaderboard-rows-container');
  if (container) {
    container.innerHTML = `<div id="leaderboard-loading" style="text-align: center; padding: 40px 20px; color: #a78bfa; font-size: 0.9rem;">
      <span class="spinner" style="display:inline-block; animation: spin 1s linear infinite;">⏳</span> Loading live rankings from Firebase...
    </div>`;
  }

  // Update current user top banner
  updateLeaderboardMyBanner();

  // Subscribe to real-time updates
  if (leaderboardUnsubscribe) leaderboardUnsubscribe();
  leaderboardUnsubscribe = subscribeToLeaderboard((players: UserRankProfile[]) => {
    renderLeaderboardList(players);
  });
}

async function updateLeaderboardMyBanner() {
  const user = getCurrentUser();
  if (!user) return;

  const profile = await getUserRankProfile(user.uid);
  if (!profile) return;

  const rank = await getUserGlobalRank(profile.rating);
  const rankDetails = getRankDetails(profile.rating);

  const myAvatar = document.getElementById('lb-my-avatar');
  const myName = document.getElementById('lb-my-name');
  const myBadge = document.getElementById('lb-my-tier-badge');
  const myRating = document.getElementById('lb-my-rating');
  const myRank = document.getElementById('lb-my-rank');

  if (myAvatar) myAvatar.textContent = profile.username.substring(0, 1).toUpperCase();
  if (myName) myName.textContent = `@${profile.username}`;
  if (myBadge) myBadge.textContent = `${rankDetails.badge} ${rankDetails.title}`;
  if (myRating) myRating.textContent = `${profile.rating} Rating`;
  if (myRank) myRank.textContent = `Global Rank #${rank}`;
}

function renderLeaderboardList(players: UserRankProfile[]) {
  const container = document.getElementById('leaderboard-rows-container');
  if (!container) return;

  if (!players || players.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #aaa; font-size: 0.9rem;">No ranked players found. Play an online match to start the leaderboard!</div>`;
    return;
  }

  const currentUser = getCurrentUser();
  const currentUid = currentUser?.uid;

  let html = '';
  players.forEach((player, index) => {
    const isMe = currentUid === player.uid;
    const rankDetails = getRankDetails(player.rating);
    const pos = index + 1;

    let posDisplay = `#${pos}`;
    if (pos === 1) posDisplay = '🥇 1';
    else if (pos === 2) posDisplay = '🥈 2';
    else if (pos === 3) posDisplay = '🥉 3';

    const initial = player.username.substring(0, 1).toUpperCase();

    html += `
      <div class="lb-row" data-uid="${player.uid}" style="display: grid; grid-template-columns: 50px 1fr 100px 100px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); align-items: center; cursor: pointer; border-radius: 8px; margin-bottom: 2px; transition: background 0.2s; ${isMe ? 'background: rgba(124, 58, 237, 0.25); border: 1px solid #7c3aed;' : 'background: rgba(0,0,0,0.2);'}">
        <div style="font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.95rem; color: ${pos <= 3 ? '#ffd700' : '#d1d5db'};">${posDisplay}</div>
        
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: ${rankDetails.color}; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.4); flex-shrink: 0;">${initial}</div>
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <span style="font-weight: 700; color: #fff; font-size: 0.9rem; display: block; overflow: hidden; text-overflow: ellipsis;">@${player.username} ${isMe ? '<span style="font-size: 0.7rem; color: #ffd700;">(You)</span>' : ''}</span>
            <span style="font-size: 0.72rem; color: ${rankDetails.color}; font-weight: 600;">${rankDetails.badge} ${rankDetails.title}</span>
          </div>
        </div>

        <div style="text-align: center; font-weight: 700; color: #ffd700; font-size: 1rem;">${player.rating}</div>

        <div style="text-align: right;">
          <span style="font-size: 0.82rem; color: #fff; font-weight: 600; display: block;">${player.wins}W / ${player.losses}L</span>
          <span style="font-size: 0.72rem; color: #10b981;">${player.winPercentage}% Win Rate</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Add click listeners to rows for profile view
  const rows = container.querySelectorAll('.lb-row');
  rows.forEach(row => {
    row.addEventListener('click', () => {
      playSound('click');
      const uid = row.getAttribute('data-uid');
      if (uid) openPlayerProfileModal(uid);
    });
  });
}

function renderLeaderboardSearchResults(results: UserRankProfile[]) {
  const container = document.getElementById('lb-search-results');
  if (!container) return;

  if (!results || results.length === 0) {
    container.style.display = 'block';
    container.innerHTML = `<div style="padding: 10px; text-align: center; color: #aaa; font-size: 0.82rem;">No players found matching search.</div>`;
    return;
  }

  container.style.display = 'block';
  let html = '';
  results.forEach(p => {
    const rankDetails = getRankDetails(p.rating);
    html += `
      <div class="search-res-item" data-uid="${p.uid}" style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 700; color: #fff; font-size: 0.9rem;">@${p.username}</span>
          <span style="font-size: 0.72rem; color: ${rankDetails.color}; display: block;">${rankDetails.badge} ${rankDetails.title}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-weight: 700; color: #ffd700; font-size: 0.95rem;">${p.rating} Rating</span>
          <span style="font-size: 0.72rem; color: #10b981; display: block;">${p.wins} Wins (${p.winPercentage}%)</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  const items = container.querySelectorAll('.search-res-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      playSound('click');
      const uid = item.getAttribute('data-uid');
      container.style.display = 'none';
      if (uid) openPlayerProfileModal(uid);
    });
  });
}

/**
 * Player Profile Modal logic
 */
export async function openPlayerProfileModal(uid: string) {
  showModal('player-profile-modal');

  const profile = await getUserRankProfile(uid);
  if (!profile) return;

  const rank = await getUserGlobalRank(profile.rating);
  const rankDetails = getRankDetails(profile.rating);

  const avatar = document.getElementById('profile-avatar');
  const username = document.getElementById('profile-username');
  const badge = document.getElementById('profile-tier-badge');
  const globalRank = document.getElementById('profile-global-rank');
  const rating = document.getElementById('profile-rating');
  const highestRating = document.getElementById('profile-highest-rating');
  const winPct = document.getElementById('profile-win-pct');
  const totalGames = document.getElementById('profile-total-games');
  const record = document.getElementById('profile-record');
  const curStreak = document.getElementById('profile-current-streak');
  const bestStreak = document.getElementById('profile-best-streak');
  const historyContainer = document.getElementById('profile-match-history');

  if (avatar) avatar.textContent = profile.username.substring(0, 1).toUpperCase();
  if (username) username.textContent = `@${profile.username}`;
  if (badge) {
    badge.textContent = `${rankDetails.badge} ${rankDetails.title}`;
    badge.style.color = rankDetails.color;
    badge.style.borderColor = rankDetails.color;
  }
  if (globalRank) globalRank.textContent = `Global Rank #${rank}`;
  if (rating) rating.textContent = `${profile.rating}`;
  if (highestRating) highestRating.textContent = `${profile.highestRating || profile.rating}`;
  if (winPct) winPct.textContent = `${profile.winPercentage}%`;
  if (totalGames) totalGames.textContent = `${profile.totalGames}`;
  if (record) record.textContent = `${profile.wins}W / ${profile.losses}L / ${profile.draws}D`;
  if (curStreak) curStreak.textContent = `${profile.currentStreak || 0}`;
  if (bestStreak) bestStreak.textContent = `${profile.highestStreak || 0}`;

  // Fetch match history
  if (historyContainer) {
    historyContainer.innerHTML = `<div style="text-align: center; color: #a78bfa; font-size: 0.82rem; padding: 15px;">Loading match history...</div>`;
    const matches = await getUserMatchHistory(uid, 15);
    
    if (!matches || matches.length === 0) {
      historyContainer.innerHTML = `<div style="text-align: center; color: #aaa; font-size: 0.8rem; padding: 20px;">No recorded ranked matches yet.</div>`;
    } else {
      let html = '';
      matches.forEach(m => {
        const isWin = m.result === 'win';
        const isLoss = m.result === 'loss';
        const resultColor = isWin ? '#10b981' : isLoss ? '#ef4444' : '#f59e0b';
        const resultLabel = isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW';
        const deltaDisplay = m.ratingChange >= 0 ? `+${m.ratingChange}` : `${m.ratingChange}`;
        const matchDate = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString() : 'Recent';

        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 0.82rem;">
            <div>
              <span style="font-weight: 700; color: ${resultColor}; font-family: 'Cinzel', serif;">${resultLabel}</span>
              <span style="color: #aaa; margin-left: 6px;">vs @${m.opponentUsername}</span>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 700; color: ${m.ratingChange >= 0 ? '#34d399' : '#f87171'};">${deltaDisplay} (${m.newRating})</span>
              <span style="font-size: 0.7rem; color: #aaa; display: block;">${matchDate}</span>
            </div>
          </div>
        `;
      });
      historyContainer.innerHTML = html;
    }
  }
}

/**
 * Updates settings pane username display
 */
export function updateSettingsUsernameDisplay() {
  const current = getSavedUsername();
  const displayEl = document.getElementById('settings-current-username');
  if (displayEl) {
    displayEl.textContent = current ? `@${current}` : 'Not set (Click to setup)';
  }
}

function showModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function hideModal(modalId: string) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

export function showUsernameModal(isFirstTime = false) {
  const modalTitle = document.getElementById('username-modal-title');
  const input = document.getElementById('username-input') as HTMLInputElement;
  const msg = document.getElementById('username-validation-msg');

  if (modalTitle) {
    modalTitle.textContent = isFirstTime ? 'WELCOME TO DAMMA ONLINE' : 'CHANGE USERNAME';
  }
  if (input) {
    input.value = getSavedUsername();
  }
  if (msg) {
    msg.textContent = '3-15 characters, letters, numbers & underscores only.';
    msg.style.color = 'rgba(255,255,255,0.6)';
  }
  showModal('username-setup-modal');
}

function showPlayOnlineChoiceModal() {
  const nameEl = document.getElementById('choice-my-username');
  if (nameEl) nameEl.textContent = `@${getSavedUsername()}`;
  showModal('play-online-modal');
}

function showSearchUsernameModal() {
  const input = document.getElementById('search-user-input') as HTMLInputElement;
  const msg = document.getElementById('search-user-msg');
  if (input) input.value = '';
  if (msg) msg.textContent = '';
  showModal('search-username-modal');
}

function showRandomMatchModal() {
  const statusText = document.getElementById('random-match-status-text');
  if (statusText) statusText.textContent = 'Searching for opponent...';
  showModal('random-match-modal');

  startRandomMatchmaking(
    (roomId) => {
      // Matched!
      if (statusText) statusText.textContent = 'Match Found! Connecting...';
      setTimeout(() => {
        hideModal('random-match-modal');
        launchOnlineMatch(roomId);
      }, 800);
    },
    (err) => {
      if (statusText) statusText.textContent = err;
    }
  );
}

function showIncomingInvitationModal(invitation: Invitation) {
  const titleEl = document.getElementById('invitation-from-text');
  if (titleEl) {
    titleEl.textContent = `Player "${invitation.fromUsername}" invited you to an online match!`;
  }

  const acceptBtn = document.getElementById('accept-invitation-btn');
  const declineBtn = document.getElementById('decline-invitation-btn');

  // Clear existing event listeners
  const newAcceptBtn = acceptBtn?.cloneNode(true) as HTMLElement;
  const newDeclineBtn = declineBtn?.cloneNode(true) as HTMLElement;

  if (acceptBtn && acceptBtn.parentNode) {
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
  }
  if (declineBtn && declineBtn.parentNode) {
    declineBtn.parentNode.replaceChild(newDeclineBtn, declineBtn);
  }

  newAcceptBtn.addEventListener('click', async () => {
    playSound('click');
    hideModal('incoming-invitation-modal');
    const roomId = await acceptInvitation(invitation);
    launchOnlineMatch(roomId);
  });

  newDeclineBtn.addEventListener('click', async () => {
    playSound('click');
    hideModal('incoming-invitation-modal');
    await declineInvitation(invitation.id);
  });

  showModal('incoming-invitation-modal');
}

let hasProcessedMatchRating = false;

/**
 * Connects both players into active online match room
 */
export async function launchOnlineMatch(roomId: string) {
  currentActiveRoomId = roomId;
  isOnlineMatchActive = true;
  hasProcessedMatchRating = false;

  const gsm = getGSM();

  // Cleanup active local game instance
  if (gsm.activeGameInstance) {
    gsm.activeGameInstance.terminate();
  }

  // Set game mode to 'online' in gameStateManager
  gsm.gameMode = 'online';

  // Transition to gameplay screen
  if (typeof gsm.showScreen === 'function') {
    gsm.showScreen('gameplay-screen');
  }

  // Create active game engine instance so canvas board renders and is interactive
  if (typeof (window as any).createGame === 'function') {
    gsm.activeGameInstance = (window as any).createGame();
  }

  // Initialize online HUD controls
  setupOnlineHUDControls(roomId);

  const currentUser = await ensureAuth();

  // Subscribe to real-time room updates
  if (roomUnsubscribe) roomUnsubscribe();
  
  roomUnsubscribe = subscribeToRoom(
    roomId,
    (roomState: RoomState) => {
      handleOnlineRoomUpdate(roomState, currentUser.uid);
    },
    (winnerUid: string) => {
      // Disconnection timeout winner
      if (latestRoomState) {
        latestRoomState.winnerUid = winnerUid;
        latestRoomState.status = 'ended';
        handleOnlineRoomUpdate(latestRoomState, currentUser.uid);
      }
    }
  );
}

let latestRoomState: RoomState | null = null;

function setupOnlineHUDControls(roomId: string) {
  const leaveBtn = document.getElementById('hud-leave-online-btn') || document.getElementById('hud-back-btn');
  if (leaveBtn) {
    // Show leave online confirm dialog
    leaveBtn.onclick = () => {
      playSound('click');
      if (confirm('Are you sure you want to leave the online match? This will count as a forfeit.')) {
        cleanupOnlineMatch();
        leaveOnlineRoom(roomId);
        getGSM().showScreen?.('main-menu');
      }
    };
  }

  // Hide undo button in online mode
  const undoBtn = document.getElementById('hud-undo-btn');
  if (undoBtn) undoBtn.style.display = 'none';

  // Hide reset button in online mode
  const resetBtn = document.getElementById('hud-reset-btn');
  if (resetBtn) resetBtn.style.display = 'none';
}

function handleOnlineRoomUpdate(room: RoomState, myUid: string) {
  latestRoomState = room;
  const isP1 = myUid === room.player1Uid;
  const myRole = isP1 ? 1 : -1;

  const myUsername = isP1 ? room.player1Username : room.player2Username;
  const oppUsername = isP1 ? room.player2Username : room.player1Username;

  // Update Player 1 & Player 2 labels in HUD with rank badges
  const p1Label = document.querySelector('.score-card.player1 .score-label');
  const p2Label = document.getElementById('p2-label');

  const p1Rank = getRankDetails(room.player1Rating || 1200);
  const p2Rank = getRankDetails(room.player2Rating || 1200);

  if (p1Label) p1Label.textContent = isP1 ? `${myUsername} (${p1Rank.badge} ${p1Rank.title})` : `${room.player1Username} (${p1Rank.badge} ${p1Rank.title})`;
  if (p2Label) p2Label.textContent = !isP1 ? `${myUsername} (${p2Rank.badge} ${p2Rank.title})` : `${room.player2Username} (${p2Rank.badge} ${p2Rank.title})`;

  // Update scores
  const p1Score = document.getElementById('p1-score');
  const p2Score = document.getElementById('p2-score');
  if (p1Score) p1Score.textContent = `${room.p1Count}`;
  if (p2Score) p2Score.textContent = `${room.p2Count}`;

  // Update turn indicator
  const turnIndicator = document.getElementById('turn-indicator-text');
  const isMyTurn = room.currentTurn === myRole;

  if (turnIndicator) {
    if (isMyTurn) {
      turnIndicator.textContent = 'YOUR TURN';
      turnIndicator.style.color = '#ffd700';
    } else {
      turnIndicator.textContent = `${oppUsername.toUpperCase()}'S TURN`;
      turnIndicator.style.color = '#3b82f6';
    }
  }

  // Disconnection monitoring banner
  const oppDisconnectedAt = isP1 ? room.player2DisconnectedAt : room.player1DisconnectedAt;
  const disconnectBanner = document.getElementById('online-disconnect-banner');
  const disconnectTimerText = document.getElementById('online-disconnect-timer');

  if (oppDisconnectedAt && room.status === 'playing') {
    if (disconnectBanner) disconnectBanner.style.display = 'flex';
    const elapsedSec = Math.floor((Date.now() - oppDisconnectedAt) / 1000);
    const remainingSec = Math.max(0, 60 - elapsedSec);
    if (disconnectTimerText) disconnectTimerText.textContent = `${remainingSec}s`;
  } else {
    if (disconnectBanner) disconnectBanner.style.display = 'none';
  }

  const gsm = getGSM();
  // Trigger board refresh on global game canvas if active
  if (gsm.activeGameInstance && typeof gsm.activeGameInstance.syncOnlineBoard === 'function') {
    gsm.activeGameInstance.syncOnlineBoard(room.board, room.currentTurn, myRole);
  }

  // Reset match rating flag if room is in active playing state
  if (room.status === 'playing') {
    hasProcessedMatchRating = false;
  }

  // Handle Game End / Abandoned
  if ((room.status === 'ended' || room.status === 'abandoned') && !hasProcessedMatchRating) {
    hasProcessedMatchRating = true;
    
    // Briefly delay showing game over popup so players see the final move on canvas
    setTimeout(() => {
      processRankedMatchRating(room).then((ratingResult) => {
        showRichOnlineGameOverModal(room, myUid, ratingResult);
      }).catch(err => {
        console.error('Error calculating match rating:', err);
        showRichOnlineGameOverModal(room, myUid, null);
      });
    }, 1200);
  }
}

async function showRichOnlineGameOverModal(room: RoomState, myUid: string, ratingResult: any) {
  const isP1 = myUid === room.player1Uid;
  const winnerIsP1 = room.winnerUid === room.player1Uid || room.winnerUid === 'p1';
  const isWinner = (room.winnerUid === myUid) || (isP1 && room.winnerUid === 'p1') || (!isP1 && room.winnerUid === 'p2');
  const isDraw = room.winnerUid === 'draw';

  // Play appropriate audio feedback
  playSound(isWinner ? 'win' : isDraw ? 'win' : 'lose');

  const modalDialog = document.querySelector('#online-gameover-modal .modal-dialog') as HTMLElement;
  const iconEl = document.getElementById('online-gameover-icon');
  const titleEl = document.getElementById('online-gameover-title');
  const descEl = document.getElementById('online-gameover-desc');
  const winnerNameEl = document.getElementById('gameover-winner-name');
  const loserNameEl = document.getElementById('gameover-loser-name');

  const prevRatingEl = document.getElementById('gameover-prev-rating');
  const newRatingEl = document.getElementById('gameover-new-rating');
  const deltaEl = document.getElementById('gameover-rating-delta');
  const fairPlayMsg = document.getElementById('gameover-fairplay-msg');

  const winsEl = document.getElementById('gameover-total-wins');
  const lossesEl = document.getElementById('gameover-total-losses');
  const drawsEl = document.getElementById('gameover-total-draws');
  const rankEl = document.getElementById('gameover-global-rank');

  // Dynamic visual theme based on outcome
  if (modalDialog) {
    if (isWinner) {
      modalDialog.style.border = '2px solid #ffd700';
      modalDialog.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.4)';
    } else if (isDraw) {
      modalDialog.style.border = '2px solid #f59e0b';
      modalDialog.style.boxShadow = '0 12px 40px rgba(245, 158, 11, 0.4)';
    } else {
      modalDialog.style.border = '2px solid #ef4444';
      modalDialog.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.5)';
    }
  }

  if (iconEl) iconEl.textContent = isWinner ? '🏆' : isDraw ? '🤝' : '💀';
  if (titleEl) {
    titleEl.textContent = isWinner ? 'VICTORY!' : isDraw ? 'DRAW MATCH' : 'DEFEAT - YOU LOST';
    titleEl.style.color = isWinner ? '#ffd700' : isDraw ? '#f59e0b' : '#ef4444';
  }

  if (descEl) {
    if (isWinner) {
      descEl.textContent = 'Congratulations on winning the match!';
    } else if (isDraw) {
      descEl.textContent = 'A well-fought Ethiopian Damma draw!';
    } else {
      const reasonStr = room.winReason ? ` (${room.winReason})` : '';
      descEl.textContent = `You lost this competitive match${reasonStr}. Better luck next time!`;
    }
  }

  const p1Name = room.player1Username || 'Player 1';
  const p2Name = room.player2Username || 'Player 2';

  if (winnerNameEl) winnerNameEl.textContent = isDraw ? 'Draw' : (winnerIsP1 ? p1Name : p2Name);
  if (loserNameEl) loserNameEl.textContent = isDraw ? 'Draw' : (winnerIsP1 ? p2Name : p1Name);

  if (ratingResult) {
    const isP1Res = isP1;
    const prev = isP1Res ? (ratingResult.p1OldRating ?? ratingResult.p1PrevRating ?? 1200) : (ratingResult.p2OldRating ?? ratingResult.p2PrevRating ?? 1200);
    const newR = isP1Res ? ratingResult.p1NewRating : ratingResult.p2NewRating;
    const delta = isP1Res ? ratingResult.p1RatingChange : ratingResult.p2RatingChange;

    if (prevRatingEl) prevRatingEl.textContent = `${prev}`;
    if (newRatingEl) newRatingEl.textContent = `${newR}`;
    if (deltaEl) {
      deltaEl.textContent = delta >= 0 ? `+${delta}` : `${delta}`;
      deltaEl.style.background = delta >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      deltaEl.style.color = delta >= 0 ? '#34d399' : '#f87171';
      deltaEl.style.borderColor = delta >= 0 ? '#10b981' : '#ef4444';
    }

    if (fairPlayMsg) {
      const isFair = ratingResult.isFair !== undefined ? ratingResult.isFair : ratingResult.isFairPlay;
      if (isFair === false) {
        fairPlayMsg.style.display = 'block';
        fairPlayMsg.textContent = 'Unrated Match (Fair Play Safeguard Active)';
      } else {
        fairPlayMsg.style.display = 'none';
      }
    }
  }

  const playAgainBtn = document.getElementById('online-play-again-btn');
  const menuBtn = document.getElementById('online-gameover-menu-btn');

  if (playAgainBtn) {
    playAgainBtn.onclick = async () => {
      playSound('click');
      if (currentActiveRoomId) {
        playAgainBtn.textContent = 'Waiting for opponent...';
        await requestOnlineRematch(currentActiveRoomId);
      }
    };
  }

  if (menuBtn) {
    menuBtn.onclick = () => {
      playSound('click');
      hideModal('online-gameover-modal');
      cleanupOnlineMatch();
      getGSM().showScreen?.('main-menu');
    };
  }

  // Display modal IMMEDIATELY so loser/winner never miss the Game Over popup
  showModal('online-gameover-modal');

  // Fetch updated user profile & rank stats in background non-blockingly
  try {
    const profile = await getUserRankProfile(myUid);
    if (profile) {
      if (winsEl) winsEl.textContent = `${profile.wins}`;
      if (lossesEl) lossesEl.textContent = `${profile.losses}`;
      if (drawsEl) drawsEl.textContent = `${profile.draws}`;

      const globalRank = await getUserGlobalRank(profile.rating);
      if (rankEl) rankEl.textContent = `#${globalRank}`;
    }
  } catch (e) {
    console.warn('Non-critical: Error populating gameover stats:', e);
  }
}

export function getOnlineUsernames() {
  if (!latestRoomState) return null;
  return {
    p1Username: latestRoomState.player1Username || 'Player 1',
    p2Username: latestRoomState.player2Username || 'Player 2',
    p1Uid: latestRoomState.player1Uid,
    p2Uid: latestRoomState.player2Uid,
    currentTurn: latestRoomState.currentTurn,
  };
}

(window as any).getOnlineUsernames = getOnlineUsernames;

export function cleanupOnlineMatch() {
  if (roomUnsubscribe) {
    roomUnsubscribe();
    roomUnsubscribe = null;
  }
  if (currentActiveRoomId) {
    leaveOnlineRoom(currentActiveRoomId);
    currentActiveRoomId = null;
  }
  isOnlineMatchActive = false;
  updatePresenceStatus('online');
}
