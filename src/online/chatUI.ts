import { subscribeToChatMessages, sendChatMessage, ChatMessage } from './chatService';
import { getCurrentUser } from './firebase';
import { getUserAvatarUrl } from './userService';
import { submitChatReport } from './chatModerationService';

let chatUnsubscribe: (() => void) | null = null;
let activeChatRoomId: string | null = null;
let unreadCount = 0;
let isChatOpen = false;
let lastMessageCount = 0;

let activeReportTarget: {
  messageId?: string;
  senderUid: string;
  senderUsername: string;
  senderDisplayName?: string;
  messageText: string;
} | null = null;

/**
 * Checks whether the current game mode is Online Multiplayer
 */
function isOnlineGameMode(): boolean {
  const gsm = (window as any).gameStateManager;
  return gsm && gsm.gameMode === 'online';
}

/**
 * Plays a subtle, pleasant notification chime for incoming opponent messages
 */
function playChatNotificationSound() {
  if (!isOnlineGameMode()) return;
  try {
    if (typeof (window as any).SoundSystem?.play === 'function') {
      (window as any).SoundSystem.play('message');
      return;
    }

    // Web Audio API Fallback chime
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880.00, now + 0.08); // A5

    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.linearRampToValueAtTime(0.001, now + 0.2);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
  } catch (e) {
    console.warn('Could not play chat notification sound:', e);
  }
}

/**
 * Formats unix timestamp into a localized short time string (e.g. 10:42 AM)
 */
function formatMessageTime(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Initializes Chat UI for an active online room ONLY if in Online Multiplayer mode
 */
export function initChatUI(roomId: string) {
  cleanupChatUI();

  // STRICT GUARD: Chat is ONLY available during Online Multiplayer matches
  if (!roomId || !isOnlineGameMode()) {
    return;
  }

  activeChatRoomId = roomId;
  unreadCount = 0;
  lastMessageCount = 0;
  isChatOpen = false;

  updateUnreadBadge();

  // Show chat HUD & Floating trigger buttons
  const hudChatBtn = document.getElementById('hud-chat-btn');
  const mobileChatBtn = document.getElementById('floating-chat-btn');
  const chatPanel = document.getElementById('online-chat-panel');

  if (hudChatBtn) hudChatBtn.style.display = 'flex';
  if (mobileChatBtn) mobileChatBtn.style.display = 'flex';
  if (chatPanel) chatPanel.style.display = '';

  // Bind trigger buttons
  bindChatControls();

  // Subscribe to real-time chat messages
  chatUnsubscribe = subscribeToChatMessages(roomId, (messages: ChatMessage[]) => {
    // Safety check during callback
    if (!isOnlineGameMode()) {
      cleanupChatUI();
      return;
    }

    const currentUser = getCurrentUser();
    const myUid = currentUser?.uid;

    // Check if new message arrived from opponent
    if (messages.length > lastMessageCount) {
      const newest = messages[messages.length - 1];
      if (newest && newest.senderUid !== myUid) {
        // Play notification sound
        playChatNotificationSound();

        // Increment unread count if chat panel is closed
        if (!isChatOpen) {
          unreadCount++;
          updateUnreadBadge();
        }
      }
    }
    lastMessageCount = messages.length;

    renderChatMessages(messages, myUid);
  });
}

/**
 * Cleans up chat subscriptions and resets state when exiting a match or in non-online modes
 */
export function cleanupChatUI() {
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }
  activeChatRoomId = null;
  unreadCount = 0;
  isChatOpen = false;
  lastMessageCount = 0;

  updateUnreadBadge();
  closeChatPanel();

  const hudChatBtn = document.getElementById('hud-chat-btn');
  const mobileChatBtn = document.getElementById('floating-chat-btn');
  const chatPanel = document.getElementById('online-chat-panel');

  if (hudChatBtn) hudChatBtn.style.display = 'none';
  if (mobileChatBtn) mobileChatBtn.style.display = 'none';
  if (chatPanel) {
    chatPanel.classList.remove('active');
    chatPanel.style.display = 'none';
  }
}

function updateUnreadBadge() {
  const badgeEls = document.querySelectorAll('.chat-unread-badge');
  badgeEls.forEach((el) => {
    if (unreadCount > 0 && isOnlineGameMode()) {
      el.textContent = unreadCount > 99 ? '99+' : `${unreadCount}`;
      (el as HTMLElement).style.display = 'flex';
    } else {
      (el as HTMLElement).style.display = 'none';
    }
  });
}

export function openChatPanel() {
  if (!isOnlineGameMode() || !activeChatRoomId) {
    cleanupChatUI();
    return;
  }

  isChatOpen = true;
  unreadCount = 0;
  updateUnreadBadge();

  const chatPanel = document.getElementById('online-chat-panel');
  if (chatPanel) {
    chatPanel.style.display = '';
    chatPanel.classList.add('active');
  }

  // Focus input
  const input = document.getElementById('chat-input-text') as HTMLInputElement;
  if (input) {
    setTimeout(() => input.focus(), 150);
  }

  scrollToBottom();
}

export function closeChatPanel() {
  isChatOpen = false;
  const chatPanel = document.getElementById('online-chat-panel');
  if (chatPanel) {
    chatPanel.classList.remove('active');
    if (!isOnlineGameMode()) {
      chatPanel.style.display = 'none';
    }
  }

  // Hide emoji grid if open
  const emojiGrid = document.getElementById('chat-emoji-grid');
  if (emojiGrid) {
    emojiGrid.style.display = 'none';
  }
}

export function toggleChatPanel() {
  if (!isOnlineGameMode() || !activeChatRoomId) {
    cleanupChatUI();
    return;
  }

  if (isChatOpen) {
    closeChatPanel();
  } else {
    openChatPanel();
  }
}

function bindChatControls() {
  const hudChatBtn = document.getElementById('hud-chat-btn');
  const mobileChatBtn = document.getElementById('floating-chat-btn');
  const closeChatBtn = document.getElementById('close-chat-btn');
  const sendBtn = document.getElementById('chat-send-btn');
  const input = document.getElementById('chat-input-text') as HTMLInputElement;
  const charCounter = document.getElementById('chat-char-count');
  const emojiToggleBtn = document.getElementById('chat-emoji-toggle-btn');
  const emojiGrid = document.getElementById('chat-emoji-grid');

  if (hudChatBtn) hudChatBtn.onclick = toggleChatPanel;
  if (mobileChatBtn) mobileChatBtn.onclick = toggleChatPanel;
  if (closeChatBtn) closeChatBtn.onclick = closeChatPanel;

  bindReportModalControls();

  if (sendBtn && input) {
    sendBtn.onclick = () => handleSendMessage();
    input.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    input.oninput = () => {
      const len = input.value.length;
      if (charCounter) {
        charCounter.textContent = `${len}/300`;
        charCounter.style.color = len > 280 ? '#ef4444' : 'rgba(255,255,255,0.5)';
      }
    };
  }

  // Quick emoji buttons
  const quickEmojiBtns = document.querySelectorAll('.quick-emoji-btn');
  quickEmojiBtns.forEach((btn) => {
    (btn as HTMLElement).onclick = () => {
      const emoji = btn.getAttribute('data-emoji') || btn.textContent?.trim();
      if (emoji && input) {
        input.value += emoji;
        input.dispatchEvent(new Event('input'));
        input.focus();
      }
    };
  });

  // Expanded Emoji Toggle
  if (emojiToggleBtn && emojiGrid) {
    emojiToggleBtn.onclick = () => {
      const currentlyShown = emojiGrid.style.display === 'grid';
      emojiGrid.style.display = currentlyShown ? 'none' : 'grid';
    };

    const gridEmojis = emojiGrid.querySelectorAll('.emoji-grid-item');
    gridEmojis.forEach((item) => {
      (item as HTMLElement).onclick = () => {
        const emoji = item.textContent?.trim();
        if (emoji && input) {
          input.value += emoji;
          input.dispatchEvent(new Event('input'));
          input.focus();
        }
      };
    });
  }
}

function openReportModal(target: {
  messageId?: string;
  senderUid: string;
  senderUsername: string;
  senderDisplayName?: string;
  messageText: string;
}) {
  activeReportTarget = target;
  const modal = document.getElementById('report-message-modal');
  const preview = document.getElementById('report-target-message-preview');
  const senderInfo = document.getElementById('report-target-sender-info');
  const msgEl = document.getElementById('report-modal-msg');

  if (preview) preview.textContent = `"${target.messageText}"`;
  if (senderInfo) senderInfo.textContent = `From: @${target.senderUsername} (${target.senderDisplayName || target.senderUsername})`;
  if (msgEl) msgEl.textContent = '';

  if (modal) modal.classList.add('active');
}

function closeReportModal() {
  const modal = document.getElementById('report-message-modal');
  if (modal) modal.classList.remove('active');
  activeReportTarget = null;
}

function bindReportModalControls() {
  const closeX = document.getElementById('report-modal-close-x');
  const cancelBtn = document.getElementById('report-cancel-btn');
  const submitBtn = document.getElementById('report-submit-btn');
  const msgEl = document.getElementById('report-modal-msg');

  if (closeX) closeX.onclick = closeReportModal;
  if (cancelBtn) cancelBtn.onclick = closeReportModal;

  if (submitBtn) {
    submitBtn.onclick = async () => {
      if (!activeReportTarget || !activeChatRoomId) return;

      const reasonSelect = document.getElementById('report-reason-select') as HTMLSelectElement;
      const reason = reasonSelect ? reasonSelect.value : 'Inappropriate content';

      submitBtn.textContent = 'Submitting...';
      (submitBtn as HTMLButtonElement).disabled = true;

      const res = await submitChatReport({
        roomId: activeChatRoomId,
        messageId: activeReportTarget.messageId,
        reportedUid: activeReportTarget.senderUid,
        reportedUsername: activeReportTarget.senderUsername,
        reportedDisplayName: activeReportTarget.senderDisplayName,
        messageText: activeReportTarget.messageText,
        reason: reason
      });

      submitBtn.textContent = 'Submit Report';
      (submitBtn as HTMLButtonElement).disabled = false;

      if (msgEl) {
        msgEl.textContent = res.message;
        msgEl.style.color = res.success ? '#10b981' : '#ef4444';
      }

      if (res.success) {
        setTimeout(() => {
          closeReportModal();
        }, 1500);
      }
    };
  }
}

async function handleSendMessage() {
  if (!isOnlineGameMode() || !activeChatRoomId) {
    cleanupChatUI();
    return;
  }

  const input = document.getElementById('chat-input-text') as HTMLInputElement;
  const sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement;
  const errorMsg = document.getElementById('chat-error-msg');

  if (!input) return;

  const rawText = input.value;
  if (!rawText.trim()) return;

  if (sendBtn) sendBtn.disabled = true;
  if (errorMsg) errorMsg.style.display = 'none';

  const result = await sendChatMessage(activeChatRoomId, rawText);

  if (sendBtn) sendBtn.disabled = false;

  if (result.success) {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    // Close emoji grid if open
    const emojiGrid = document.getElementById('chat-emoji-grid');
    if (emojiGrid) emojiGrid.style.display = 'none';
    scrollToBottom();
  } else if (errorMsg) {
    errorMsg.textContent = result.message || 'Failed to send message.';
    errorMsg.style.display = 'block';
    errorMsg.style.background = 'rgba(239, 68, 68, 0.2)';
    errorMsg.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    errorMsg.style.color = '#f87171';
    errorMsg.style.padding = '8px 12px';
    errorMsg.style.borderRadius = '8px';
    errorMsg.style.marginTop = '6px';
  }
}

function renderChatMessages(messages: ChatMessage[], myUid?: string) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `
      <div class="chat-empty-state">
        <span class="chat-empty-icon">💬</span>
        <p>No messages yet. Say hello to your opponent!</p>
      </div>
    `;
    return;
  }

  // Remove empty state placeholder if present
  const emptyState = container.querySelector('.chat-empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  // Track existing message IDs to avoid full DOM re-renders
  const existingMsgElements = container.querySelectorAll('.chat-message-item[data-msg-id]');
  const existingIds = new Set<string>();
  existingMsgElements.forEach((el) => {
    const id = el.getAttribute('data-msg-id');
    if (id) existingIds.add(id);
  });

  // If container empty or message count is smaller (e.g. reset/cleared), do full render
  if (existingMsgElements.length === 0 || messages.length < existingMsgElements.length) {
    let html = '';
    messages.forEach((msg) => {
      html += buildMessageItemHtml(msg, myUid);
    });
    container.innerHTML = html;
  } else {
    // Append only NEW messages incrementally
    let newHtml = '';
    messages.forEach((msg) => {
      const msgId = msg.id || `${msg.timestamp}_${msg.senderUid}_${msg.text.substring(0, 10)}`;
      if (!existingIds.has(msgId)) {
        newHtml += buildMessageItemHtml(msg, myUid);
      }
    });

    if (newHtml) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newHtml;
      while (tempDiv.firstChild) {
        container.appendChild(tempDiv.firstChild);
      }
    }
  }

  // Bind click handlers to report buttons for newly added or rendered buttons
  const reportBtns = container.querySelectorAll('.chat-report-btn:not([data-bound="true"])');
  reportBtns.forEach((btn) => {
    btn.setAttribute('data-bound', 'true');
    (btn as HTMLElement).onclick = (e) => {
      e.stopPropagation();
      const msgId = btn.getAttribute('data-msg-id') || undefined;
      const senderUid = btn.getAttribute('data-sender-uid') || '';
      const senderUsername = btn.getAttribute('data-sender-username') || '';
      const senderDisplayName = btn.getAttribute('data-sender-display') || '';
      const rawTextEncoded = btn.getAttribute('data-text') || '';
      const messageText = decodeURIComponent(rawTextEncoded);

      openReportModal({
        messageId: msgId,
        senderUid,
        senderUsername,
        senderDisplayName,
        messageText
      });
    };
  });

  scrollToBottom();
}

function buildMessageItemHtml(msg: ChatMessage, myUid?: string): string {
  const isMe = msg.senderUid === myUid;
  const name = msg.senderDisplayName || msg.senderUsername || (isMe ? 'You' : 'Opponent');
  const avatarUrl = getUserAvatarUrl({ photoURL: msg.senderPhotoURL, displayName: name, username: msg.senderUsername });
  const formattedTime = formatMessageTime(msg.timestamp);
  const msgId = msg.id || `${msg.timestamp}_${msg.senderUid}_${msg.text.substring(0, 10)}`;

  const reportBtnHtml = !isMe ? `
    <button class="chat-report-btn" data-msg-id="${msg.id || ''}" data-sender-uid="${msg.senderUid}" data-sender-username="${msg.senderUsername}" data-sender-display="${name}" data-text="${encodeURIComponent(msg.text)}" title="Report inappropriate message">🚩 Report</button>
  ` : '';

  return `
    <div class="chat-message-item ${isMe ? 'message-self' : 'message-opponent'}" data-msg-id="${msgId}">
      <img class="chat-avatar-thumb" src="${avatarUrl}" alt="${name}" loading="lazy" />
      <div class="message-content-group">
        <div class="message-meta">
          <span class="message-sender">${isMe ? 'You' : name}</span>
          <span class="message-time">${formattedTime}</span>
          ${reportBtnHtml}
        </div>
        <div class="message-bubble">${msg.text}</div>
      </div>
    </div>
  `;
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

(window as any).cleanupChatUI = cleanupChatUI;
(window as any).initChatUI = initChatUI;

