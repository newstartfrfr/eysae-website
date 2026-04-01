import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, doc, getDoc, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

if (document.body?.dataset?.page === 'feed') {
  const app = initializeApp(firebaseConfig, 'feed-page');
  const auth = getAuth(app);
  const db = getFirestore(app);
  const $ = (id) => document.getElementById(id);
  const ui = {
    authStatus: $('authStatus'),
    profileSpotlight: $('profileSpotlight'),
    composerPanel: $('composerPanel'),
    postForm: $('postForm'),
    postType: $('postType'),
    postTag: $('postTag'),
    postMessage: $('postMessage'),
    feedList: $('feedList')
  };
  let currentUser = null;

  const esc = (v) => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#039;');
  const initials = (v) => ((v || 'M').trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()||'').join('') || 'M');
  const formatDate = (value) => {
    const raw = value?.toDate ? value.toDate() : value;
    if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return '—';
    return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { dateStyle:'medium', timeStyle:'short' }).format(raw);
  };

  function setStatus(text, tone='') {
    if (!ui.authStatus) return;
    ui.authStatus.textContent = text;
    ui.authStatus.className = `status-bar ${tone}`.trim();
  }

  function renderSpotlight(profile) {
    if (!currentUser || !profile) {
      ui.profileSpotlight.innerHTML = `<div class="profile-avatar">EY</div><div><strong>Public feed</strong><p>Sign in from the member area to publish updates.</p></div>`;
      ui.profileSpotlight.className = 'profile-spotlight profile-spotlight-empty';
      return;
    }
    ui.profileSpotlight.className = 'profile-spotlight';
    ui.profileSpotlight.innerHTML = `<div class="profile-avatar">${esc(initials(profile.displayName || currentUser.email || 'M'))}</div><div><strong>${esc(profile.displayName || currentUser.email || 'Member')}</strong><div class="profile-meta"><span class="role-pill">${esc(profile.role || 'Member')}</span></div><p>${esc(profile.bio || 'Signed in and ready to publish updates.')}</p></div>`;
  }

  function renderFeed(posts) {
    if (!posts.length) {
      ui.feedList.innerHTML = '<div class="empty-state">No posts yet.</div>';
      return;
    }
    ui.feedList.innerHTML = posts.map((post) => `
      <article class="feed-card">
        <div class="feed-card-top">
          <div class="feed-author-row">
            <div class="feed-avatar">${esc(initials(post.authorName || 'M'))}</div>
            <div>
              <div class="feed-chip">${esc(post.type || 'update')}</div>
              <strong class="feed-author">${esc(post.authorName || 'Member')}</strong>
              <div class="feed-meta">${esc(post.authorRole || 'Member')} · ${esc(formatDate(post.createdAt))}</div>
            </div>
          </div>
        </div>
        ${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ''}
        <p class="feed-content">${esc(post.content || '')}</p>
      </article>`).join('');
  }

  onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
    renderFeed(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => setStatus(error.message || 'Feed could not load.', 'error'));

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (!user) {
      ui.composerPanel.classList.add('hidden');
      renderSpotlight(null);
      setStatus('Public feed active. Sign in in the member area to post.');
      return;
    }
    ui.composerPanel.classList.remove('hidden');
    const snap = await getDoc(doc(db, 'users', user.uid));
    const profile = snap.exists() ? snap.data() : null;
    renderSpotlight(profile);
    setStatus(`Signed in as ${user.email}.`, 'success');
  });

  ui.postForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
      setStatus('You need to sign in in the member area first.', 'error');
      return;
    }
    const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const content = ui.postMessage.value.trim();
    if (!content) {
      setStatus('Write a message before publishing.', 'error');
      return;
    }
    await addDoc(collection(db, 'posts'), {
      authorId: currentUser.uid,
      authorName: profile.displayName || currentUser.displayName || currentUser.email || 'Member',
      authorRole: profile.role || 'Member',
      socialLink: profile.socialLink || '',
      type: ui.postType.value || 'update',
      tag: ui.postTag.value.trim() || '',
      content,
      createdAt: Timestamp.now()
    });
    ui.postForm.reset();
    setStatus('Post published.', 'success');
  });
}