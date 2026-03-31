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
  messageForm: $("messageForm"),
  signInForm: $("signInForm"),
  signUpForm: $("signUpForm"),
  profileForm: $("profileForm"),
  postForm: $("postForm"),
  feedList: $("feedList"),
  membersGrid: $("membersGrid"),
  inboxList: $("inboxList"),
  refreshFeedBtn: $("refreshFeedBtn"),
  recipientUid: $("recipientUid"),
  directMessageText: $("directMessageText"),
  signInEmail: $("signInEmail"),
  signInPassword: $("signInPassword"),
  signUpName: $("signUpName"),
  signUpEmail: $("signUpEmail"),
  signUpPassword: $("signUpPassword"),
  profileName: $("profileName"),
  profileOrganisation: $("profileOrganisation"),
  profileBio: $("profileBio"),
  profileSocial: $("profileSocial"),
  postType: $("postType"),
  postTag: $("postTag"),
  postMessage: $("postMessage")
};

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let currentProfile = null;
let currentDictionary = null;
let currentFeed = [];
let currentMembers = [];
let currentMessages = [];
let unsubFeed = null;
let unsubMembers = null;
let unsubInbox = null;

function t(key, fallback) {
  const value = key
    .split(".")
    .reduce((acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined), currentDictionary);
  return typeof value === "string" ? value : fallback;
}

function initials(value) {
  const clean = (value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "EY";

  const parts = clean.split(" ").slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function isAdminEmail(email) {
  return ADMIN_EMAILS.has((email || "").toLowerCase());
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
  ui.setupNotice.classList.add("visible");
  ui.setupNotice.innerHTML = `<strong>${escapeHtml(t("community.setupTitle", "Firebase setup"))}</strong><p>${escapeHtml(message)}</p>`;
}

function hideSetupNotice() {
  ui.setupNotice?.classList.remove("visible");
}

function nowTimestamp() {
  return Timestamp.now();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function formatDate(value) {
  if (!value) return "—";
  const raw = value.toDate ? value.toDate() : value;
  if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return "—";
  return new Intl.DateTimeFormat(document.documentElement.lang || "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(raw);
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
    button.addEventListener("click", () => {
      switchAuthMode(button.dataset.authMode);
    });
  });
}

function renderProfileSpotlight(profile = null, user = null) {
  if (!ui.profileSpotlight) return;

  if (!profile || !user) {
    ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
    ui.profileSpotlight.innerHTML = `
      <div class="profile-avatar">EY</div>
      <div>
        <strong>EYSAE Member</strong>
        <p>Sign in to activate your public profile card and post updates.</p>
      </div>
    `;
    return;
  }

  const name = profile.displayName || user.displayName || user.email || "Member";
  const role = profile.role || "Member";
  const bio = profile.bio || "Your public profile appears here after you save it.";
  const social = profile.socialLink
    ? `<a href="${escapeAttribute(profile.socialLink)}" target="_blank" rel="noreferrer">social</a>`
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
    ui.feedList.innerHTML = `<div class="empty-state">${escapeHtml(t("community.feedEmpty", "No posts yet."))}</div>`;
    return;
  }

  ui.feedList.innerHTML = currentFeed.map((post) => {
    const canDelete = currentUser && (post.authorId === currentUser.uid || isAdminEmail(currentUser.email));
    const author = post.authorName || "Member";
    const authorRole = post.authorRole || "Member";
    const social = post.socialLink
      ? `<a href="${escapeAttribute(post.socialLink)}" target="_blank" rel="noreferrer">social</a>`
      : "";

    return `
      <article class="feed-card">
        <div class="feed-card-top">
          <div class="feed-author-row">
            <div class="feed-avatar">${escapeHtml(initials(author))}</div>
            <div>
              <div class="feed-chip">${escapeHtml(post.type || "update")}</div>
              <strong class="feed-author">${escapeHtml(author)}</strong>
              <div class="feed-meta">${escapeHtml(authorRole)} · ${escapeHtml(formatDate(post.createdAt))}${social ? ` · ${social}` : ""}</div>
            </div>
          </div>
          ${canDelete ? `<button type="button" class="btn-delete-post" data-post-id="${escapeAttribute(post.id)}">Delete</button>` : ""}
        </div>
        ${post.tag ? `<p class="feed-tag">#${escapeHtml(post.tag)}</p>` : ""}
        <p class="feed-content">${escapeHtml(post.content || "")}</p>
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

function renderMembers(members = currentMembers) {
  currentMembers = Array.isArray(members) ? members : [];
  if (!ui.membersGrid || !ui.recipientUid) return;

  if (!currentUser) {
    ui.membersGrid.innerHTML = `<div class="empty-state">Sign in to see members.</div>`;
    ui.recipientUid.innerHTML = `<option value="">${escapeHtml(t("community.inboxRecipientPlaceholder", "Select a member"))}</option>`;
    return;
  }

  if (!currentMembers.length) {
    ui.membersGrid.innerHTML = `<div class="empty-state">${escapeHtml(t("community.membersEmpty", "No members yet."))}</div>`;
    ui.recipientUid.innerHTML = `<option value="">${escapeHtml(t("community.inboxRecipientPlaceholder", "Select a member"))}</option>`;
    return;
  }

  ui.membersGrid.innerHTML = currentMembers.map((member) => {
    const name = member.displayName || member.email || "Member";
    const role = member.role || "Member";
    const social = member.socialLink
      ? `<a href="${escapeAttribute(member.socialLink)}" target="_blank" rel="noreferrer">social</a>`
      : "";

    return `
      <article class="member-card">
        <div class="member-card-top">
          <div class="member-author-row">
            <div class="member-avatar">${escapeHtml(initials(name))}</div>
            <div>
              <strong class="member-name">${escapeHtml(name)}</strong>
              <div class="member-role-row">
                <span class="role-pill">${escapeHtml(role)}</span>
                ${member.email && isAdminEmail(member.email) ? `<span class="admin-badge">Admin</span>` : ""}
              </div>
            </div>
          </div>
          <button type="button" class="member-message-btn" data-member-id="${escapeAttribute(member.id)}">
            Message
          </button>
        </div>
        ${member.bio ? `<p class="member-bio">${escapeHtml(member.bio)}</p>` : ""}
        ${(social || member.email) ? `<div class="member-actions">${social}</div>` : ""}
      </article>
    `;
  }).join("");

  ui.recipientUid.innerHTML = `
    <option value="">${escapeHtml(t("community.inboxRecipientPlaceholder", "Select a member"))}</option>
    ${currentMembers.map((member) => `<option value="${escapeAttribute(member.id)}">${escapeHtml(member.displayName || member.email || "Member")}</option>`).join("")}
  `;

  ui.membersGrid.querySelectorAll(".member-message-btn").forEach((button) => {
    button.addEventListener("click", () => {
      ui.recipientUid.value = button.dataset.memberId || "";
      ui.messageForm?.classList.remove("hidden");
      ui.directMessageText?.focus();
    });
  });
}

function renderInbox(messages = currentMessages) {
  currentMessages = Array.isArray(messages) ? messages : [];
  if (!ui.inboxList) return;

  if (!currentUser) {
    ui.inboxList.innerHTML = `<div class="empty-state">Sign in to read messages.</div>`;
    return;
  }

  if (!currentMessages.length) {
    ui.inboxList.innerHTML = `<div class="empty-state">${escapeHtml(t("community.inboxEmpty", "No messages yet."))}</div>`;
    return;
  }

  ui.inboxList.innerHTML = currentMessages.map((message) => `
    <article class="inbox-card">
      <div class="inbox-card-top">
        <strong>${escapeHtml(message.fromName || "Member")}</strong>
        <span class="inbox-date">${escapeHtml(formatDate(message.createdAt))}</span>
      </div>
      <p>${escapeHtml(message.text || "")}</p>
    </article>
  `).join("");
}

async function loadPublicFeedOnce() {
  if (!db) return;

  try {
    const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20)));
    renderFeed(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
}

function stopRealtimeListeners() {
  if (unsubFeed) unsubFeed();
  if (unsubMembers) unsubMembers();
  if (unsubInbox) unsubInbox();
  unsubFeed = null;
  unsubMembers = null;
  unsubInbox = null;
}

function startSignedInListeners(uid) {
  stopRealtimeListeners();

  unsubFeed = onSnapshot(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)),
    (snapshot) => {
      renderFeed(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    (error) => setStatus(humanizeError(error), "error")
  );

  unsubMembers = onSnapshot(
    query(collection(db, "users"), orderBy("displayName"), limit(100)),
    (snapshot) => {
      const members = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.id !== uid);
      renderMembers(members);
    },
    (error) => setStatus(humanizeError(error), "error")
  );

  unsubInbox = onSnapshot(
    query(collection(db, "users", uid, "messages"), orderBy("createdAt", "desc"), limit(50)),
    (snapshot) => {
      renderInbox(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
    (error) => setStatus(humanizeError(error), "error")
  );
}

async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const baseProfile = {
      displayName: user.displayName || user.email?.split("@")[0] || "Member",
      email: user.email || "",
      role: "Member",
      bio: "",
      socialLink: "",
      createdAt: nowTimestamp(),
      updatedAt: nowTimestamp()
    };
    await setDoc(userRef, baseProfile);
    currentProfile = baseProfile;
    return baseProfile;
  }

  const profile = snapshot.data();
  currentProfile = profile;
  return profile;
}

function fillProfileForm(profile) {
  if (!profile) return;
  if (ui.profileName) ui.profileName.value = profile.displayName || "";
  if (ui.profileOrganisation) ui.profileOrganisation.value = profile.role || "";
  if (ui.profileBio) ui.profileBio.value = profile.bio || "";
  if (ui.profileSocial) ui.profileSocial.value = profile.socialLink || "";
}

function showSignedOutState() {
  currentProfile = null;
  ui.logoutBtn?.classList.add("hidden");
  ui.profilePanel?.classList.add("hidden");
  ui.composerPanel?.classList.add("hidden");
  ui.messageForm?.classList.add("hidden");
  ui.authPanel?.classList.remove("hidden");
  renderProfileSpotlight();
  renderMembers([]);
  renderInbox([]);
  setStatus(t("community.authSignedOut", "Not signed in."));
  loadPublicFeedOnce();
}

function showSignedInState(user, profile) {
  ui.logoutBtn?.classList.remove("hidden");
  ui.profilePanel?.classList.remove("hidden");
  ui.composerPanel?.classList.remove("hidden");
  ui.messageForm?.classList.remove("hidden");
  ui.authPanel?.classList.add("hidden");
  renderProfileSpotlight(profile, user);
  fillProfileForm(profile);
  setStatus(`Signed in as ${user.email}.`, "success");
}

async function refreshManual() {
  if (!db) return;

  try {
    await loadPublicFeedOnce();

    if (currentUser) {
      const profile = await ensureUserProfile(currentUser);
      showSignedInState(currentUser, profile);

      const memberSnap = await getDocs(query(collection(db, "users"), orderBy("displayName"), limit(100)));
      renderMembers(
        memberSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.id !== currentUser.uid)
      );

      const inboxSnap = await getDocs(query(collection(db, "users", currentUser.uid, "messages"), orderBy("createdAt", "desc"), limit(50)));
      renderInbox(inboxSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    }

    setStatus("Community refreshed.", "success");
  } catch (error) {
    setStatus(humanizeError(error), "error");
  }
}

function bindButtons() {
  ui.logoutBtn?.addEventListener("click", async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setStatus("Signed out.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.refreshFeedBtn?.addEventListener("click", refreshManual);
}

function bindForms() {
  ui.signInForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!auth) return;

    const email = ui.signInEmail?.value.trim() || "";
    const password = ui.signInPassword?.value || "";

    if (!email || !password) {
      setStatus("Enter your email and password.", "error");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      ui.signInForm.reset();
      setStatus("Signed in successfully.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.signUpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!auth || !db) return;

    const displayName = ui.signUpName?.value.trim() || "";
    const email = ui.signUpEmail?.value.trim() || "";
    const password = ui.signUpPassword?.value || "";

    if (displayName.length < 2) {
      setStatus("Display name must be at least 2 characters.", "error");
      return;
    }

    if (!email || password.length < 6) {
      setStatus("Enter a valid email and a password with at least 6 characters.", "error");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });

      const payload = {
        displayName,
        email,
        role: "Member",
        bio: "",
        socialLink: "",
        createdAt: nowTimestamp(),
        updatedAt: nowTimestamp()
      };

      await setDoc(doc(db, "users", credential.user.uid), payload);
      currentProfile = payload;

      ui.signUpForm.reset();
      switchAuthMode("signin");
      setStatus("Account created successfully.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser || !db) {
      setStatus("You need to sign in first.", "error");
      return;
    }

    const displayName = ui.profileName?.value.trim() || "";
    const role = ui.profileOrganisation?.value.trim() || "";
    const bio = ui.profileBio?.value.trim() || "";
    const socialLink = ui.profileSocial?.value.trim() || "";

    if (displayName.length < 2) {
      setStatus("Display name must be at least 2 characters.", "error");
      return;
    }

    if (socialLink && !/^https?:\/\//i.test(socialLink)) {
      setStatus("Social link must start with http:// or https://", "error");
      return;
    }

    try {
      await updateProfile(currentUser, { displayName });

      const userRef = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(userRef);
      const existing = snapshot.exists() ? snapshot.data() : null;

      const payload = {
        displayName,
        email: currentUser.email || existing?.email || "",
        role,
        bio,
        socialLink,
        createdAt: existing?.createdAt || nowTimestamp(),
        updatedAt: nowTimestamp()
      };

      await setDoc(userRef, payload);
      currentProfile = payload;
      renderProfileSpotlight(payload, currentUser);
      setStatus("Profile updated.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser || !db) {
      setStatus("You need to sign in first.", "error");
      return;
    }

    const type = ui.postType?.value || "update";
    const tag = ui.postTag?.value.trim() || "";
    const content = ui.postMessage?.value.trim() || "";

    if (!content) {
      setStatus("Write a post before publishing.", "error");
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", currentUser.uid));
      const profile = snapshot.exists() ? snapshot.data() : currentProfile || {};

      await addDoc(collection(db, "posts"), {
        authorId: currentUser.uid,
        authorName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        authorRole: profile.role || "Member",
        socialLink: profile.socialLink || "",
        type,
        tag,
        content,
        createdAt: nowTimestamp()
      });

      ui.postForm.reset();
      setStatus("Post published.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  ui.messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser || !db) {
      setStatus("You need to sign in first.", "error");
      return;
    }

    const toId = ui.recipientUid?.value || "";
    const text = ui.directMessageText?.value.trim() || "";

    if (!toId) {
      setStatus("Select a member first.", "error");
      return;
    }

    if (!text) {
      setStatus("Write a message first.", "error");
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", currentUser.uid));
      const profile = snapshot.exists() ? snapshot.data() : currentProfile || {};

      await addDoc(collection(db, "users", toId, "messages"), {
        fromId: currentUser.uid,
        fromName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        text,
        toId,
        createdAt: nowTimestamp()
      });

      ui.messageForm.reset();
      setStatus("Message sent.", "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });
}

function handleAuthState() {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      stopRealtimeListeners();
      showSignedOutState();
      return;
    }

    try {
      const profile = await ensureUserProfile(user);
      showSignedInState(user, profile);
      startSignedInListeners(user.uid);
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });
}

document.addEventListener("eysae:languagechange", (event) => {
  currentDictionary = event.detail?.dictionary || null;
  renderFeed();
  renderMembers();
  renderInbox();
  renderProfileSpotlight(currentProfile, currentUser);
});

function init() {
  bindAuthTabs();
  bindForms();
  bindButtons();
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
    hideSetupNotice();
    handleAuthState();
    loadPublicFeedOnce();
  } catch (error) {
    showSetupNotice(humanizeError(error));
    setStatus(humanizeError(error), "error");
  }
}

init();
