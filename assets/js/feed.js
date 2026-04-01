import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

if (document.body?.dataset?.page === "feed") {
  const app = initializeApp(firebaseConfig, "feed-page");
  const auth = getAuth(app);
  const db = getFirestore(app);
  const $ = (id) => document.getElementById(id);
  const ui = {
    authStatus: $("authStatus"),
    profileSpotlight: $("profileSpotlight"),
    feedList: $("feedList")
  };
  let currentUser = null;

  const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const initials = (value) => ((value || "EY").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "EY");
  const formatDate = (value) => {
    const raw = value?.toDate ? value.toDate() : value;
    if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return "—";
    return new Intl.DateTimeFormat(document.documentElement.lang || "en", { dateStyle: "medium", timeStyle: "short" }).format(raw);
  };

  function setStatus(text, tone = "") {
    if (!ui.authStatus) return;
    ui.authStatus.textContent = text;
    ui.authStatus.className = `status-bar ${tone}`.trim();
  }

  function renderSpotlight(profile) {
    if (!currentUser || !profile) {
      ui.profileSpotlight.innerHTML = `<div class="profile-avatar">EY</div><div><strong>Public feed</strong><p>Sign in from the member workspace to submit updates or use private messages.</p></div>`;
      ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
      return;
    }
    ui.profileSpotlight.className = "profile-spotlight";
    ui.profileSpotlight.innerHTML = `<div class="profile-avatar">${esc(initials(profile.displayName || currentUser.email || "EY"))}</div><div><strong>${esc(profile.displayName || currentUser.email || "Member")}</strong><div class="profile-meta"><span class="role-pill">${esc(profile.role || "Member")}</span></div><p>${esc(profile.bio || "Signed in and ready to contribute.")}</p></div>`;
  }

  function renderFeed(posts) {
    if (!posts.length) {
      ui.feedList.innerHTML = '<div class="empty-state">No approved posts yet.</div>';
      return;
    }
    ui.feedList.innerHTML = posts.map((post) => `
      <article class="feed-card">
        <div class="feed-card-top">
          <div class="feed-author-row">
            <div class="feed-avatar">${esc(initials(post.authorName || "Member"))}</div>
            <div>
              <div class="feed-chip">${esc(post.type || "update")}</div>
              <strong class="feed-author">${esc(post.authorName || "Member")}</strong>
              <div class="feed-meta">${esc(post.authorRole || "Member")} · ${esc(formatDate(post.publishedAt || post.createdAt))}</div>
            </div>
          </div>
        </div>
        ${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ""}
        ${post.title ? `<h3 class="feed-title">${esc(post.title)}</h3>` : ""}
        <p class="feed-content">${esc(post.content || "")}</p>
        ${post.imageUrl ? `<img class="feed-image" src="${esc(post.imageUrl)}" alt="${esc(post.imageAlt || post.title || "Feed image")}" />` : ""}
      </article>`).join("");
  }

  if (!firebaseIsConfigured(firebaseConfig)) {
    setStatus("Firebase configuration is missing.", "error");
  } else {
    onSnapshot(
      query(collection(db, "posts"), orderBy("publishedAt", "desc"), limit(60)),
      (snap) => {
        const posts = snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() })).filter((item) => item.status === "approved");
        renderFeed(posts);
      },
      (error) => setStatus(error?.message || "Feed could not load.", "error")
    );

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (!user) {
        renderSpotlight(null);
        setStatus("Public view.");
        return;
      }
      const snap = await getDoc(doc(db, "users", user.uid));
      const profile = snap.exists() ? snap.data() : null;
      renderSpotlight(profile);
      setStatus(`Signed in as ${user.email}.`, "success");
    });
  }
}
