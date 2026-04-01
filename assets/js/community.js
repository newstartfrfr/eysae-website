
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const ADMIN_EMAILS = new Set(["krizo19@gmail.com"]);
const $ = (id) => document.getElementById(id);
const ui = {
  setupNotice: $("setupNotice"),
  authStatus: $("authStatus"),
  logoutBtn: $("logoutBtn"),
  profileSpotlight: $("profileSpotlight"),
  authPanel: $("authPanel"),
  profilePanel: $("profilePanel"),
  composerPanel: $("composerPanel"),
  signInForm: $("signInForm"),
  signUpForm: $("signUpForm"),
  profileForm: $("profileForm"),
  postForm: $("postForm"),
  feedList: $("feedList"),
  membersGrid: $("membersGrid"),
  conversationList: $("conversationList"),
  widgetConversationList: $("widgetConversationList"),
  messageThread: $("messageThread"),
  activeConversationHeader: $("activeConversationHeader"),
  messageForm: $("messageForm"),
  recipientUid: $("recipientUid"),
  directMessageText: $("directMessageText"),
  signInEmail: $("signInEmail"),
  signInPassword: $("signInPassword"),
  signUpName: $("signUpName"),
  signUpRole: $("signUpRole"),
  signUpEmail: $("signUpEmail"),
  signUpPassword: $("signUpPassword"),
  profileName: $("profileName"),
  profileOrganisation: $("profileOrganisation"),
  profileBio: $("profileBio"),
  profileSocial: $("profileSocial"),
  postType: $("postType"),
  postTag: $("postTag"),
  postMessage: $("postMessage"),
  refreshFeedBtn: $("refreshFeedBtn"),
  chatWidget: $("chatWidget"),
  chatWidgetToggle: $("chatWidgetToggle"),
  chatWidgetPanel: $("chatWidgetPanel"),
  chatWidgetClose: $("chatWidgetClose"),
  chatUnreadBadge: $("chatUnreadBadge"),
  chatOpenFromPanel: $("chatOpenFromPanel")
};

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let currentFeed = [];
let currentMembers = [];
let currentConversations = [];
let activeConversationId = null;
let activeConversationMemberId = null;
let activeThreadUnsub = null;
let feedUnsub = null;
let membersUnsub = null;
let conversationsUnsub = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map((part) => part[0].toUpperCase()).join("") : "EY";
}

function formatDate(value) {
  if (!value) return "—";
  const date = value.toDate ? value.toDate() : value;
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(document.documentElement.lang || "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function setStatus(message, tone = "neutral") {
  if (!ui.authStatus) return;
  ui.authStatus.textContent = message;
  ui.authStatus.classList.remove("success", "error");
  if (tone === "success") ui.authStatus.classList.add("success");
  if (tone === "error") ui.authStatus.classList.add("error");
}

function showSetupNotice(message) {
  if (!ui.setupNotice) return;
  ui.setupNotice.classList.remove("hidden");
  ui.setupNotice.innerHTML = `<strong>Firebase setup</strong><p>${escapeHtml(message)}</p>`;
}

function humanizeError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "This email is already in use.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled in Firebase Authentication.";
    case "permission-denied":
      return "Firestore rules are blocking this action.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return error?.message || "Something went wrong.";
  }
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").toLowerCase());
}

function conversationIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join("__");
}

function switchAuthMode(mode) {
  const signInActive = mode !== "signup";
  ui.signInForm?.classList.toggle("hidden", !signInActive);
  ui.signUpForm?.classList.toggle("hidden", signInActive);
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === (signInActive ? "signin" : "signup"));
  });
}

function bindAuthTabs() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => switchAuthMode(button.dataset.authMode || "signin"));
  });
}

function renderProfileSpotlight(profile = null, user = null) {
  if (!ui.profileSpotlight) return;
  if (!profile || !user) {
    ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
    ui.profileSpotlight.innerHTML = `
      <div class="profile-avatar">EY</div>
      <div>
        <strong>Member card</strong>
        <p>Sign in to activate your public profile.</p>
      </div>
    `;
    return;
  }

  const name = profile.displayName || user.displayName || user.email || "Member";
  const role = profile.role || "Member";
  const bio = profile.bio || "Your public profile is visible to signed-in members.";
  const social = profile.socialLink
    ? `<a href="${escapeHtml(profile.socialLink)}" target="_blank" rel="noreferrer">open link</a>`
    : "";
  const admin = isAdminEmail(user.email) ? `<span class="admin-badge">Admin</span>` : "";

  ui.profileSpotlight.className = "profile-spotlight";
  ui.profileSpotlight.innerHTML = `
    <div class="profile-avatar">${escapeHtml(initials(name))}</div>
    <div>
      <strong>${escapeHtml(name)}</strong>
      <div class="profile-meta">
        <span class="role-pill">${escapeHtml(role)}</span>
        ${admin}
      </div>
      <p>${escapeHtml(bio)}</p>
      ${social ? `<div class="profile-links">${social}</div>` : ""}
    </div>
  `;
}

function renderFeed(posts = currentFeed) {
  currentFeed = Array.isArray(posts) ? posts : [];
  if (!ui.feedList) return;
  if (!currentFeed.length) {
    ui.feedList.innerHTML = `<div class="empty-state">No posts yet.</div>`;
    return;
  }

  ui.feedList.innerHTML = currentFeed.map((post) => {
    const canDelete = currentUser && (post.authorId === currentUser.uid || isAdminEmail(currentUser.email));
    const social = post.socialLink ? `<a href="${escapeHtml(post.socialLink)}" target="_blank" rel="noreferrer">profile link</a>` : "";
    return `
      <article class="feed-card">
        <div class="feed-card-top">
          <div class="feed-author-row">
            <div class="feed-avatar">${escapeHtml(initials(post.authorName || 'Member'))}</div>
            <div>
              <div class="feed-chip">${escapeHtml(post.type || 'update')}</div>
              <strong class="feed-author">${escapeHtml(post.authorName || 'Member')}</strong>
              <div class="feed-meta">${escapeHtml(post.authorRole || 'Member')} · ${escapeHtml(formatDate(post.createdAt))}${social ? ` · ${social}` : ''}</div>
            </div>
          </div>
          ${canDelete ? `<button type="button" class="btn-delete-post" data-post-id="${escapeHtml(post.id)}">Delete</button>` : ''}
        </div>
        ${post.tag ? `<p class="feed-tag">#${escapeHtml(post.tag)}</p>` : ''}
        <p class="feed-content">${escapeHtml(post.content || '')}</p>
      </article>
    `;
  }).join("");

  ui.feedList.querySelectorAll("[data-post-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const postId = button.dataset.postId;
      if (!postId || !db) return;
      try {
        await deleteDoc(doc(db, "posts", postId));
        setStatus("Post deleted.", "success");
      } catch (error) {
        setStatus(humanizeError(error), "error");
      }
    });
  });
}

function memberCard(member) {
  const name = member.displayName || member.email || "Member";
  const role = member.role || "Member";
  const social = member.socialLink ? `<a href="${escapeHtml(member.socialLink)}" target="_blank" rel="noreferrer">open link</a>` : "";
  return `
    <article class="member-card">
      <div class="member-card-top">
        <div class="member-author-row">
          <div class="member-avatar">${escapeHtml(initials(name))}</div>
          <div>
            <strong class="member-name">${escapeHtml(name)}</strong>
            <div class="member-role-row">
              <span class="role-pill">${escapeHtml(role)}</span>
              ${member.email && isAdminEmail(member.email) ? `<span class="admin-badge">Admin</span>` : ''}
            </div>
          </div>
        </div>
        ${currentUser ? `<button type="button" class="member-message-btn" data-member-id="${escapeHtml(member.id)}">Message</button>` : ''}
      </div>
      ${member.bio ? `<p class="member-bio">${escapeHtml(member.bio)}</p>` : ''}
      ${social ? `<div class="member-actions">${social}</div>` : ''}
    </article>
  `;
}

function renderMembers(members = currentMembers) {
  currentMembers = Array.isArray(members) ? members : [];
  if (!ui.membersGrid) return;
  if (!currentMembers.length) {
    ui.membersGrid.innerHTML = `<div class="empty-state">No members yet.</div>`;
    return;
  }
  ui.membersGrid.innerHTML = currentMembers.map(memberCard).join("");
  ui.membersGrid.querySelectorAll(".member-message-btn").forEach((button) => {
    button.addEventListener("click", () => {
      openChat();
      openConversation(button.dataset.memberId || "");
    });
  });
}

function renderConversations(conversations = currentConversations) {
  currentConversations = Array.isArray(conversations) ? conversations : [];
  const html = currentConversations.length
    ? currentConversations.map((conversation) => {
        const otherId = conversation.participantIds.find((id) => id !== currentUser?.uid) || "";
        const otherName = conversation.participantNames?.[otherId] || "Member";
        const active = conversation.id === activeConversationId ? ' active' : '';
        return `
          <button type="button" class="conversation-card${active}" data-conversation-id="${escapeHtml(conversation.id)}" data-member-id="${escapeHtml(otherId)}">
            <span class="conversation-avatar">${escapeHtml(initials(otherName))}</span>
            <span class="conversation-content">
              <strong>${escapeHtml(otherName)}</strong>
              <small>${escapeHtml(conversation.lastMessageText || 'Open conversation')}</small>
            </span>
          </button>
        `;
      }).join("")
    : `<div class="empty-state">No conversations yet.</div>`;

  [ui.conversationList, ui.widgetConversationList].forEach((node) => {
    if (!node) return;
    node.innerHTML = html;
    node.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", () => {
        openConversation(button.dataset.memberId || "", button.dataset.conversationId || "");
      });
    });
  });

  if (ui.chatUnreadBadge) {
    const count = currentConversations.filter((item) => item.lastSenderId && item.lastSenderId !== currentUser?.uid).length;
    ui.chatUnreadBadge.textContent = String(count);
    ui.chatUnreadBadge.classList.toggle("hidden", count === 0);
  }
}

function renderThread(messages = []) {
  if (!ui.messageThread) return;
  if (!messages.length) {
    ui.messageThread.innerHTML = `<div class="empty-state">No messages in this conversation yet.</div>`;
    return;
  }
  ui.messageThread.innerHTML = messages.map((message) => {
    const mine = message.fromId === currentUser?.uid;
    return `
      <div class="message-bubble${mine ? ' mine' : ''}">
        <div class="message-bubble-meta">${escapeHtml(message.fromName || 'Member')} · ${escapeHtml(formatDate(message.createdAt))}</div>
        <p>${escapeHtml(message.text || '')}</p>
      </div>
    `;
  }).join("");
  ui.messageThread.scrollTop = ui.messageThread.scrollHeight;
}

async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const base = {
    displayName: user.displayName || user.email?.split("@")[0] || "Member",
    email: user.email || "",
    role: snapshot.exists() ? (snapshot.data().role || "Member") : "Member",
    bio: snapshot.exists() ? (snapshot.data().bio || "") : "",
    socialLink: snapshot.exists() ? (snapshot.data().socialLink || "") : "",
    createdAt: snapshot.exists() ? (snapshot.data().createdAt || Timestamp.now()) : Timestamp.now(),
    updatedAt: Timestamp.now()
  };
  await setDoc(userRef, base, { merge: true });
  currentProfile = base;
  return base;
}

function fillProfileForm(profile) {
  if (!profile) return;
  if (ui.profileName) ui.profileName.value = profile.displayName || "";
  if (ui.profileOrganisation) ui.profileOrganisation.value = profile.role || "";
  if (ui.profileBio) ui.profileBio.value = profile.bio || "";
  if (ui.profileSocial) ui.profileSocial.value = profile.socialLink || "";
}

function stopAllRealtime() {
  if (feedUnsub) feedUnsub();
  if (membersUnsub) membersUnsub();
  if (conversationsUnsub) conversationsUnsub();
  if (activeThreadUnsub) activeThreadUnsub();
  feedUnsub = membersUnsub = conversationsUnsub = activeThreadUnsub = null;
}

function showSignedOutState() {
  currentProfile = null;
  activeConversationId = null;
  activeConversationMemberId = null;
  ui.logoutBtn?.classList.add("hidden");
  ui.profilePanel?.classList.add("hidden");
  ui.composerPanel?.classList.add("hidden");
  ui.messageForm?.classList.add("hidden");
  ui.authPanel?.classList.remove("hidden");
  ui.chatWidget?.classList.add("hidden");
  renderProfileSpotlight();
  renderConversations([]);
  renderThread([]);
  setStatus("Not signed in.");
}

function showSignedInState(user, profile) {
  ui.logoutBtn?.classList.remove("hidden");
  ui.profilePanel?.classList.remove("hidden");
  ui.composerPanel?.classList.remove("hidden");
  ui.messageForm?.classList.add("hidden");
  ui.authPanel?.classList.add("hidden");
  ui.chatWidget?.classList.remove("hidden");
  renderProfileSpotlight(profile, user);
  fillProfileForm(profile);
  setStatus(`Signed in as ${user.email}.`, "success");
}

function startRealtimeForPublic() {
  feedUnsub = onSnapshot(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(60)),
    (snapshot) => renderFeed(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))),
    (error) => setStatus(humanizeError(error), "error")
  );

  membersUnsub = onSnapshot(
    query(collection(db, "users"), orderBy("displayName"), limit(100)),
    (snapshot) => {
      const members = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      renderMembers(currentUser ? members.filter((item) => item.id !== currentUser.uid) : members);
    },
    (error) => setStatus(humanizeError(error), "error")
  );
}

function startRealtimeForSignedIn() {
  if (!currentUser) return;
  conversationsUnsub = onSnapshot(
    query(collection(db, "conversations"), where("participantIds", "array-contains", currentUser.uid), orderBy("lastMessageAt", "desc"), limit(40)),
    (snapshot) => renderConversations(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))),
    (error) => setStatus(humanizeError(error), "error")
  );
}

async function ensureConversation(memberId) {
  if (!currentUser || !memberId || !db) return null;
  const meId = currentUser.uid;
  const conversationId = conversationIdFor(meId, memberId);
  const meProfile = currentProfile || await ensureUserProfile(currentUser);
  const memberSnap = await getDoc(doc(db, "users", memberId));
  if (!memberSnap.exists()) throw new Error("Recipient profile not found.");
  const member = memberSnap.data();
  await setDoc(doc(db, "conversations", conversationId), {
    participantIds: [meId, memberId].sort(),
    participantNames: {
      [meId]: meProfile.displayName || currentUser.displayName || currentUser.email || "Member",
      [memberId]: member.displayName || member.email || "Member"
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessageText: "Conversation opened.",
    lastSenderId: meId
  }, { merge: true });
  return { conversationId, memberName: member.displayName || member.email || "Member" };
}

async function openConversation(memberId, existingConversationId = "") {
  if (!currentUser || !memberId) return;
  try {
    const payload = existingConversationId ? { conversationId: existingConversationId } : await ensureConversation(memberId);
    if (!payload?.conversationId) return;
    activeConversationId = payload.conversationId;
    activeConversationMemberId = memberId;
    ui.recipientUid && (ui.recipientUid.value = memberId);
    ui.messageForm?.classList.remove("hidden");

    const member = currentMembers.find((item) => item.id === memberId) || null;
    const memberName = member?.displayName || member?.email || payload.memberName || "Member";
    if (ui.activeConversationHeader) {
      ui.activeConversationHeader.innerHTML = `<strong>${escapeHtml(memberName)}</strong><p>Private conversation</p>`;
    }

    if (activeThreadUnsub) activeThreadUnsub();
    activeThreadUnsub = onSnapshot(
      query(collection(db, "conversations", activeConversationId, "messages"), orderBy("createdAt", "asc"), limit(200)),
      (snapshot) => renderThread(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))),
      (error) => setStatus(humanizeError(error), "error")
    );
    renderConversations(currentConversations);
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
}

function openChat() {
  ui.chatWidgetPanel?.classList.remove("hidden");
  if (ui.chatWidgetToggle) ui.chatWidgetToggle.setAttribute("aria-expanded", "true");
}

function closeChat() {
  ui.chatWidgetPanel?.classList.add("hidden");
  if (ui.chatWidgetToggle) ui.chatWidgetToggle.setAttribute("aria-expanded", "false");
}

function bindButtons() {
  ui.logoutBtn?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      setStatus("Signed out.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.refreshFeedBtn?.addEventListener("click", async () => {
    try {
      const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(60)));
      renderFeed(snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })));
      setStatus("Feed refreshed.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.chatWidgetToggle?.addEventListener("click", () => {
    if (ui.chatWidgetPanel?.classList.contains("hidden")) openChat();
    else closeChat();
  });
  ui.chatWidgetClose?.addEventListener("click", closeChat);
  ui.chatOpenFromPanel?.addEventListener("click", openChat);
}

function bindForms() {
  ui.signInForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, ui.signInEmail.value.trim(), ui.signInPassword.value || "");
      ui.signInForm.reset();
      setStatus("Signed in successfully.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.signUpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const displayName = ui.signUpName?.value.trim() || "";
    const email = ui.signUpEmail?.value.trim() || "";
    const password = ui.signUpPassword?.value || "";
    const role = ui.signUpRole?.value.trim() || "Member";
    if (displayName.length < 2) return setStatus("Display name must be at least 2 characters.", "error");
    if (!email || password.length < 6) return setStatus("Enter a valid email and a password with at least 6 characters.", "error");

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await setDoc(doc(db, "users", credential.user.uid), {
        displayName,
        email,
        role,
        bio: "",
        socialLink: "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      ui.signUpForm.reset();
      switchAuthMode("signin");
      setStatus("Account created successfully.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return setStatus("You need to sign in first.", "error");
    const displayName = ui.profileName?.value.trim() || "";
    const role = ui.profileOrganisation?.value.trim() || "Member";
    const bio = ui.profileBio?.value.trim() || "";
    const socialLink = ui.profileSocial?.value.trim() || "";
    if (displayName.length < 2) return setStatus("Display name must be at least 2 characters.", "error");
    if (socialLink && !/^https?:\/\//i.test(socialLink)) return setStatus("The link must start with http:// or https://", "error");
    try {
      await updateProfile(currentUser, { displayName });
      const userRef = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(userRef);
      await setDoc(userRef, {
        displayName,
        email: currentUser.email || snapshot.data()?.email || "",
        role,
        bio,
        socialLink,
        createdAt: snapshot.exists() ? (snapshot.data().createdAt || Timestamp.now()) : Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      currentProfile = { displayName, email: currentUser.email || "", role, bio, socialLink };
      renderProfileSpotlight(currentProfile, currentUser);
      setStatus("Profile updated.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return setStatus("You need to sign in first.", "error");
    const content = ui.postMessage?.value.trim() || "";
    if (!content) return setStatus("Write a post before publishing.", "error");
    try {
      const profile = currentProfile || await ensureUserProfile(currentUser);
      await addDoc(collection(db, "posts"), {
        authorId: currentUser.uid,
        authorName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        authorRole: profile.role || "Member",
        socialLink: profile.socialLink || "",
        type: ui.postType?.value || "update",
        tag: ui.postTag?.value.trim() || "",
        content,
        createdAt: serverTimestamp()
      });
      ui.postForm.reset();
      setStatus("Post published.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return setStatus("You need to sign in first.", "error");
    const recipientUid = ui.recipientUid?.value || activeConversationMemberId || "";
    const text = ui.directMessageText?.value.trim() || "";
    if (!recipientUid) return setStatus("Select a member first.", "error");
    if (!text) return setStatus("Write a message first.", "error");

    try {
      const payload = await ensureConversation(recipientUid);
      const conversationId = payload.conversationId;
      const profile = currentProfile || await ensureUserProfile(currentUser);
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        fromId: currentUser.uid,
        fromName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        toId: recipientUid,
        text,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessageText: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSenderId: currentUser.uid
      });
      ui.directMessageText.value = "";
      activeConversationId = conversationId;
      activeConversationMemberId = recipientUid;
      openChat();
      setStatus("Message sent.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });
}

function handleAuthState() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    stopAllRealtime();
    startRealtimeForPublic();

    if (!user) {
      showSignedOutState();
      return;
    }

    try {
      const profile = await ensureUserProfile(user);
      showSignedInState(user, profile);
      startRealtimeForSignedIn();
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });
}

function init() {
  bindAuthTabs();
  bindButtons();
  bindForms();
  switchAuthMode("signin");

  if (!firebaseIsConfigured(firebaseConfig)) {
    showSetupNotice("Firebase configuration is missing or incomplete.");
    setStatus("Firebase configuration is missing or incomplete.", "error");
    return;
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    handleAuthState();
  } catch (error) {
    showSetupNotice(humanizeError(error));
    setStatus(humanizeError(error), "error");
  }
}

init();
