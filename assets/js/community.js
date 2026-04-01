import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  deleteDoc,
  where,
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, firebaseIsConfigured } from "./firebase-config.js";

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
let currentConversations = [];
let unsubFeed = null;
let unsubMembers = null;
let unsubInbox = null;

const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', '&quot;').replaceAll("'", "&#039;");
const initials = (v) => ((v || 'EY').replace(/\s+/g,' ').trim().split(' ').slice(0,2).map(part => part.charAt(0).toUpperCase()).join('') || 'EY');
const isAdminEmail = (email) => ADMIN_EMAILS.has((email || '').toLowerCase());
const nowTimestamp = () => Timestamp.now();
const conversationId = (uidA, uidB) => [uidA, uidB].sort().join('__');
function t(key, fallback) { return fallback; }
function formatDate(value) {
  if (!value) return '—';
  const raw = value.toDate ? value.toDate() : value;
  if (!(raw instanceof Date) || Number.isNaN(raw.valueOf())) return '—';
  return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(raw);
}
function humanizeError(error) {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong email or password.";
    case "auth/email-already-in-use": return "This email is already in use.";
    case "auth/invalid-email": return "Invalid email address.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/operation-not-allowed": return "Email and password sign-in is not enabled in Firebase Authentication.";
    case "permission-denied": return "Firestore rules are blocking this action.";
    case "auth/network-request-failed": return "Network error. Check your connection and try again.";
    default: return error?.message || "Something went wrong.";
  }
}
function setStatus(message, tone = "neutral") {
  if (!ui.authStatus) return;
  ui.authStatus.textContent = message;
  ui.authStatus.classList.remove('success','error');
  if (tone === 'success') ui.authStatus.classList.add('success');
  if (tone === 'error') ui.authStatus.classList.add('error');
}
function showSetupNotice(message) {
  if (!ui.setupNotice) return;
  ui.setupNotice.classList.add('visible');
  ui.setupNotice.innerHTML = `<strong>Firebase setup</strong><p>${esc(message)}</p>`;
}
function hideSetupNotice() { ui.setupNotice?.classList.remove('visible'); }
function switchAuthMode(mode) {
  const signInActive = mode !== 'signup';
  ui.signInForm?.classList.toggle('hidden', !signInActive);
  ui.signUpForm?.classList.toggle('hidden', signInActive);
  document.querySelectorAll('[data-auth-tab], [data-auth-mode]').forEach((button) => {
    const tab = button.dataset.authTab || button.dataset.authMode;
    button.classList.toggle('active', tab === (signInActive ? 'signin' : 'signup'));
  });
}
function bindAuthTabs() {
  document.querySelectorAll('[data-auth-tab], [data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => switchAuthMode(button.dataset.authTab || button.dataset.authMode));
  });
}
function renderProfileSpotlight(profile = null, user = null) {
  if (!ui.profileSpotlight) return;
  if (!profile || !user) {
    ui.profileSpotlight.className = 'profile-spotlight profile-spotlight-empty';
    ui.profileSpotlight.innerHTML = `<div class="profile-avatar">EY</div><div><strong>EYSAE Member</strong><p>Sign in to activate your member card and messages.</p></div>`;
    return;
  }
  const name = profile.displayName || user.displayName || user.email || 'Member';
  const role = profile.role || 'Member';
  const bio = profile.bio || 'Your public profile appears here after you save it.';
  const social = profile.socialLink ? `<a href="${esc(profile.socialLink)}" target="_blank" rel="noreferrer">social</a>` : '';
  ui.profileSpotlight.className = 'profile-spotlight';
  ui.profileSpotlight.innerHTML = `<div class="profile-avatar">${esc(initials(name))}</div><div><strong>${esc(name)}</strong><div class="profile-meta"><span class="role-pill">${esc(role)}</span>${isAdminEmail(user.email) ? '<span class="admin-badge">Admin</span>' : ''}</div><p>${esc(bio)}</p>${social ? `<div class="profile-links">${social}</div>` : ''}</div>`;
}
function renderFeed(posts = currentFeed) {
  currentFeed = Array.isArray(posts) ? posts : [];
  if (!ui.feedList) return;
  if (!currentFeed.length) { ui.feedList.innerHTML = '<div class="empty-state">No posts yet.</div>'; return; }
  ui.feedList.innerHTML = currentFeed.map((post) => {
    const canDelete = currentUser && (post.authorId === currentUser.uid || isAdminEmail(currentUser.email));
    return `<article class="feed-card"><div class="feed-card-top"><div class="feed-author-row"><div class="feed-avatar">${esc(initials(post.authorName || 'M'))}</div><div><div class="feed-chip">${esc(post.type || 'update')}</div><strong class="feed-author">${esc(post.authorName || 'Member')}</strong><div class="feed-meta">${esc(post.authorRole || 'Member')} · ${esc(formatDate(post.createdAt))}</div></div></div>${canDelete ? `<button type="button" class="btn-delete-post" data-post-id="${esc(post.id)}">Delete</button>` : ''}</div>${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ''}<p class="feed-content">${esc(post.content || '')}</p></article>`;
  }).join('');
  ui.feedList.querySelectorAll('[data-post-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      try { await deleteDoc(doc(db, 'posts', button.dataset.postId)); setStatus('Post deleted.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); }
    });
  });
}
function renderMembers(members = currentMembers) {
  currentMembers = Array.isArray(members) ? members : [];
  if (!ui.membersGrid || !ui.recipientUid) return;
  if (!currentUser) {
    ui.membersGrid.innerHTML = '<div class="empty-state">Sign in to see members.</div>';
    ui.recipientUid.innerHTML = '<option value="">Select a member</option>';
    return;
  }
  if (!currentMembers.length) {
    ui.membersGrid.innerHTML = '<div class="empty-state">No members yet.</div>';
    ui.recipientUid.innerHTML = '<option value="">Select a member</option>';
    return;
  }
  ui.membersGrid.innerHTML = currentMembers.map((member) => `<article class="member-card"><div class="member-card-top"><div class="member-author-row"><div class="member-avatar">${esc(initials(member.displayName || member.email || 'M'))}</div><div><strong class="member-name">${esc(member.displayName || member.email || 'Member')}</strong><div class="member-role-row"><span class="role-pill">${esc(member.role || 'Member')}</span>${member.email && isAdminEmail(member.email) ? '<span class="admin-badge">Admin</span>' : ''}</div></div></div><button type="button" class="member-message-btn" data-member-id="${esc(member.id)}">Message</button></div>${member.bio ? `<p class="member-bio">${esc(member.bio)}</p>` : ''}${member.socialLink ? `<div class="member-actions"><a href="${esc(member.socialLink)}" target="_blank" rel="noreferrer">social</a></div>` : ''}</article>`).join('');
  ui.recipientUid.innerHTML = `<option value="">Select a member</option>${currentMembers.map((member) => `<option value="${esc(member.id)}">${esc(member.displayName || member.email || 'Member')}</option>`).join('')}`;
  ui.membersGrid.querySelectorAll('.member-message-btn').forEach((button) => {
    button.addEventListener('click', () => {
      ui.recipientUid.value = button.dataset.memberId || '';
      ui.messageForm?.classList.remove('hidden');
      ui.directMessageText?.focus();
      document.getElementById('chatLauncher')?.click();
    });
  });
}
function renderInbox(conversations = currentConversations) {
  currentConversations = Array.isArray(conversations) ? conversations : [];
  if (!ui.inboxList) return;
  if (!currentUser) { ui.inboxList.innerHTML = '<div class="empty-state">Sign in to read messages.</div>'; return; }
  if (!currentConversations.length) { ui.inboxList.innerHTML = '<div class="empty-state">No conversations yet.</div>'; return; }
  ui.inboxList.innerHTML = currentConversations.map((item) => {
    const otherUid = (item.participants || []).find((uid) => uid !== currentUser.uid) || '';
    const otherName = item.participantNames?.[otherUid] || 'Member';
    return `<article class="inbox-card"><div class="inbox-card-top"><strong>${esc(otherName)}</strong><span class="inbox-date">${esc(formatDate(item.updatedAt))}</span></div><p>${esc(item.lastMessage || '')}</p></article>`;
  }).join('');
}
async function loadPublicFeedOnce() {
  try { const snapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20))); renderFeed(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))); } catch (error) { setStatus(humanizeError(error), 'error'); }
}
function stopRealtimeListeners() { unsubFeed?.(); unsubMembers?.(); unsubInbox?.(); unsubFeed = unsubMembers = unsubInbox = null; }
function startSignedInListeners(uid) {
  stopRealtimeListeners();
  unsubFeed = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(40)), (snapshot) => renderFeed(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), (error) => setStatus(humanizeError(error), 'error'));
  unsubMembers = onSnapshot(query(collection(db, 'users'), orderBy('displayName'), limit(100)), (snapshot) => renderMembers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.id !== uid)), (error) => setStatus(humanizeError(error), 'error'));
  unsubInbox = onSnapshot(query(collection(db, 'conversations'), where('participants', 'array-contains', uid), limit(30)), (snapshot) => {
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a,b)=>{
      const ad = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
      const bd = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
      return bd - ad;
    });
    renderInbox(items);
  }, (error) => setStatus(humanizeError(error), 'error'));
}
async function ensureUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    const baseProfile = { displayName: user.displayName || user.email?.split('@')[0] || 'Member', email: user.email || '', role: 'Member', bio: '', socialLink: '', createdAt: nowTimestamp(), updatedAt: nowTimestamp() };
    await setDoc(userRef, baseProfile);
    currentProfile = baseProfile;
    return baseProfile;
  }
  currentProfile = snapshot.data();
  return currentProfile;
}
function fillProfileForm(profile) { if (!profile) return; ui.profileName && (ui.profileName.value = profile.displayName || ''); ui.profileOrganisation && (ui.profileOrganisation.value = profile.role || ''); ui.profileBio && (ui.profileBio.value = profile.bio || ''); ui.profileSocial && (ui.profileSocial.value = profile.socialLink || ''); }
function showSignedOutState() { currentProfile = null; ui.logoutBtn?.classList.add('hidden'); ui.profilePanel?.classList.add('hidden'); ui.composerPanel?.classList.add('hidden'); ui.messageForm?.classList.add('hidden'); ui.authPanel?.classList.remove('hidden'); renderProfileSpotlight(); renderMembers([]); renderInbox([]); setStatus('Not signed in.'); loadPublicFeedOnce(); }
function showSignedInState(user, profile) { ui.logoutBtn?.classList.remove('hidden'); ui.profilePanel?.classList.remove('hidden'); ui.composerPanel?.classList.remove('hidden'); ui.messageForm?.classList.remove('hidden'); ui.authPanel?.classList.add('hidden'); renderProfileSpotlight(profile, user); fillProfileForm(profile); setStatus(`Signed in as ${user.email}.`, 'success'); }
async function refreshManual() {
  try {
    await loadPublicFeedOnce();
    if (currentUser) {
      const profile = await ensureUserProfile(currentUser); showSignedInState(currentUser, profile);
      const memberSnap = await getDocs(query(collection(db, 'users'), orderBy('displayName'), limit(100)));
      renderMembers(memberSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.id !== currentUser.uid));
      const convSnap = await getDocs(query(collection(db, 'conversations'), where('participants', 'array-contains', currentUser.uid), limit(30)));
      renderInbox(convSnap.docs.map((item) => ({ id: item.id, ...item.data() })));
    }
    setStatus('Community refreshed.', 'success');
  } catch (error) { setStatus(humanizeError(error), 'error'); }
}
function bindButtons() { ui.logoutBtn?.addEventListener('click', async () => { try { await signOut(auth); setStatus('Signed out.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } }); ui.refreshFeedBtn?.addEventListener('click', refreshManual); }
function bindForms() {
  ui.signInForm?.addEventListener('submit', async (event) => { event.preventDefault(); const email = ui.signInEmail?.value.trim() || ''; const password = ui.signInPassword?.value || ''; if (!email || !password) { setStatus('Enter your email and password.', 'error'); return; } try { await signInWithEmailAndPassword(auth, email, password); ui.signInForm.reset(); setStatus('Signed in successfully.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } });
  ui.signUpForm?.addEventListener('submit', async (event) => { event.preventDefault(); const displayName = ui.signUpName?.value.trim() || ''; const email = ui.signUpEmail?.value.trim() || ''; const password = ui.signUpPassword?.value || ''; if (displayName.length < 2) { setStatus('Display name must be at least 2 characters.', 'error'); return; } if (!email || password.length < 6) { setStatus('Enter a valid email and a password with at least 6 characters.', 'error'); return; } try { const credential = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(credential.user, { displayName }); const payload = { displayName, email, role: 'Member', bio: '', socialLink: '', createdAt: nowTimestamp(), updatedAt: nowTimestamp() }; await setDoc(doc(db, 'users', credential.user.uid), payload); currentProfile = payload; ui.signUpForm.reset(); switchAuthMode('signin'); setStatus('Account created successfully.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } });
  ui.profileForm?.addEventListener('submit', async (event) => { event.preventDefault(); if (!currentUser) { setStatus('You need to sign in first.', 'error'); return; } const displayName = ui.profileName?.value.trim() || ''; const role = ui.profileOrganisation?.value.trim() || ''; const bio = ui.profileBio?.value.trim() || ''; const socialLink = ui.profileSocial?.value.trim() || ''; if (displayName.length < 2) { setStatus('Display name must be at least 2 characters.', 'error'); return; } if (socialLink && !/^https?:\/\//i.test(socialLink)) { setStatus('Social link must start with http:// or https://', 'error'); return; } try { await updateProfile(currentUser, { displayName }); const userRef = doc(db, 'users', currentUser.uid); const snapshot = await getDoc(userRef); const existing = snapshot.exists() ? snapshot.data() : null; const payload = { displayName, email: currentUser.email || existing?.email || '', role, bio, socialLink, createdAt: existing?.createdAt || nowTimestamp(), updatedAt: nowTimestamp() }; await setDoc(userRef, payload); currentProfile = payload; renderProfileSpotlight(payload, currentUser); setStatus('Profile updated.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } });
  ui.postForm?.addEventListener('submit', async (event) => { event.preventDefault(); if (!currentUser) { setStatus('You need to sign in first.', 'error'); return; } const type = ui.postType?.value || 'update'; const tag = ui.postTag?.value.trim() || ''; const content = ui.postMessage?.value.trim() || ''; if (!content) { setStatus('Write a post before publishing.', 'error'); return; } try { const snapshot = await getDoc(doc(db, 'users', currentUser.uid)); const profile = snapshot.exists() ? snapshot.data() : currentProfile || {}; await addDoc(collection(db, 'posts'), { authorId: currentUser.uid, authorName: profile.displayName || currentUser.displayName || currentUser.email || 'Member', authorRole: profile.role || 'Member', socialLink: profile.socialLink || '', type, tag, content, createdAt: nowTimestamp() }); ui.postForm.reset(); setStatus('Post published.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } });
  ui.messageForm?.addEventListener('submit', async (event) => { event.preventDefault(); if (!currentUser) { setStatus('You need to sign in first.', 'error'); return; } const toId = ui.recipientUid?.value || ''; const text = ui.directMessageText?.value.trim() || ''; if (!toId) { setStatus('Select a member first.', 'error'); return; } if (!text) { setStatus('Write a message first.', 'error'); return; } try { const senderProfileSnap = await getDoc(doc(db, 'users', currentUser.uid)); const recipientSnap = await getDoc(doc(db, 'users', toId)); const senderProfile = senderProfileSnap.exists() ? senderProfileSnap.data() : currentProfile || {}; const recipientProfile = recipientSnap.exists() ? recipientSnap.data() : {}; const convRef = doc(db, 'conversations', conversationId(currentUser.uid, toId)); await setDoc(convRef, { participants: [currentUser.uid, toId].sort(), participantNames: { [currentUser.uid]: senderProfile.displayName || currentUser.displayName || currentUser.email || 'Member', [toId]: recipientProfile.displayName || recipientProfile.email || 'Member' }, updatedAt: serverTimestamp(), lastMessage: text, lastSenderId: currentUser.uid }, { merge: true }); await addDoc(collection(db, 'conversations', convRef.id, 'messages'), { senderId: currentUser.uid, senderName: senderProfile.displayName || currentUser.displayName || currentUser.email || 'Member', text, createdAt: serverTimestamp() }); ui.messageForm.reset(); setStatus('Message sent.', 'success'); } catch (error) { setStatus(humanizeError(error), 'error'); } });
}
function handleAuthState() { onAuthStateChanged(auth, async (user) => { currentUser = user; if (!user) { stopRealtimeListeners(); showSignedOutState(); return; } try { const profile = await ensureUserProfile(user); showSignedInState(user, profile); startSignedInListeners(user.uid); } catch (error) { setStatus(humanizeError(error), 'error'); } }); }
document.addEventListener('eysae:languagechange', () => { renderFeed(); renderMembers(); renderInbox(); renderProfileSpotlight(currentProfile, currentUser); });
function init() { bindAuthTabs(); bindForms(); bindButtons(); switchAuthMode('signin'); if (!firebaseIsConfigured(firebaseConfig)) { showSetupNotice('Firebase configuration is missing or incomplete.'); setStatus('Firebase configuration is missing or incomplete.', 'error'); return; } try { app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app); hideSetupNotice(); handleAuthState(); loadPublicFeedOnce(); } catch (error) { showSetupNotice(humanizeError(error)); setStatus(humanizeError(error), 'error'); } }
init();
