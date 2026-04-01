import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, addDoc, setDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

const page = document.body?.dataset?.page || "";
if (page === "community" || !firebaseIsConfigured(firebaseConfig)) {
  // community page has its own full messaging experience
} else {
  const app = initializeApp(firebaseConfig, `chat-widget-${page || 'page'}`);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let currentUser = null;
  let currentProfile = null;
  let currentThreads = [];
  let currentConversationId = null;
  let activeConversation = null;
  let unsubThreads = null;
  let unsubMessages = null;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="chat-widget" id="chatWidgetRoot" hidden>
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
            <form class="chat-compose" id="chatComposeForm">
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

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const initials = (value) => ((value || "M").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "M");
  const formatDate = (value) => {
    const raw = value?.toDate ? value.toDate() : value;
    if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return "";
    return new Intl.DateTimeFormat(document.documentElement.lang || "en", { dateStyle: "short", timeStyle: "short" }).format(raw);
  };

  function togglePanel(force) {
    const open = force ?? panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !open);
    launcher.setAttribute("aria-expanded", String(open));
  }

  async function ensureCurrentProfile() {
    if (!currentUser) return null;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    currentProfile = snap.exists() ? snap.data() : { displayName: currentUser.displayName || currentUser.email || "Member" };
    return currentProfile;
  }

  function renderThreadList() {
    if (!currentThreads.length) {
      list.innerHTML = '<div class="empty-state">No conversations yet.</div>';
      badge.classList.add("hidden");
      return;
    }
    badge.textContent = String(currentThreads.length);
    badge.classList.remove("hidden");
    list.innerHTML = currentThreads.map((item) => {
      const active = item.conversationId === currentConversationId ? " active" : "";
      return `<button class="conversation-item${active}" type="button" data-conversation-id="${esc(item.conversationId)}" data-member-id="${esc(item.otherUid)}"><span class="conversation-avatar">${esc(initials(item.otherName || "Member"))}</span><span class="conversation-copy"><strong>${esc(item.otherName || "Member")}</strong><small>${esc(item.lastMessageText || "Open conversation")}</small></span></button>`;
    }).join("");
    list.querySelectorAll("[data-conversation-id]").forEach((btn) => {
      btn.addEventListener("click", () => openConversation(btn.dataset.memberId || "", btn.dataset.conversationId || ""));
    });
  }

  function renderMessages(messages) {
    const otherName = activeConversation?.otherName || "Member";
    threadHead.innerHTML = `<strong>${esc(otherName)}</strong><p>Private conversation</p>`;
    threadMessages.innerHTML = messages.length ? messages.map((item) => `
      <div class="message-bubble ${item.fromId === currentUser.uid ? 'mine' : ''}">
        <div class="message-bubble-meta">${esc(item.fromName || '')} · ${esc(formatDate(item.createdAt))}</div>
        <p>${esc(item.text || '')}</p>
      </div>`).join("") : '<div class="empty-state">No messages yet.</div>';
    threadMessages.scrollTop = threadMessages.scrollHeight;
  }

  function openConversation(otherUid, conversationId) {
    currentConversationId = conversationId;
    activeConversation = currentThreads.find((item) => item.conversationId === conversationId) || { otherUid, otherName: 'Member' };
    renderThreadList();
    unsubMessages?.();
    unsubMessages = onSnapshot(query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'), limit(100)), (snap) => {
      renderMessages(snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
    });
    togglePanel(true);
  }

  launcher?.addEventListener('click', () => togglePanel());
  closeBtn?.addEventListener('click', () => togglePanel(false));

  composeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser || !currentConversationId || !activeConversation?.otherUid) return;
    const text = composeText.value.trim();
    if (!text) return;
    const profile = currentProfile || await ensureCurrentProfile();
    const senderName = profile?.displayName || currentUser.displayName || currentUser.email || 'Member';
    const now = Timestamp.now();
    await addDoc(collection(db, 'conversations', currentConversationId, 'messages'), {
      fromId: currentUser.uid,
      fromName: senderName,
      toId: activeConversation.otherUid,
      text,
      createdAt: now
    });
    await Promise.all([
      updateDoc(doc(db, 'conversations', currentConversationId), {
        lastMessageText: text,
        lastMessageAt: now,
        updatedAt: now,
        lastSenderId: currentUser.uid
      }),
      setDoc(doc(db, 'users', currentUser.uid, 'threads', currentConversationId), {
        ownerId: currentUser.uid,
        conversationId: currentConversationId,
        otherUid: activeConversation.otherUid,
        otherName: activeConversation.otherName,
        lastMessageText: text,
        lastSenderId: currentUser.uid,
        updatedAt: now
      }, { merge: true }),
      setDoc(doc(db, 'users', activeConversation.otherUid, 'threads', currentConversationId), {
        ownerId: activeConversation.otherUid,
        conversationId: currentConversationId,
        otherUid: currentUser.uid,
        otherName: senderName,
        lastMessageText: text,
        lastSenderId: currentUser.uid,
        updatedAt: now
      }, { merge: true })
    ]);
    composeText.value = '';
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    unsubThreads?.();
    unsubMessages?.();
    currentThreads = [];
    currentConversationId = null;
    activeConversation = null;
    if (!user) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    await ensureCurrentProfile();
    unsubThreads = onSnapshot(query(collection(db, 'users', user.uid, 'threads'), orderBy('updatedAt', 'desc'), limit(30)), (snap) => {
      currentThreads = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      renderThreadList();
      if (!currentConversationId && currentThreads[0]) {
        openConversation(currentThreads[0].otherUid, currentThreads[0].conversationId);
      }
    });
  });
}
