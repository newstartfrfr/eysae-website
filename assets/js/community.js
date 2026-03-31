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

const $ = (id) => document.getElementById(id);

const setupNotice = $("setupNotice");
const logoutBtn = $("logoutBtn");
const authStatus = $("authStatus");

const signInForm = $("signInForm");
const signUpForm = $("signUpForm");
const profileForm = $("profileForm");
const postForm = $("postForm");
const messageForm = $("messageForm");

const feedList = $("feedList") || $("postsList");
const membersList = $("membersGrid") || $("membersList");
const inboxList = $("inboxList") || $("messagesList");
const recipientSelect = $("recipientUid");
const refreshFeedBtn = $("refreshFeedBtn");

const profileNameInput = $("profileName");
const profileOrganisationInput = $("profileOrganisation");
const profileBioInput = $("profileBio");
const profileSocialInput = $("profileSocial");

const postTypeInput = $("postType");
const postTagInput = $("postTag");
const postMessageInput = $("postMessage");

const signInEmailInput = $("signInEmail");
const signInPasswordInput = $("signInPassword");

const signUpNameInput = $("signUpName");
const signUpEmailInput = $("signUpEmail");
const signUpPasswordInput = $("signUpPassword");

const directMessageTextInput = $("directMessageText");

let auth = null;
let db = null;
let currentUser = null;

let unsubscribeFeed = null;
let unsubscribeInbox = null;
let unsubscribeMembers = null;

function setStatus(message) {
  if (authStatus) authStatus.textContent = message;
}

function showSetupNotice(message) {
  if (setupNotice) {
    setupNotice.classList.add("visible");
    setupNotice.textContent = message;
  }
  setStatus(message);
}

function hideSetupNotice() {
  if (setupNotice) {
    setupNotice.classList.remove("visible");
  }
}

if (!firebaseIsConfigured(firebaseConfig)) {
  showSetupNotice("Firebase configuration is missing or incomplete.");
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    hideSetupNotice();
    initCommunity();
  } catch (error) {
    showSetupNotice(`Firebase init failed: ${humanizeError(error)}`);
  }
}

function initCommunity() {
  bindForms();
  bindButtons();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      stopRealtimeListeners();
      showSignedOutState();
      return;
    }

    try {
      await ensureUserProfile(user);
      await fillProfileForm(user.uid);
      showSignedInState(user);
      startRealtimeListeners(user.uid);
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });
}

function bindForms() {
  signInForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = signInEmailInput?.value.trim() || "";
    const password = signInPasswordInput?.value || "";

    if (!email || !password) {
      setStatus("Enter your email and password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      signInForm.reset();
      setStatus("Signed in successfully.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });

  signUpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = signUpNameInput?.value.trim() || "";
    const email = signUpEmailInput?.value.trim() || "";
    const password = signUpPasswordInput?.value || "";

    if (displayName.length < 2) {
      setStatus("Display name must be at least 2 characters.");
      return;
    }

    if (!email || !password) {
      setStatus("Enter email and password.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, { displayName });

      await setDoc(doc(db, "users", credential.user.uid), {
        displayName,
        email: credential.user.email || email,
        role: "Member",
        bio: "",
        socialLink: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      signUpForm.reset();
      setStatus("Account created successfully.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      setStatus("You need to sign in first.");
      return;
    }

    const displayName = profileNameInput?.value.trim() || "";
    const role = profileOrganisationInput?.value.trim() || "";
    const bio = profileBioInput?.value.trim() || "";
    const socialLink = profileSocialInput?.value.trim() || "";

    if (displayName.length < 2) {
      setStatus("Display name must be at least 2 characters.");
      return;
    }

    try {
      await updateProfile(currentUser, { displayName });

      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName,
          email: currentUser.email || "",
          role,
          bio,
          socialLink,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const existing = snap.data();

        await updateDoc(userRef, {
          displayName,
          email: existing.email || currentUser.email || "",
          role,
          bio,
          socialLink,
          updatedAt: serverTimestamp()
        });
      }

      setStatus("Profile updated.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });

  postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      setStatus("You need to sign in first.");
      return;
    }

    const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};

    const typeRaw = postTypeInput?.value || "update";
    const type = typeRaw === "project-update" ? "update" : typeRaw;

    const tag = postTagInput?.value.trim() || "";
    const content = postMessageInput?.value.trim() || "";

    if (!content) {
      setStatus("Write a post before publishing.");
      return;
    }

    try {
      await addDoc(collection(db, "posts"), {
        authorId: currentUser.uid,
        authorName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        authorRole: profile.role || "Member",
        socialLink: profile.socialLink || "",
        type,
        tag,
        content,
        createdAt: serverTimestamp()
      });

      postForm.reset();
      setStatus("Post published.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      setStatus("You need to sign in first.");
      return;
    }

    const toId = recipientSelect?.value || "";
    const text = directMessageTextInput?.value.trim() || "";

    if (!toId) {
      setStatus("Select a member first.");
      return;
    }

    if (!text) {
      setStatus("Write a message first.");
      return;
    }

    try {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};

      await addDoc(collection(db, "users", toId, "messages"), {
        fromId: currentUser.uid,
        fromName: profile.displayName || currentUser.displayName || currentUser.email || "Member",
        text,
        toId,
        createdAt: serverTimestamp()
      });

      messageForm.reset();
      setStatus("Message sent.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });
}

function bindButtons() {
  logoutBtn?.addEventListener("click", async () => {
    if (!auth || !currentUser) return;

    try {
      await signOut(auth);
      setStatus("Signed out.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });

  refreshFeedBtn?.addEventListener("click", async () => {
    try {
      await renderMembers();
      await renderFeed();
      setStatus("Community refreshed.");
    } catch (error) {
      setStatus(humanizeError(error));
    }
  });
}

async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || user.email?.split("@")[0] || "Member",
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

  if (!existing.displayName && user.displayName) {
    await updateDoc(userRef, {
      displayName: user.displayName,
      updatedAt: serverTimestamp()
    });
  }
}

async function fillProfileForm(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return;

  const profile = snapshot.data();

  if (profileNameInput) profileNameInput.value = profile.displayName || "";
  if (profileOrganisationInput) profileOrganisationInput.value = profile.role || "";
  if (profileBioInput) profileBioInput.value = profile.bio || "";
  if (profileSocialInput) profileSocialInput.value = profile.socialLink || "";
}

function startRealtimeListeners(uid) {
  stopRealtimeListeners();

  unsubscribeFeed = onSnapshot(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)),
    (snapshot) => {
      const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderFeed(posts);
    }
  );

  unsubscribeMembers = onSnapshot(
    query(collection(db, "users"), orderBy("displayName"), limit(100)),
    (snapshot) => {
      const members = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.id !== uid);

      renderMembers(members);
    }
  );

  unsubscribeInbox = onSnapshot(
    query(collection(db, "users", uid, "messages"), orderBy("createdAt", "desc"), limit(50)),
    (snapshot) => {
      const messages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderInbox(messages);
    }
  );
}

function stopRealtimeListeners() {
  if (unsubscribeFeed) unsubscribeFeed();
  if (unsubscribeMembers) unsubscribeMembers();
  if (unsubscribeInbox) unsubscribeInbox();

  unsubscribeFeed = null;
  unsubscribeMembers = null;
  unsubscribeInbox = null;
}

async function renderFeed(posts = null) {
  if (!feedList) return;

  if (!Array.isArray(posts)) {
    const snapshot = await getDocs(
      query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40))
    );
    posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  if (!posts.length) {
    feedList.innerHTML = `<div class="empty-state">No posts yet.</div>`;
    return;
  }

  feedList.innerHTML = posts
    .map((post) => {
      const canDelete = currentUser && currentUser.uid === post.authorId;
      const social = post.socialLink
        ? `<a href="${escapeAttribute(post.socialLink)}" target="_blank" rel="noreferrer">social</a>`
        : "";

      return `
        <article class="post-card">
          <div class="feed-card-top">
            <div>
              <div class="feed-chip">${escapeHtml(post.type || "update")}</div>
              <h3>${escapeHtml(post.authorName || "Member")}</h3>
              <p class="feed-meta">${escapeHtml(post.authorRole || "Member")} · ${formatDate(post.createdAt)} ${social ? `· ${social}` : ""}</p>
            </div>
            ${canDelete ? `<button type="button" class="button button-secondary button-small btn-delete-post" data-post-id="${post.id}">Delete</button>` : ""}
          </div>
          ${post.tag ? `<p class="feed-tag">#${escapeHtml(post.tag)}</p>` : ""}
          <p class="feed-content">${escapeHtml(post.content || "")}</p>
        </article>
      `;
    })
    .join("");

  feedList.querySelectorAll(".btn-delete-post").forEach((button) => {
    button.addEventListener("click", async () => {
      const postId = button.dataset.postId;
      if (!postId) return;

      try {
        await deleteDoc(doc(db, "posts", postId));
        setStatus("Post deleted.");
      } catch (error) {
        setStatus(humanizeError(error));
      }
    });
  });
}

async function renderMembers(members = null) {
  if (!membersList || !recipientSelect) return;

  if (!Array.isArray(members)) {
    const snapshot = await getDocs(
      query(collection(db, "users"), orderBy("displayName"), limit(100))
    );
    members = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => !currentUser || item.id !== currentUser.uid);
  }

  if (!members.length) {
    membersList.innerHTML = `<div class="empty-state">No members yet.</div>`;
    recipientSelect.innerHTML = `<option value="">No member available</option>`;
    return;
  }

  membersList.innerHTML = members
    .map((member) => {
      const social = member.socialLink
        ? `<a href="${escapeAttribute(member.socialLink)}" target="_blank" rel="noreferrer">social</a>`
        : "";

      return `
        <article class="member-card">
          <h3>${escapeHtml(member.displayName || "Member")}</h3>
          <p>${escapeHtml(member.role || "Member")}</p>
          ${member.bio ? `<p class="member-bio">${escapeHtml(member.bio)}</p>` : ""}
          <div class="member-actions">
            ${social}
            <button type="button" class="button button-secondary button-small member-message-btn" data-member-id="${member.id}">
              Message
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  recipientSelect.innerHTML =
    `<option value="">Select a member</option>` +
    members
      .map((member) => {
        return `<option value="${member.id}">${escapeHtml(member.displayName || member.email || "Member")}</option>`;
      })
      .join("");

  membersList.querySelectorAll(".member-message-btn").forEach((button) => {
    button.addEventListener("click", () => {
      recipientSelect.value = button.dataset.memberId || "";
      directMessageTextInput?.focus();
    });
  });
}

function renderInbox(messages = []) {
  if (!inboxList) return;

  if (!messages.length) {
    inboxList.innerHTML = `<div class="empty-state">No messages yet.</div>`;
    return;
  }

  inboxList.innerHTML = messages
    .map((message) => {
      return `
        <article class="message-card">
          <div class="inbox-card-top">
            <strong>${escapeHtml(message.fromName || "Member")}</strong>
            <span>${formatDate(message.createdAt)}</span>
          </div>
          <p>${escapeHtml(message.text || "")}</p>
        </article>
      `;
    })
    .join("");
}

function showSignedOutState() {
  if (logoutBtn) logoutBtn.disabled = true;
  setStatus("Not signed in.");

  if (membersList) {
    membersList.innerHTML = `<div class="empty-state">Sign in to see members.</div>`;
  }

  if (inboxList) {
    inboxList.innerHTML = `<div class="empty-state">Sign in to read messages.</div>`;
  }

  if (feedList) {
    feedList.innerHTML = `<div class="empty-state">Sign in or create an account to start posting.</div>`;
  }
}

function showSignedInState(user) {
  if (logoutBtn) logoutBtn.disabled = false;
  setStatus(`Signed in as ${user.email}.`);
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
  if (!error) return "Something went wrong.";

  if (error.code) {
    switch (error.code) {
      case "auth/invalid-credential":
        return "Wrong email or password.";
      case "auth/email-already-in-use":
        return "This email is already in use.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/weak-password":
        return "Password is too weak.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is not enabled in Firebase.";
      case "permission-denied":
        return "Firestore rules are blocking this action.";
      default:
        return error.message || "Something went wrong.";
    }
  }

  return error.message || "Something went wrong.";
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
