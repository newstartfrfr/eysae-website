import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, query, where, onSnapshot, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

const page = document.body?.dataset?.page || '';
if (page === 'community') {
  // full messaging exists on community page
} else if (firebaseIsConfigured(firebaseConfig)) {
  const app = initializeApp(firebaseConfig, `chat-widget-${page || 'page'}`);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let currentUser = null;
  let currentConversations = [];
  let currentConversationId = null;
  let unsubConversations = null;
  let unsubMessages = null;

  const style = `
  <div class="chat-widget" id="chatWidgetRoot" hidden>
    <button class="chat-launcher" id="chatLauncher" type="button" aria-label="Open messages">
      <span class="chat-launcher-icon">✉</span>
      <span class="chat-launcher-label">Messages</span>
      <span class="chat-badge hidden" id="chatBadge">0</span>
    </button>
    <div class="chat-panel hidden" id="chatPanel">
      <div class="chat-panel-head">
        <div>
          <strong>Messages</strong>
          <p id="chatPanelSubhead">Recent conversations</p>
        </div>
        <button class="chat-close" id="chatClose" type="button" aria-label="Close">×</button>
      </div>
      <div class="chat-layout">
        <aside class="chat-sidebar">
          <div class="chat-list" id="chatConversationList"></div>
        </aside>
        <section class="chat-thread">
          <div class="chat-thread-head" id="chatThreadHead">Select a conversation</div>
          <div class="chat-thread-messages" id="chatThreadMessages"></div>
          <form class="chat-compose" id="chatComposeForm">
            <textarea id="chatComposeText" rows="2" placeholder="Write a message"></textarea>
            <button class="button button-small" type="submit">Send</button>
          </form>
        </section>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', style);

  const root = document.getElementById('chatWidgetRoot');
  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const badge = document.getElementById('chatBadge');
  const list = document.getElementById('chatConversationList');
  const threadHead = document.getElementById('chatThreadHead');
  const threadMessages = document.getElementById('chatThreadMessages');
  const composeForm = document.getElementById('chatComposeForm');
  const composeText = document.getElementById('chatComposeText');

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#039;');
  const initials = (v) => ((v || 'M').trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('') || 'M');
  const convId = (a,b) => [a,b].sort().join('__');
  const formatDate = (value) => {
    const raw = value?.toDate ? value.toDate() : value;
    if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return '';
    return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { dateStyle:'short', timeStyle:'short' }).format(raw);
  };

  function togglePanel(force) {
    const open = force ?? panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
  }

  launcher?.addEventListener('click', () => togglePanel());
  closeBtn?.addEventListener('click', () => togglePanel(false));

  async function ensureUserName() {
    if (!currentUser) return currentUser?.email || 'Member';
    const ref = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data().displayName || currentUser.email || 'Member') : (currentUser.displayName || currentUser.email || 'Member');
  }

  function renderConversationList() {
    if (!currentConversations.length) {
      list.innerHTML = '<div class="chat-empty">No conversations yet.</div>';
      badge.classList.add('hidden');
      return;
    }
    badge.textContent = String(currentConversations.length);
    badge.classList.remove('hidden');
    list.innerHTML = currentConversations.map((item) => {
      const active = item.id === currentConversationId ? ' active' : '';
      const otherUid = (item.participants || []).find((uid) => uid !== currentUser?.uid) || '';
      const otherName = item.participantNames?.[otherUid] || 'Member';
      return `<button class="chat-conversation${active}" type="button" data-conversation-id="${esc(item.id)}"><span class="chat-conversation-avatar">${esc(initials(otherName))}</span><span class="chat-conversation-copy"><strong>${esc(otherName)}</strong><small>${esc(item.lastMessage || '')}</small></span></button>`;
    }).join('');

    list.querySelectorAll('[data-conversation-id]').forEach((btn) => {
      btn.addEventListener('click', () => openConversation(btn.dataset.conversationId));
    });
  }

  function renderMessages(messages, conversation) {
    const otherUid = (conversation?.participants || []).find((uid) => uid !== currentUser?.uid) || '';
    const otherName = conversation?.participantNames?.[otherUid] || 'Member';
    threadHead.textContent = otherName;
    threadMessages.innerHTML = messages.length ? messages.map((item) => `
      <div class="chat-message ${item.senderId === currentUser.uid ? 'chat-message-own' : ''}">
        <div class="chat-message-bubble">${esc(item.text || '')}</div>
        <div class="chat-message-meta">${esc(item.senderName || '')} · ${esc(formatDate(item.createdAt))}</div>
      </div>`).join('') : '<div class="chat-empty">No messages yet.</div>';
    threadMessages.scrollTop = threadMessages.scrollHeight;
  }

  function openConversation(id) {
    currentConversationId = id;
    renderConversationList();
    unsubMessages?.();
    const conversation = currentConversations.find((item) => item.id === id);
    if (!conversation) return;
    unsubMessages = onSnapshot(query(collection(db, 'conversations', id, 'messages'), orderBy('createdAt', 'asc'), limit(100)), (snap) => {
      renderMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })), conversation);
    });
  }

  composeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser || !currentConversationId) return;
    const text = composeText.value.trim();
    if (!text) return;
    const conversation = currentConversations.find((item) => item.id === currentConversationId);
    const senderName = await ensureUserName();
    await addDoc(collection(db, 'conversations', currentConversationId, 'messages'), {
      senderId: currentUser.uid,
      senderName,
      text,
      createdAt: serverTimestamp()
    });
    await setDoc(doc(db, 'conversations', currentConversationId), {
      participants: conversation.participants,
      participantNames: conversation.participantNames,
      updatedAt: serverTimestamp(),
      lastMessage: text,
      lastSenderId: currentUser.uid
    }, { merge: true });
    composeText.value = '';
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    unsubConversations?.();
    unsubMessages?.();
    currentConversations = [];
    currentConversationId = null;
    if (!user) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    unsubConversations = onSnapshot(query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid), limit(30)), (snap) => {
      currentConversations = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a,b) => {
        const ad = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bd = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bd - ad;
      });
      renderConversationList();
      if (!currentConversationId && currentConversations[0]) openConversation(currentConversations[0].id);
    });
  });
}
