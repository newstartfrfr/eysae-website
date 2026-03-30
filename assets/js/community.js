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
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const setupNotice = document.getElementById("setupNotice");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");

const authPanel = document.getElementById("authPanel");
const profilePanel = document.getElementById("profilePanel");
const composerPanel = document.getElementById("composerPanel");
const memberPanels = document.getElementById("memberPanels");

const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const profileForm = document.getElementById("profileForm");
const postForm = document.getElementById("postForm");
const messageForm = document.getElementById("messageForm");

const memberList = document.getElementById("memberList");
const feedList = document.getElementById("feedList");
const inboxList = document.getElementById("inboxList");
const messageRecipient = document.getElementById("messageRecipient");
const refreshFeedBtn = document.getElementById("refreshFeedBtn");

const authTabs = document.querySelectorAll(".auth-tab");

let auth;
let db;
let currentUser = null;
let unsubscribeFeed = null;
let unsubscribeInbox = null;
let unsubscribeMembers = null;

if (!firebaseIsConfigured(firebaseConfig)) {
  setupNotice.classList.add("visible");
  authStatus.textContent = "Add Firebase keys first.";
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setupNotice.classList.remove("visible");
  initCommunity();
}

function initCommunity() {
  bindAuthTabs();
  bindForms();
  bindButtons();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      showSignedOutState();
      stopRealtimeListeners();
      return;
    }

    await ensureUserProfile(user);
    await fillProfileForm(user.uid);
    showSignedInState(user);
    startRealtimeListeners(user.uid);
  });
}

function bindAuthTabs() {
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      authTabs.forEach((button) => button.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.dataset.authTab;
      signinForm.classList.toggle("hidden", target !== "signin");
      signupForm.classList.toggle("hidden", target !== "signup");
    });
  });
}

function bindForms() {
  signinForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      signinForm.reset();
      authStatus.textContent = "Signed in successfully.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const displayName = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await ensureUserProfile(credential.user, { displayName });
      signupForm.reset();
      authStatus.textContent = "Account created successfully.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const profileData = {
      displayName: document.getElementById("profileName").value.trim(),
      role: document.getElementById("profileRole").value.trim(),
      bio: document.getElementById("profileBio").value.trim(),
      socialLink: document.getElementById("profileSocial").value.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      await updateProfile(currentUser, { displayName: profileData.displayName });
      await updateDoc(doc(db, "users", currentUser.uid), profileData);
      authStatus.textContent = "Profile updated.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });

  postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};

    const payload = {
      authorId: currentUser.uid,
      authorName: profile.displayName || currentUser.displayName || currentUser.email,
      authorRole: profile.role || "Member",
      socialLink: profile.socialLink || "",
      type: document.getElementById("postType").value,
      tag: document.getElementById("postTag").value.trim(),
      content: document.getElementById("postContent").value.trim(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "posts"), payload);
      postForm.reset();
      authStatus.textContent = "Post published.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const toId = messageRecipient.value;
    const text = document.getElementById("messageText").value.trim();
    if (!toId || !text) return;

    const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};

    try {
      await addDoc(collection(db, "users", toId, "messages"), {
        fromId: currentUser.uid,
        fromName: profile.displayName || currentUser.displayName || currentUser.email,
        text,
        toId,
        createdAt: serverTimestamp()
      });
      messageForm.reset();
      authStatus.textContent = "Message sent.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });
}

function bindButtons() {
  logoutBtn?.addEventListener("click", async () => {
    if (!auth || !currentUser) return;

    try {
      await signOut(auth);
      authStatus.textContent = "Signed out.";
    } catch (error) {
      authStatus.textContent = humanizeError(error);
    }
  });

  refreshFeedBtn?.addEventListener("click", async () => {
    if (!db) return;
    await renderMembers();
    await renderFeed();
  });
}

async function ensureUserProfile(user, overrides = {}) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName: overrides.displayName || user.displayName || user.email?.split("@")[0] || "Member",
      email: user.email || "",
      role: "Member",
      bio: "",
      socialLink: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return;
  }

  const existing = snapshot.data();
  if (!existing.displayName && (user.displayName || overrides.displayName)) {
    await updateDoc(userRef, {
      displayName: overrides.displayName || user.displayName,
      updatedAt: serverTimestamp()
    });
  }
}

async function fillProfileForm(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return;

  const profile = snapshot.data();
  document.getElementById("profileName").value = profile.displayName || "";
  document.getElementById("profileRole").value = profile.role || "";
  document.getElementById("profileBio").value = profile.bio || "";
  document.getElementById("profileSocial").value = profile.socialLink || "";
}

function startRealtimeListeners(uid) {
  stopRealtimeListeners();

  unsubscribeFeed = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)), (snapshot) => {
    const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderFeed(posts);
  });

  unsubscribeMembers = onSnapshot(query(collection(db, "users"), orderBy("displayName"), limit(100)), (snapshot) => {
    const members = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => item.id !== uid);
    renderMembers(members);
  });

  unsubscribeInbox = onSnapshot(query(collection(db, "users", uid, "messages"), orderBy("createdAt", "desc"), limit(50)), (snapshot) => {
    const messages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderInbox(messages);
  });
}

function stopRealtimeListeners() {
  if (unsubscribeFeed) unsubscribeFeed();
  if (unsubscribeMembers) unsubscribeMembers();
  if (unsubscribeInbox) unsubscribeInbox();
  unsubscribeFeed = null;
  unsubscribeMembers = null;
  unsubscribeInbox = null;
}

async function renderFeed(posts = []) {
  if (!Array.isArray(posts)) {
    const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)));
    posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  if (!posts.length) {
    feedList.innerHTML = '<p class="empty-state">No posts yet.</p>';
    return;
  }

  feedList.innerHTML = posts.map((post) => {
    const canDelete = currentUser && currentUser.uid === post.authorId;
    const social = post.socialLink ? `<a href="${escapeAttribute(post.socialLink)}" target="_blank" rel="noreferrer">social</a>` : "";
    return `
      <article class="feed-card">
        <div class="feed-card-top">
          <div>
            <div class="feed-chip">${escapeHtml(post.type || "update")}</div>
            <h3>${escapeHtml(post.authorName || "Member")}</h3>
            <p class="feed-meta">${escapeHtml(post.authorRole || "Member")} · ${formatDate(post.createdAt)} ${social ? `· ${social}` : ""}</p>
          </div>
          ${canDelete ? `<button type="button" class="btn-delete-post" data-post-id="${post.id}">Delete</button>` : ""}
        </div>
        ${post.tag ? `<p class="feed-tag">#${escapeHtml(post.tag)}</p>` : ""}
        <p class="feed-content">${escapeHtml(post.content || "")}</p>
      </article>
    `;
  }).join("");

  feedList.querySelectorAll(".btn-delete-post").forEach((button) => {
    button.addEventListener("click", async () => {
      const postId = button.dataset.postId;
      if (!postId) return;
      await deleteDoc(doc(db, "posts", postId));
    });
  });
}

async function renderMembers(members = []) {
  if (!Array.isArray(members)) {
    const snapshot = await getDocs(query(collection(db, "users"), orderBy("displayName"), limit(100)));
    members = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !currentUser || item.id !== currentUser.uid);
  }

  if (!members.length) {
    memberList.innerHTML = '<p class="empty-state">No members yet.</p>';
    messageRecipient.innerHTML = '<option value="">No member available</option>';
    return;
  }

  memberList.innerHTML = members.map((member) => {
    const social = member.socialLink ? `<a href="${escapeAttribute(member.socialLink)}" target="_blank" rel="noreferrer">social</a>` : "";
    return `
      <article class="member-card">
        <h3>${escapeHtml(member.displayName || "Member")}</h3>
        <p>${escapeHtml(member.role || "Member")}</p>
        ${member.bio ? `<p class="member-bio">${escapeHtml(member.bio)}</p>` : ""}
        <div class="member-actions">
          ${social || ""}
          <button type="button" class="member-message-btn" data-member-id="${member.id}">Message</button>
        </div>
      </article>
    `;
  }).join("");

  messageRecipient.innerHTML = members.map((member) => {
    return `<option value="${member.id}">${escapeHtml(member.displayName || member.email || "Member")}</option>`;
  }).join("");

  memberList.querySelectorAll(".member-message-btn").forEach((button) => {
    button.addEventListener("click", () => {
      messageRecipient.value = button.dataset.memberId || "";
      document.getElementById("messageText").focus();
    });
  });
}

function renderInbox(messages = []) {
  if (!messages.length) {
    inboxList.innerHTML = '<p class="empty-state">No messages yet.</p>';
    return;
  }

  inboxList.innerHTML = messages.map((message) => `
    <article class="inbox-card">
      <div class="inbox-card-top">
        <strong>${escapeHtml(message.fromName || "Member")}</strong>
        <span>${formatDate(message.createdAt)}</span>
      </div>
      <p>${escapeHtml(message.text || "")}</p>
    </article>
  `).join("");
}

function showSignedOutState() {
  authPanel.classList.remove("hidden");
  profilePanel.classList.add("hidden");
  composerPanel.classList.add("hidden");
  memberPanels.classList.add("hidden");
  logoutBtn.disabled = true;
  authStatus.textContent = "Not signed in.";
  memberList.innerHTML = '<p class="empty-state">Sign in to see members.</p>';
  inboxList.innerHTML = '<p class="empty-state">Sign in to read messages.</p>';
  feedList.innerHTML = '<p class="empty-state">Sign in or create an account to start posting.</p>';
}

function showSignedInState(user) {
  authPanel.classList.remove("hidden");
  profilePanel.classList.remove("hidden");
  composerPanel.classList.remove("hidden");
  memberPanels.classList.remove("hidden");
  logoutBtn.disabled = false;
  authStatus.textContent = `Signed in as ${user.email}.`;
}

function formatDate(value) {
  const raw = value?.toDate ? value.toDate() : null;
  if (!raw) return "just now";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(raw);
}

function humanizeError(error) {
  if (!error?.message) return "Something went wrong.";
  return error.message.replace("Firebase: ", "").replaceAll("auth/", "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
