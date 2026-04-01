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
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

const ADMIN_EMAILS = new Set(["krizo19@gmail.com"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const $ = (id) => document.getElementById(id);
const ui = {
  setupNotice: $("setupNotice"),
  authStatus: $("authStatus"),
  logoutBtn: $("logoutBtn"),
  profileSpotlight: $("profileSpotlight"),
  authPanel: $("authPanel"),
  profilePanel: $("profilePanel"),
  composerPanel: $("composerPanel"),
  adminPanel: $("adminPanel"),
  pendingPostsList: $("pendingPostsList"),
  pendingCountBadge: $("pendingCountBadge"),
  signInForm: $("signInForm"),
  signUpForm: $("signUpForm"),
  profileForm: $("profileForm"),
  postForm: $("postForm"),
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
  postTitle: $("postTitle"),
  postMessage: $("postMessage"),
  postImage: $("postImage"),
  postImagePreviewWrap: $("postImagePreviewWrap"),
  postImagePreview: $("postImagePreview"),
  clearPostImageBtn: $("clearPostImageBtn"),
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
let storage = null;
let currentUser = null;
let currentProfile = null;
let currentMembers = [];
let currentThreads = [];
let currentPendingPosts = [];
let activeConversationId = null;
let activeConversationMemberId = null;
let activeThreadUnsub = null;
let membersUnsub = null;
let threadsUnsub = null;
let pendingUnsub = null;
let selectedImageFile = null;

function esc(value) {
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
  const date = value?.toDate ? value.toDate() : value;
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(document.documentElement.lang || "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").toLowerCase());
}

function isAdminUser(user = currentUser) {
  return !!user && isAdminEmail(user.email);
}

function setStatus(message, tone = "neutral") {
  if (!ui.authStatus) return;
  ui.authStatus.textContent = message;
  ui.authStatus.className = `status-bar ${tone}`.trim();
}

function showSetupNotice(message) {
  if (!ui.setupNotice) return;
  ui.setupNotice.classList.remove("hidden");
  ui.setupNotice.innerHTML = `<strong>Firebase setup</strong><p>${esc(message)}</p>`;
}

function humanizeError(error) {
  const code = error?.code || "";
  if (code === "permission-denied") return "Firestore rules are blocking this action.";
  if (code === "storage/unauthorized") return "Storage rules are blocking the image upload.";
  if (code === "storage/canceled") return "Image upload was cancelled.";
  if (code === "storage/object-not-found") return "Image file could not be found in storage.";
  if (code === "auth/email-already-in-use") return "This email address is already in use.";
  if (code === "auth/invalid-email") return "Invalid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters long.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Wrong email or password.";
  if (code === "auth/operation-not-allowed") return "Email/password sign-in is not enabled in Firebase Authentication.";
  if (code === "auth/api-key-not-valid.-please-pass-a-valid-api-key.") return "Firebase API key is not valid for this web app.";
  return error?.message || "Something went wrong.";
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
        <p>Sign in to activate your member profile.</p>
      </div>
    `;
    return;
  }

  const name = profile.displayName || user.displayName || user.email || "Member";
  const role = profile.role || "Member";
  const admin = isAdminUser(user) ? `<span class="admin-badge">Admin</span>` : "";
  const social = profile.socialLink ? `<a href="${esc(profile.socialLink)}" target="_blank" rel="noreferrer">Open link</a>` : "";
  const note = isAdminUser(user)
    ? "Admin mode is active. You can review pending submissions and publish them."
    : (profile.bio || "Your profile is visible to other signed-in members.");

  ui.profileSpotlight.className = "profile-spotlight";
  ui.profileSpotlight.innerHTML = `
    <div class="profile-avatar">${esc(initials(name))}</div>
    <div>
      <strong>${esc(name)}</strong>
      <div class="profile-meta">
        <span class="role-pill">${esc(role)}</span>
        ${admin}
      </div>
      <p>${esc(note)}</p>
      ${social ? `<div class="profile-links">${social}</div>` : ""}
    </div>
  `;
}

function renderMembers(members = currentMembers) {
  currentMembers = Array.isArray(members) ? members : [];
  if (!ui.membersGrid) return;
  if (!currentMembers.length) {
    ui.membersGrid.innerHTML = `<div class="empty-state">No members yet.</div>`;
    return;
  }
  ui.membersGrid.innerHTML = currentMembers.map((member) => {
    const name = member.displayName || member.email || "Member";
    const role = member.role || "Member";
    return `
      <article class="member-card">
        <div class="member-card-top">
          <div class="member-author-row">
            <div class="member-avatar">${esc(initials(name))}</div>
            <div>
              <strong class="member-name">${esc(name)}</strong>
              <div class="member-role-row">
                <span class="role-pill">${esc(role)}</span>
                ${member.email && isAdminEmail(member.email) ? `<span class="admin-badge">Admin</span>` : ""}
              </div>
            </div>
          </div>
          ${currentUser ? `<button type="button" class="member-message-btn" data-member-id="${esc(member.id)}">Message</button>` : ""}
        </div>
        ${member.bio ? `<p class="member-bio">${esc(member.bio)}</p>` : ""}
      </article>
    `;
  }).join("");

  ui.membersGrid.querySelectorAll("[data-member-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await openConversation(button.dataset.memberId || "");
      openChat();
    });
  });
}

function renderConversations(threads = currentThreads) {
  currentThreads = Array.isArray(threads) ? threads : [];
  const renderList = (container) => {
    if (!container) return;
    if (!currentUser) {
      container.innerHTML = `<div class="empty-state">Sign in to open messages.</div>`;
      return;
    }
    if (!currentThreads.length) {
      container.innerHTML = `<div class="empty-state">No conversations yet.</div>`;
      return;
    }
    container.innerHTML = currentThreads.map((item) => {
      const active = item.conversationId === activeConversationId ? " active" : "";
      return `
        <button type="button" class="conversation-item${active}" data-conversation-id="${esc(item.conversationId)}" data-member-id="${esc(item.otherUid)}">
          <span class="conversation-avatar">${esc(initials(item.otherName || "Member"))}</span>
          <span class="conversation-copy">
            <strong>${esc(item.otherName || "Member")}</strong>
            <small>${esc(item.lastMessageText || "Open conversation")}</small>
          </span>
        </button>
      `;
    }).join("");

    container.querySelectorAll("[data-conversation-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await openConversation(button.dataset.memberId || "", button.dataset.conversationId || "");
        openChat();
      });
    });
  };
  renderList(ui.conversationList);
  renderList(ui.widgetConversationList);
  if (ui.chatUnreadBadge) {
    ui.chatUnreadBadge.textContent = String(currentThreads.length);
    ui.chatUnreadBadge.classList.toggle("hidden", currentThreads.length === 0);
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
      <div class="message-bubble${mine ? " mine" : ""}">
        <div class="message-bubble-meta">${esc(message.fromName || "Member")} · ${esc(formatDate(message.createdAt))}</div>
        <p>${esc(message.text || "")}</p>
      </div>
    `;
  }).join("");
  ui.messageThread.scrollTop = ui.messageThread.scrollHeight;
}

function showSignedOutState() {
  currentProfile = null;
  currentThreads = [];
  currentPendingPosts = [];
  activeConversationId = null;
  activeConversationMemberId = null;
  selectedImageFile = null;
  ui.logoutBtn?.classList.add("hidden");
  ui.profilePanel?.classList.add("hidden");
  ui.composerPanel?.classList.add("hidden");
  ui.adminPanel?.classList.add("hidden");
  ui.messageForm?.classList.add("hidden");
  ui.authPanel?.classList.remove("hidden");
  ui.chatWidget?.classList.add("hidden");
  renderProfileSpotlight();
  renderConversations([]);
  renderThread([]);
  if (ui.pendingPostsList) ui.pendingPostsList.innerHTML = `<div class="empty-state">No pending posts.</div>`;
  if (ui.pendingCountBadge) ui.pendingCountBadge.textContent = "0 pending";
  clearImageSelection();
  setStatus("Not signed in.");
}

function showSignedInState(user, profile) {
  ui.logoutBtn?.classList.remove("hidden");
  ui.profilePanel?.classList.remove("hidden");
  ui.composerPanel?.classList.remove("hidden");
  ui.adminPanel?.classList.toggle("hidden", !isAdminUser(user));
  ui.messageForm?.classList.add("hidden");
  ui.authPanel?.classList.add("hidden");
  ui.chatWidget?.classList.remove("hidden");
  renderProfileSpotlight(profile, user);
  if (ui.profileName) ui.profileName.value = profile.displayName || "";
  if (ui.profileOrganisation) ui.profileOrganisation.value = profile.role || "";
  if (ui.profileBio) ui.profileBio.value = profile.bio || "";
  if (ui.profileSocial) ui.profileSocial.value = profile.socialLink || "";
  setStatus(`Signed in as ${user.email}.`, "success");
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

function stopRealtime() {
  membersUnsub?.();
  threadsUnsub?.();
  pendingUnsub?.();
  activeThreadUnsub?.();
  membersUnsub = threadsUnsub = pendingUnsub = activeThreadUnsub = null;
}

function startMembersRealtime() {
  membersUnsub = onSnapshot(
    query(collection(db, "users"), orderBy("displayName"), limit(100)),
    (snapshot) => {
      const members = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      renderMembers(currentUser ? members.filter((item) => item.id !== currentUser.uid) : members);
    },
    (error) => setStatus(humanizeError(error), "error")
  );
}

function startThreadsRealtime() {
  if (!currentUser) return;
  threadsUnsub = onSnapshot(
    query(collection(db, "users", currentUser.uid, "threads"), orderBy("updatedAt", "desc"), limit(40)),
    (snapshot) => {
      const threads = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
      renderConversations(threads);
      if (!activeConversationId && threads[0]) {
        openConversation(threads[0].otherUid, threads[0].conversationId);
      }
    },
    (error) => setStatus(humanizeError(error), "error")
  );
}

function renderPendingPosts(items = currentPendingPosts) {
  currentPendingPosts = Array.isArray(items) ? items : [];
  if (!ui.pendingPostsList) return;
  if (!currentPendingPosts.length) {
    ui.pendingPostsList.innerHTML = `<div class="empty-state">No pending posts.</div>`;
    if (ui.pendingCountBadge) ui.pendingCountBadge.textContent = "0 pending";
    return;
  }
  if (ui.pendingCountBadge) ui.pendingCountBadge.textContent = `${currentPendingPosts.length} pending`;
  ui.pendingPostsList.innerHTML = currentPendingPosts.map((post) => `
    <article class="moderation-card">
      <div class="moderation-card-head">
        <div>
          <strong>${esc(post.title || post.authorName || "Untitled post")}</strong>
          <p>${esc(post.authorName || "Member")} · ${esc(post.authorRole || "Member")} · ${esc(formatDate(post.createdAt))}</p>
        </div>
        <span class="feed-chip">${esc(post.type || "update")}</span>
      </div>
      ${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ""}
      <p class="moderation-body">${esc(post.content || "")}</p>
      ${post.imageUrl ? `<img class="moderation-image" src="${esc(post.imageUrl)}" alt="${esc(post.imageAlt || post.title || "Post image")}" />` : ""}
      <div class="moderation-actions">
        <button type="button" class="button button-small" data-approve-id="${esc(post.id)}">Approve</button>
        <button type="button" class="button button-secondary button-small" data-reject-id="${esc(post.id)}">Reject</button>
        <button type="button" class="button button-ghost button-small" data-delete-id="${esc(post.id)}">Delete</button>
      </div>
    </article>
  `).join("");

  ui.pendingPostsList.querySelectorAll("[data-approve-id]").forEach((button) => {
    button.addEventListener("click", () => moderatePost(button.dataset.approveId || "", "approved"));
  });
  ui.pendingPostsList.querySelectorAll("[data-reject-id]").forEach((button) => {
    button.addEventListener("click", () => moderatePost(button.dataset.rejectId || "", "rejected"));
  });
  ui.pendingPostsList.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deletePendingPost(button.dataset.deleteId || ""));
  });
}

function startPendingRealtime() {
  if (!isAdminUser(currentUser)) {
    renderPendingPosts([]);
    return;
  }
  pendingUnsub = onSnapshot(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(80)),
    (snapshot) => {
      const pending = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((item) => item.status === "pending");
      renderPendingPosts(pending);
    },
    (error) => setStatus(humanizeError(error), "error")
  );
}

function previewImage(file) {
  if (!file || !ui.postImagePreviewWrap || !ui.postImagePreview) return;
  const reader = new FileReader();
  reader.onload = () => {
    ui.postImagePreview.src = reader.result;
    ui.postImagePreviewWrap.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function clearImageSelection() {
  selectedImageFile = null;
  if (ui.postImage) ui.postImage.value = "";
  if (ui.postImagePreview) ui.postImagePreview.removeAttribute("src");
  ui.postImagePreviewWrap?.classList.add("hidden");
}

async function uploadPostImage(file, userId) {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeName = `${Timestamp.now().toMillis()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const path = `post-images/${userId}/${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId
    }
  });
  const url = await getDownloadURL(storageRef);
  return { imagePath: path, imageUrl: url, imageAlt: ui.postTitle?.value.trim() || ui.postTag?.value.trim() || "Project post image" };
}

async function ensureConversation(memberId) {
  if (!currentUser || !memberId) return null;
  const meId = currentUser.uid;
  const conversationId = [meId, memberId].sort().join("__");
  const meProfile = currentProfile || await ensureUserProfile(currentUser);
  const otherSnap = await getDoc(doc(db, "users", memberId));
  if (!otherSnap.exists()) throw new Error("Recipient profile not found.");
  const other = otherSnap.data();
  const meName = meProfile.displayName || currentUser.displayName || currentUser.email || "Member";
  const otherName = other.displayName || other.email || "Member";
  const now = Timestamp.now();
  await setDoc(doc(db, "conversations", conversationId), {
    participantIds: [meId, memberId].sort(),
    participantNames: {
      [meId]: meName,
      [memberId]: otherName
    },
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    lastMessageText: "Conversation started.",
    lastSenderId: meId
  }, { merge: true });
  await Promise.all([
    setDoc(doc(db, "users", meId, "threads", conversationId), {
      ownerId: meId,
      conversationId,
      otherUid: memberId,
      otherName,
      lastMessageText: "Conversation started.",
      lastSenderId: meId,
      updatedAt: now
    }, { merge: true }),
    setDoc(doc(db, "users", memberId, "threads", conversationId), {
      ownerId: memberId,
      conversationId,
      otherUid: meId,
      otherName: meName,
      lastMessageText: "Conversation started.",
      lastSenderId: meId,
      updatedAt: now
    }, { merge: true })
  ]);
  return { conversationId, memberName: otherName };
}

async function openConversation(memberId, existingConversationId = "") {
  if (!currentUser || !memberId) return;
  try {
    const payload = existingConversationId ? { conversationId: existingConversationId } : await ensureConversation(memberId);
    if (!payload?.conversationId) return;
    activeConversationId = payload.conversationId;
    activeConversationMemberId = memberId;
    if (ui.recipientUid) ui.recipientUid.value = memberId;
    ui.messageForm?.classList.remove("hidden");
    const member = currentMembers.find((item) => item.id === memberId);
    const memberName = member?.displayName || member?.email || payload.memberName || "Member";
    if (ui.activeConversationHeader) {
      ui.activeConversationHeader.innerHTML = `<strong>${esc(memberName)}</strong><p>Private conversation</p>`;
    }
    activeThreadUnsub?.();
    activeThreadUnsub = onSnapshot(
      query(collection(db, "conversations", activeConversationId, "messages"), orderBy("createdAt", "asc"), limit(200)),
      (snapshot) => renderThread(snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))),
      (error) => setStatus(humanizeError(error), "error")
    );
    renderConversations(currentThreads);
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
}

function openChat() {
  ui.chatWidgetPanel?.classList.remove("hidden");
  ui.chatWidgetToggle?.setAttribute("aria-expanded", "true");
}

function closeChat() {
  ui.chatWidgetPanel?.classList.add("hidden");
  ui.chatWidgetToggle?.setAttribute("aria-expanded", "false");
}

async function moderatePost(postId, status) {
  if (!postId || !isAdminUser(currentUser)) return;
  try {
    const payload = {
      status,
      moderatedBy: currentUser.uid,
      moderatedByEmail: currentUser.email || "",
      moderatedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      publishedAt: status === "approved" ? Timestamp.now() : null
    };
    await updateDoc(doc(db, "posts", postId), payload);
    setStatus(status === "approved" ? "Post approved." : "Post rejected.", "success");
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
}

async function deletePendingPost(postId) {
  if (!postId || !isAdminUser(currentUser)) return;
  try {
    await deleteDoc(doc(db, "posts", postId));
    setStatus("Post deleted.", "success");
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
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
  ui.chatWidgetToggle?.addEventListener("click", () => {
    if (ui.chatWidgetPanel?.classList.contains("hidden")) openChat();
    else closeChat();
  });
  ui.chatWidgetClose?.addEventListener("click", closeChat);
  ui.chatOpenFromPanel?.addEventListener("click", openChat);
  ui.clearPostImageBtn?.addEventListener("click", clearImageSelection);
  ui.postImage?.addEventListener("change", () => {
    const file = ui.postImage?.files?.[0] || null;
    if (!file) {
      clearImageSelection();
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      clearImageSelection();
      setStatus("Only JPG, PNG, GIF and WEBP images are allowed.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      clearImageSelection();
      setStatus("Image must be smaller than 5 MB.", "error");
      return;
    }
    selectedImageFile = file;
    previewImage(file);
  });
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
      const snapshot = await getDoc(doc(db, "users", currentUser.uid));
      const payload = {
        displayName,
        email: currentUser.email || snapshot.data()?.email || "",
        role,
        bio,
        socialLink,
        createdAt: snapshot.exists() ? (snapshot.data().createdAt || Timestamp.now()) : Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(doc(db, "users", currentUser.uid), payload, { merge: true });
      currentProfile = payload;
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
    const title = ui.postTitle?.value.trim() || "";
    if (!content) return setStatus("Write a post before submitting.", "error");
    try {
      const profile = currentProfile || await ensureUserProfile(currentUser);
      const now = Timestamp.now();
      let imageData = { imageUrl: "", imagePath: "", imageAlt: "" };
      if (selectedImageFile) {
        imageData = await uploadPostImage(selectedImageFile, currentUser.uid);
      }
      const admin = isAdminUser(currentUser);
      await addDoc(collection(db, "posts"), {
        authorId: currentUser.uid,
        authorName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        authorRole: profile.role || "Member",
        socialLink: profile.socialLink || "",
        type: ui.postType?.value || "update",
        tag: ui.postTag?.value.trim() || "",
        title,
        content,
        status: admin ? "approved" : "pending",
        createdAt: now,
        updatedAt: now,
        publishedAt: admin ? now : null,
        moderatedAt: admin ? now : null,
        moderatedBy: admin ? currentUser.uid : "",
        moderatedByEmail: admin ? (currentUser.email || "") : "",
        ...imageData
      });
      ui.postForm.reset();
      clearImageSelection();
      setStatus(admin ? "Post published." : "Post submitted for review.", "success");
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
      const senderName = profile.displayName || currentUser.displayName || currentUser.email || "Member";
      const otherProfile = currentMembers.find((item) => item.id === recipientUid) || (await getDoc(doc(db, "users", recipientUid))).data();
      const otherName = otherProfile?.displayName || otherProfile?.email || payload.memberName || "Member";
      const now = Timestamp.now();
      await addDoc(collection(db, "conversations", conversationId, "messages"), {
        fromId: currentUser.uid,
        fromName: senderName,
        toId: recipientUid,
        text,
        createdAt: now
      });
      await Promise.all([
        updateDoc(doc(db, "conversations", conversationId), {
          lastMessageText: text,
          lastMessageAt: now,
          updatedAt: now,
          lastSenderId: currentUser.uid
        }),
        setDoc(doc(db, "users", currentUser.uid, "threads", conversationId), {
          ownerId: currentUser.uid,
          conversationId,
          otherUid: recipientUid,
          otherName,
          lastMessageText: text,
          lastSenderId: currentUser.uid,
          updatedAt: now
        }, { merge: true }),
        setDoc(doc(db, "users", recipientUid, "threads", conversationId), {
          ownerId: recipientUid,
          conversationId,
          otherUid: currentUser.uid,
          otherName: senderName,
          lastMessageText: text,
          lastSenderId: currentUser.uid,
          updatedAt: now
        }, { merge: true })
      ]);
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
    stopRealtime();
    startMembersRealtime();

    if (!user) {
      showSignedOutState();
      return;
    }

    try {
      const profile = await ensureUserProfile(user);
      showSignedInState(user, profile);
      startThreadsRealtime();
      startPendingRealtime();
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
    storage = getStorage(app);
    handleAuthState();
  } catch (error) {
    showSetupNotice(humanizeError(error));
    setStatus(humanizeError(error), "error");
  }
}

init();
