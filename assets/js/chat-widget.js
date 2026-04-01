import {
  getSupabase,
  esc,
  initials,
  formatDate,
  humanizeError,
  getSession,
  onAuthChange,
  getMyProfile,
  loadConversationSummaries,
  loadConversationMessages,
  ensureConversation,
  sendConversationMessage,
  markConversationRead
} from "./supabase-client.js";
import { supabaseIsConfigured } from "./supabase-config.js";

const page = document.body?.dataset?.page || "";
if (page === "community") {
  // Community page has the full chat workspace already.
} else {
  let currentUser = null;
  let currentProfile = null;
  let conversations = [];
  let activeConversationId = null;
  let activeRecipientId = null;
  let refreshHandle = null;

  if (supabaseIsConfigured() && getSupabase()) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="chat-widget hidden" id="chatWidgetRoot">
        <button class="chat-widget-toggle" id="chatLauncher" type="button" aria-expanded="false" aria-controls="chatPanel">
          <span class="chat-widget-badge hidden" id="chatBadge">0</span>
          <span class="chat-widget-icon">✉</span>
          <span>Messages</span>
        </button>
        <div class="chat-widget-panel hidden" id="chatPanel">
          <div class="chat-widget-header">
            <div>
              <strong>Messages</strong>
              <p id="chatPanelSubhead">Recent conversations</p>
            </div>
            <button class="chat-widget-close" id="chatClose" type="button" aria-label="Close">×</button>
          </div>
          <div class="chat-widget-body">
            <div class="chat-widget-sidebar">
              <div class="conversation-list compact-scroll" id="chatConversationList"></div>
            </div>
            <div class="chat-widget-thread">
              <div class="active-conversation-header" id="chatThreadHead"><strong>Select a conversation</strong><p>Your previous messages appear here.</p></div>
              <div class="message-thread compact-scroll" id="chatThreadMessages"></div>
              <form class="chat-compose hidden" id="chatComposeForm">
                <textarea id="chatComposeText" rows="2" placeholder="Write a message"></textarea>
                <button class="button button-small" type="submit">Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `);

    const root = document.getElementById("chatWidgetRoot");
    const launcher = document.getElementById("chatLauncher");
    const panel = document.getElementById("chatPanel");
    const closeBtn = document.getElementById("chatClose");
    const badge = document.getElementById("chatBadge");
    const list = document.getElementById("chatConversationList");
    const threadHead = document.getElementById("chatThreadHead");
    const threadMessages = document.getElementById("chatThreadMessages");
    const composeForm = document.getElementById("chatComposeForm");
    const composeText = document.getElementById("chatComposeText");

    function togglePanel(force) {
      const open = typeof force === 'boolean' ? force : panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !open);
      launcher.setAttribute('aria-expanded', String(open));
    }

    function renderConversationList() {
      if (!currentUser) {
        root.classList.add('hidden');
        return;
      }
      root.classList.remove('hidden');
      const unread = conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
      badge.textContent = String(unread);
      badge.classList.toggle('hidden', unread < 1);

      if (!conversations.length) {
        list.innerHTML = '<div class="empty-state">No conversations yet.</div>';
        threadHead.innerHTML = '<strong>No conversations yet</strong><p>Open the Members page to start a new message.</p>';
        threadMessages.innerHTML = '<div class="empty-state">Messages will appear here.</div>';
        composeForm.classList.add('hidden');
        return;
      }

      list.innerHTML = conversations.map((item) => `
        <button class="conversation-item${item.id === activeConversationId ? ' active' : ''}" type="button" data-conversation-id="${esc(item.id)}" data-member-id="${esc(item.other_uid)}">
          <span class="conversation-avatar">${esc(initials(item.other_name || 'Member'))}</span>
          <span class="conversation-copy">
            <strong>${esc(item.other_name || 'Member')}</strong>
            <small>${esc(item.last_message_text || 'Open conversation')}</small>
          </span>
          ${item.unread_count ? `<span class="conversation-count">${esc(item.unread_count)}</span>` : ''}
        </button>
      `).join('');

      list.querySelectorAll('[data-member-id]').forEach((button) => {
        button.addEventListener('click', () => openConversation(button.dataset.memberId || '', button.dataset.conversationId || ''));
      });
    }

    async function renderMessages() {
      if (!currentUser || !activeConversationId || !activeRecipientId) {
        threadHead.innerHTML = '<strong>Select a conversation</strong><p>Your previous messages appear here.</p>';
        threadMessages.innerHTML = '<div class="empty-state">Choose a conversation from the list.</div>';
        composeForm.classList.add('hidden');
        return;
      }
      const convo = conversations.find((item) => item.id === activeConversationId) || { other_name: 'Member', other_role: 'Project member' };
      const messages = await loadConversationMessages(activeConversationId);
      threadHead.innerHTML = `<strong>${esc(convo.other_name || 'Member')}</strong><p>${esc(convo.other_role || 'Project member')}</p>`;
      threadMessages.innerHTML = messages.length ? messages.map((item) => `
        <div class="message-bubble ${item.sender_id === currentUser.id ? 'mine' : ''}">
          <div class="message-bubble-meta">${esc(item.sender_id === currentUser.id ? 'You' : (convo.other_name || 'Member'))} · ${esc(formatDate(item.created_at))}</div>
          <p>${esc(item.body || '')}</p>
        </div>
      `).join('') : '<div class="empty-state">No messages yet.</div>';
      threadMessages.scrollTop = threadMessages.scrollHeight;
      composeForm.classList.remove('hidden');
      await markConversationRead(activeConversationId, currentUser.id);
    }

    async function openConversation(otherUserId, conversationId = '') {
      if (!currentUser) return;
      activeRecipientId = otherUserId;
      activeConversationId = conversationId || await ensureConversation(currentUser.id, otherUserId);
      await renderMessages();
      await refreshConversations();
      togglePanel(true);
    }

    async function refreshConversations() {
      if (!currentUser) return;
      try {
        conversations = await loadConversationSummaries(currentUser.id);
        renderConversationList();
        if (!activeConversationId && conversations[0]) {
          activeConversationId = conversations[0].id;
          activeRecipientId = conversations[0].other_uid;
        }
        if (activeConversationId) {
          await renderMessages();
        }
      } catch (error) {
        console.error(humanizeError(error));
      }
    }

    launcher?.addEventListener('click', () => togglePanel());
    closeBtn?.addEventListener('click', () => togglePanel(false));
    composeForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!currentUser || !activeConversationId || !activeRecipientId) return;
      try {
        await sendConversationMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          recipientId: activeRecipientId,
          body: composeText.value,
          senderName: currentProfile?.display_name || currentUser.email || 'Member'
        });
        composeText.value = '';
        await refreshConversations();
      } catch (error) {
        console.error(humanizeError(error));
      }
    });

    async function applySession(session) {
      currentUser = session?.user || null;
      if (!currentUser) {
        root.classList.add('hidden');
        conversations = [];
        activeConversationId = null;
        activeRecipientId = null;
        return;
      }
      root.classList.remove('hidden');
      currentProfile = await getMyProfile(currentUser.id).catch(() => null);
      await refreshConversations();
    }

    async function init() {
      await applySession(await getSession());
      onAuthChange(async (session) => applySession(session));
      refreshHandle = window.setInterval(refreshConversations, 10000);
    }

    init();
  }
}
