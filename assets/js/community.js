
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

const ADMIN_EMAILS = ["krizo19@gmail.com"];
const STORAGE_KEY = "eysae-language";

const runtimeI18n = {
  en: {
    signInToSeeMembers: "Sign in to see member profiles.",
    signInToReadMessages: "Sign in to read messages.",
    selectMember: "Select a member",
    noMemberAvailable: "No member available",
    feedEmpty: "No posts yet.",
    membersEmpty: "No members yet.",
    inboxEmpty: "No messages yet.",
    signInToPost: "Sign in or create an account to start posting.",
    addKeysFirst: "Add Firebase keys first.",
    signedInSuccess: "Signed in successfully.",
    accountCreated: "Account created successfully.",
    profileUpdated: "Profile updated.",
    postPublished: "Post published.",
    messageSent: "Message sent.",
    signedOut: "Signed out.",
    notSignedIn: "Not signed in.",
    signedInAs: "Signed in as",
    justNow: "just now",
    social: "Social",
    message: "Message",
    delete: "Delete",
    admin: "Admin access",
    member: "Member",
    noBio: "No profile bio yet.",
    profilePrompt: "Sign in to activate your public member card."
  },
  sl: {
    signInToSeeMembers: "Za ogled profilov se prijavi.",
    signInToReadMessages: "Za branje sporočil se prijavi.",
    selectMember: "Izberi člana",
    noMemberAvailable: "Ni razpoložljivega člana",
    feedEmpty: "Objav še ni.",
    membersEmpty: "Članov še ni.",
    inboxEmpty: "Sporočil še ni.",
    signInToPost: "Prijavi se ali ustvari račun za objavo.",
    addKeysFirst: "Najprej dodaj Firebase ključe.",
    signedInSuccess: "Prijava uspešna.",
    accountCreated: "Račun je ustvarjen.",
    profileUpdated: "Profil je posodobljen.",
    postPublished: "Objava je objavljena.",
    messageSent: "Sporočilo je poslano.",
    signedOut: "Odjava uspešna.",
    notSignedIn: "Nisi prijavljen.",
    signedInAs: "Prijavljen kot",
    justNow: "pravkar",
    social: "Povezava",
    message: "Sporočilo",
    delete: "Izbriši",
    admin: "Admin dostop",
    member: "Član",
    noBio: "Opis profila še ni dodan.",
    profilePrompt: "Prijavi se in aktiviraj svojo javno kartico člana."
  },
  gr: {
    signInToSeeMembers: "Συνδεθείτε για να δείτε τα προφίλ μελών.",
    signInToReadMessages: "Συνδεθείτε για να δείτε τα μηνύματα.",
    selectMember: "Επιλέξτε μέλος",
    noMemberAvailable: "Δεν υπάρχει διαθέσιμο μέλος",
    feedEmpty: "Δεν υπάρχουν ακόμη αναρτήσεις.",
    membersEmpty: "Δεν υπάρχουν ακόμη μέλη.",
    inboxEmpty: "Δεν υπάρχουν ακόμη μηνύματα.",
    signInToPost: "Συνδεθείτε ή δημιουργήστε λογαριασμό για να δημοσιεύσετε.",
    addKeysFirst: "Προσθέστε πρώτα τα κλειδιά Firebase.",
    signedInSuccess: "Η σύνδεση ολοκληρώθηκε.",
    accountCreated: "Ο λογαριασμός δημιουργήθηκε.",
    profileUpdated: "Το προφίλ ενημερώθηκε.",
    postPublished: "Η ανάρτηση δημοσιεύτηκε.",
    messageSent: "Το μήνυμα στάλθηκε.",
    signedOut: "Αποσυνδεθήκατε.",
    notSignedIn: "Δεν έχετε συνδεθεί.",
    signedInAs: "Συνδεδεμένος ως",
    justNow: "μόλις τώρα",
    social: "Σύνδεσμος",
    message: "Μήνυμα",
    delete: "Διαγραφή",
    admin: "Πρόσβαση διαχειριστή",
    member: "Μέλος",
    noBio: "Δεν υπάρχει ακόμη βιογραφικό προφίλ.",
    profilePrompt: "Συνδεθείτε για να ενεργοποιήσετε τη δημόσια κάρτα μέλους σας."
  },
  ar: {
    signInToSeeMembers: "سجّل الدخول لرؤية ملفات الأعضاء.",
    signInToReadMessages: "سجّل الدخول لقراءة الرسائل.",
    selectMember: "اختر عضواً",
    noMemberAvailable: "لا يوجد عضو متاح",
    feedEmpty: "لا توجد منشورات بعد.",
    membersEmpty: "لا يوجد أعضاء بعد.",
    inboxEmpty: "لا توجد رسائل بعد.",
    signInToPost: "سجّل الدخول أو أنشئ حساباً لبدء النشر.",
    addKeysFirst: "أضف مفاتيح Firebase أولاً.",
    signedInSuccess: "تم تسجيل الدخول بنجاح.",
    accountCreated: "تم إنشاء الحساب بنجاح.",
    profileUpdated: "تم تحديث الملف الشخصي.",
    postPublished: "تم نشر المنشور.",
    messageSent: "تم إرسال الرسالة.",
    signedOut: "تم تسجيل الخروج.",
    notSignedIn: "لست مسجلاً للدخول.",
    signedInAs: "تم تسجيل الدخول باسم",
    justNow: "الآن",
    social: "رابط",
    message: "رسالة",
    delete: "حذف",
    admin: "وصول المشرف",
    member: "عضو",
    noBio: "لا يوجد نبذة شخصية بعد.",
    profilePrompt: "سجّل الدخول لتفعيل بطاقة العضوية العامة الخاصة بك."
  }
};

const setupNotice = document.getElementById("setupNotice");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");
const profileSpotlight = document.getElementById("profileSpotlight");

const authPanel = document.getElementById("authPanel");
const profilePanel = document.getElementById("profilePanel");
const composerPanel = document.getElementById("composerPanel");
const memberPanels = document.getElementById("memberPanels");
const messageForm = document.getElementById("messageForm");

const signinForm = pickElement("signinForm", "signInForm");
const signupForm = pickElement("signupForm", "signUpForm");
const profileForm = document.getElementById("profileForm");
const postForm = document.getElementById("postForm");

const memberList = document.getElementById("memberList");
const feedList = document.getElementById("feedList");
const inboxList = document.getElementById("inboxList");
const messageRecipient = pickElement("messageRecipient", "recipientUid");
const refreshFeedBtn = document.getElementById("refreshFeedBtn");

const authTabs = document.querySelectorAll(".auth-tab");

let auth;
let db;
let currentUser = null;
let unsubscribeFeed = null;
let unsubscribeInbox = null;
let unsubscribeMembers = null;

if (!firebaseIsConfigured(firebaseConfig)) {
  setupNotice?.classList.add("visible");
  setStatus(t("addKeysFirst"), "error");
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  setupNotice?.classList.remove("visible");
  initCommunity();
}

document.addEventListener("eysae:languagechange", () => {
  refreshStaticStates();
  if (currentUser) {
    renderCurrentSpotlight();
  }
});

function pickElement(...ids) {
  return ids.map((id) => document.getElementById(id)).find(Boolean) || null;
}

function currentLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return runtimeI18n[saved] ? saved : "en";
}

function t(key) {
  const lang = currentLang();
  return runtimeI18n[lang]?.[key] || runtimeI18n.en[key] || key;
}

function isAdminEmail(email = "") {
  return ADMIN_EMAILS.includes(String(email).toLowerCase());
}

function initialsFrom(name = "Member") {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "EY";
}

function initCommunity() {
  bindAuthTabs();
  bindForms();
  bindButtons();
  startPublicFeedListener();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      showSignedOutState();
      stopUserListeners();
      return;
    }

    await ensureUserProfile(user);
    await fillProfileForm(user.uid);
    await renderCurrentSpotlight();
    showSignedInState(user);
    startUserListeners(user.uid);
  });
}

function bindAuthTabs() {
  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      authTabs.forEach((button) => button.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.authTab;
      signinForm?.classList.toggle("hidden", target !== "signin");
      signupForm?.classList.toggle("hidden", target !== "signup");
    });
  });
}

function bindForms() {
  signinForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = pickElement("signinEmail", "signInEmail")?.value.trim();
    const password = pickElement("signinPassword", "signInPassword")?.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      signinForm.reset();
      setStatus(t("signedInSuccess"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const displayName = pickElement("signupName", "signUpName")?.value.trim();
    const email = pickElement("signupEmail", "signUpEmail")?.value.trim();
    const password = pickElement("signupPassword", "signUpPassword")?.value;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await ensureUserProfile(credential.user, { displayName });
      signupForm.reset();
      setStatus(t("accountCreated"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const profileData = {
      displayName: document.getElementById("profileName")?.value.trim() || currentUser.displayName || t("member"),
      role: document.getElementById("profileRole")?.value.trim() || t("member"),
      bio: document.getElementById("profileBio")?.value.trim() || "",
      socialLink: document.getElementById("profileSocial")?.value.trim() || "",
      updatedAt: serverTimestamp()
    };

    try {
      await updateProfile(currentUser, { displayName: profileData.displayName });
      await updateDoc(doc(db, "users", currentUser.uid), profileData);
      await renderCurrentSpotlight();
      setStatus(t("profileUpdated"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const profile = await getProfile(currentUser.uid);
    const payload = {
      authorId: currentUser.uid,
      authorName: profile.displayName || currentUser.displayName || currentUser.email,
      authorRole: profile.role || t("member"),
      socialLink: profile.socialLink || "",
      type: document.getElementById("postType")?.value || "update",
      tag: document.getElementById("postTag")?.value.trim() || "",
      content: document.getElementById("postContent")?.value.trim() || "",
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "posts"), payload);
      postForm.reset();
      setStatus(t("postPublished"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    const toId = messageRecipient?.value;
    const text = document.getElementById("messageText")?.value.trim();
    if (!toId || !text) return;

    const profile = await getProfile(currentUser.uid);

    try {
      await addDoc(collection(db, "users", toId, "messages"), {
        fromId: currentUser.uid,
        fromName: profile.displayName || currentUser.displayName || currentUser.email,
        text,
        toId,
        createdAt: serverTimestamp()
      });
      messageForm.reset();
      setStatus(t("messageSent"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });
}

function bindButtons() {
  logoutBtn?.addEventListener("click", async () => {
    if (!auth || !currentUser) return;
    try {
      await signOut(auth);
      setStatus(t("signedOut"), "success");
    } catch (error) {
      setStatus(humanizeError(error), "error");
    }
  });

  refreshFeedBtn?.addEventListener("click", async () => {
    if (!db) return;
    await renderFeed();
    if (currentUser) {
      await renderMembers();
      await renderInbox();
      await renderCurrentSpotlight();
    }
  });
}

async function ensureUserProfile(user, overrides = {}) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const baseProfile = {
    displayName: overrides.displayName || user.displayName || user.email?.split("@")[0] || t("member"),
    email: user.email || "",
    role: t("member"),
    bio: "",
    socialLink: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    await setDoc(userRef, baseProfile);
    return;
  }

  const existing = snapshot.data();
  const patch = {};
  if (!existing.displayName && baseProfile.displayName) patch.displayName = baseProfile.displayName;
  if (!existing.email && baseProfile.email) patch.email = baseProfile.email;
  if (Object.keys(patch).length) {
    patch.updatedAt = serverTimestamp();
    await updateDoc(userRef, patch);
  }
}

async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : {};
}

async function fillProfileForm(uid) {
  const profile = await getProfile(uid);
  const nameInput = document.getElementById("profileName");
  const roleInput = document.getElementById("profileRole");
  const bioInput = document.getElementById("profileBio");
  const socialInput = document.getElementById("profileSocial");

  if (nameInput) nameInput.value = profile.displayName || "";
  if (roleInput) roleInput.value = profile.role || "";
  if (bioInput) bioInput.value = profile.bio || "";
  if (socialInput) socialInput.value = profile.socialLink || "";
}

function startPublicFeedListener() {
  unsubscribeFeed = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)), (snapshot) => {
    const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderFeed(posts);
  });
}

function startUserListeners(uid) {
  stopUserListeners();

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

function stopUserListeners() {
  if (unsubscribeMembers) unsubscribeMembers();
  if (unsubscribeInbox) unsubscribeInbox();
  unsubscribeMembers = null;
  unsubscribeInbox = null;
}

async function renderFeed(posts = null) {
  if (!Array.isArray(posts)) {
    const snapshot = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(40)));
    posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  if (!posts.length) {
    feedList.innerHTML = `<p class="empty-state">${t("feedEmpty")}</p>`;
    return;
  }

  feedList.innerHTML = posts.map((post) => {
    const canDelete = currentUser && (currentUser.uid === post.authorId || isAdminEmail(currentUser.email));
    const social = post.socialLink ? `<a href="${escapeAttribute(post.socialLink)}" target="_blank" rel="noreferrer">${t("social")}</a>` : "";
    const authorName = escapeHtml(post.authorName || t("member"));
    const role = escapeHtml(post.authorRole || t("member"));
    return `
      <article class="feed-card">
        <div class="feed-card-top">
          <div class="feed-author-row">
            <div class="feed-avatar">${escapeHtml(initialsFrom(post.authorName || "M"))}</div>
            <div>
              <span class="feed-chip">${escapeHtml(post.type || "update")}</span>
              <strong class="feed-author">${authorName}</strong>
              <p class="feed-meta">${role} · ${formatDate(post.createdAt)}${social ? ` · ${social}` : ""}</p>
            </div>
          </div>
          ${canDelete ? `<button type="button" class="btn-delete-post" data-post-id="${post.id}">${t("delete")}</button>` : ""}
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
      try {
        await deleteDoc(doc(db, "posts", postId));
      } catch (error) {
        setStatus(humanizeError(error), "error");
      }
    });
  });
}

async function renderMembers(members = null) {
  if (!currentUser) {
    memberList.innerHTML = `<p class="empty-state">${t("signInToSeeMembers")}</p>`;
    if (messageRecipient) {
      messageRecipient.innerHTML = `<option value="">${t("noMemberAvailable")}</option>`;
    }
    return;
  }

  if (!Array.isArray(members)) {
    const snapshot = await getDocs(query(collection(db, "users"), orderBy("displayName"), limit(100)));
    members = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => item.id !== currentUser.uid);
  }

  if (!members.length) {
    memberList.innerHTML = `<p class="empty-state">${t("membersEmpty")}</p>`;
    if (messageRecipient) {
      messageRecipient.innerHTML = `<option value="">${t("noMemberAvailable")}</option>`;
    }
    return;
  }

  memberList.innerHTML = members.map((member) => {
    const social = member.socialLink ? `<a href="${escapeAttribute(member.socialLink)}" target="_blank" rel="noreferrer">${t("social")}</a>` : "";
    const adminBadge = isAdminEmail(member.email) ? `<span class="admin-badge">${t("admin")}</span>` : "";
    return `
      <article class="member-card">
        <div class="member-card-top">
          <div class="member-author-row">
            <div class="member-avatar">${escapeHtml(initialsFrom(member.displayName || member.email || "M"))}</div>
            <div>
              <strong class="member-name">${escapeHtml(member.displayName || t("member"))}</strong>
              <p class="member-subline">${escapeHtml(member.email || "")}</p>
              <div class="member-role-row">
                <span class="role-pill">${escapeHtml(member.role || t("member"))}</span>
                ${adminBadge}
              </div>
            </div>
          </div>
        </div>
        <p class="member-bio">${escapeHtml(member.bio || t("noBio"))}</p>
        <div class="member-actions">
          ${social}
          <button type="button" class="member-message-btn" data-member-id="${member.id}">${t("message")}</button>
        </div>
      </article>
    `;
  }).join("");

  if (messageRecipient) {
    messageRecipient.innerHTML = `<option value="">${t("selectMember")}</option>` + members.map((member) => {
      return `<option value="${member.id}">${escapeHtml(member.displayName || member.email || t("member"))}</option>`;
    }).join("");
  }

  memberList.querySelectorAll(".member-message-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (messageRecipient) messageRecipient.value = button.dataset.memberId || "";
      document.getElementById("messageText")?.focus();
      messageForm?.classList.remove("hidden");
    });
  });
}

async function renderInbox(messages = null) {
  if (!currentUser) {
    inboxList.innerHTML = `<p class="empty-state">${t("signInToReadMessages")}</p>`;
    return;
  }

  if (!Array.isArray(messages)) {
    const snapshot = await getDocs(query(collection(db, "users", currentUser.uid, "messages"), orderBy("createdAt", "desc"), limit(50)));
    messages = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  }

  if (!messages.length) {
    inboxList.innerHTML = `<p class="empty-state">${t("inboxEmpty")}</p>`;
    return;
  }

  inboxList.innerHTML = messages.map((message) => `
    <article class="inbox-card">
      <div class="inbox-card-top">
        <strong class="feed-author">${escapeHtml(message.fromName || t("member"))}</strong>
        <span class="inbox-date">${formatDate(message.createdAt)}</span>
      </div>
      <p>${escapeHtml(message.text || "")}</p>
    </article>
  `).join("");
}

async function renderCurrentSpotlight() {
  if (!profileSpotlight) return;

  if (!currentUser) {
    profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
    profileSpotlight.innerHTML = `
      <div class="profile-avatar">EY</div>
      <div>
        <strong>EYSAE</strong>
        <p>${escapeHtml(t("profilePrompt"))}</p>
      </div>
    `;
    return;
  }

  const profile = await getProfile(currentUser.uid);
  const adminBadge = isAdminEmail(currentUser.email) ? `<span class="admin-badge">${t("admin")}</span>` : "";
  const social = profile.socialLink ? `<a href="${escapeAttribute(profile.socialLink)}" target="_blank" rel="noreferrer">${t("social")}</a>` : "";

  profileSpotlight.className = "profile-spotlight";
  profileSpotlight.innerHTML = `
    <div class="profile-avatar">${escapeHtml(initialsFrom(profile.displayName || currentUser.email || "M"))}</div>
    <div>
      <strong>${escapeHtml(profile.displayName || currentUser.displayName || t("member"))}</strong>
      <p>${escapeHtml(profile.bio || t("noBio"))}</p>
      <div class="profile-meta">
        <span class="role-pill">${escapeHtml(profile.role || t("member"))}</span>
        ${adminBadge}
      </div>
      ${social ? `<div class="profile-links">${social}</div>` : ""}
    </div>
  `;
}

function refreshStaticStates() {
  if (!currentUser) {
    if (memberList) memberList.innerHTML = `<p class="empty-state">${t("signInToSeeMembers")}</p>`;
    if (inboxList) inboxList.innerHTML = `<p class="empty-state">${t("signInToReadMessages")}</p>`;
    if (messageRecipient) messageRecipient.innerHTML = `<option value="">${t("noMemberAvailable")}</option>`;
  }
  if (!feedList?.children.length) {
    feedList.innerHTML = `<p class="empty-state">${t("feedEmpty")}</p>`;
  }
}

function showSignedOutState() {
  profilePanel?.classList.add("hidden");
  composerPanel?.classList.add("hidden");
  messageForm?.classList.add("hidden");
  logoutBtn.disabled = true;
  renderCurrentSpotlight();
  renderMembers([]);
  renderInbox([]);
  setStatus(t("notSignedIn"), "");
}

function showSignedInState(user) {
  profilePanel?.classList.remove("hidden");
  composerPanel?.classList.remove("hidden");
  messageForm?.classList.remove("hidden");
  memberPanels?.classList.remove("hidden");
  logoutBtn.disabled = false;
  setStatus(`${t("signedInAs")} ${user.email}.`, "success");
}

function setStatus(message, tone = "") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.classList.remove("success", "error");
  if (tone) authStatus.classList.add(tone);
}

function formatDate(value) {
  const raw = value?.toDate ? value.toDate() : null;
  if (!raw) return t("justNow");
  const locale = currentLang() === "gr" ? "el-GR" : currentLang() === "sl" ? "sl-SI" : currentLang() === "ar" ? "ar" : "en-GB";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(raw);
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
