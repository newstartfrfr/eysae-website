import {
  getSupabase,
  esc,
  initials,
  formatDate,
  humanizeError,
  getSession,
  onAuthChange,
  getMyProfile,
  loadApprovedPosts
} from "./supabase-client.js";
import { supabaseIsConfigured } from "./supabase-config.js";

const page = document.body?.dataset?.page || "";
if (page !== "feed") {
  // do nothing
} else {
  const $ = (id) => document.getElementById(id);
  const ui = {
    authStatus: $("authStatus"),
    profileSpotlight: $("profileSpotlight"),
    feedList: $("feedList")
  };
  let currentUser = null;
  let currentProfile = null;
  let refreshHandle = null;

  function setStatus(text, tone = "neutral") {
    if (!ui.authStatus) return;
    ui.authStatus.textContent = text;
    ui.authStatus.className = `status-bar ${tone}`.trim();
  }

  function renderSpotlight() {
    if (!currentUser || !currentProfile) {
      ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
      ui.profileSpotlight.innerHTML = `
        <div class="profile-avatar">EY</div>
        <div>
          <strong>Public feed</strong>
          <p>Approved project updates appear here. Sign in from the member workspace to publish or send private messages.</p>
        </div>
      `;
      return;
    }

    ui.profileSpotlight.className = "profile-spotlight";
    ui.profileSpotlight.innerHTML = `
      <div class="profile-avatar">${esc(initials(currentProfile.display_name || currentUser.email || 'EY'))}</div>
      <div>
        <strong>${esc(currentProfile.display_name || currentUser.email || 'Member')}</strong>
        <div class="profile-meta"><span class="role-pill">${esc(currentProfile.role_label || 'Member')}</span>${currentProfile.is_admin ? '<span class="admin-badge">Admin</span>' : ''}</div>
        <p>${esc(currentProfile.bio || 'Signed in and ready to contribute.')}</p>
      </div>
    `;
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
            <div class="feed-avatar">${esc(initials(post.author_name || 'Member'))}</div>
            <div>
              <div class="feed-chip">${esc(post.type || 'update')}</div>
              <strong class="feed-author">${esc(post.author_name || 'Member')}</strong>
              <div class="feed-meta">${esc(post.author_role || 'Member')} · ${esc(formatDate(post.published_at || post.created_at))}</div>
            </div>
          </div>
        </div>
        ${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ''}
        ${post.title ? `<h3 class="feed-title">${esc(post.title)}</h3>` : ''}
        <p class="feed-content">${esc(post.content || '')}</p>
        ${post.image_url ? `<img class="feed-image" src="${esc(post.image_url)}" alt="${esc(post.title || 'Post image')}" />` : ''}
      </article>
    `).join('');
  }

  async function refreshFeed() {
    try {
      const posts = await loadApprovedPosts(60);
      renderFeed(posts);
      setStatus(currentUser ? `Signed in as ${currentUser.email}.` : 'Public view.');
    } catch (error) {
      setStatus(humanizeError(error), 'error');
    }
  }

  async function applySession(session) {
    currentUser = session?.user || null;
    if (!currentUser) {
      currentProfile = null;
      renderSpotlight();
      await refreshFeed();
      return;
    }
    try {
      currentProfile = await getMyProfile(currentUser.id);
    } catch (_) {
      currentProfile = null;
    }
    renderSpotlight();
    await refreshFeed();
  }

  async function init() {
    if (!supabaseIsConfigured() || !getSupabase()) {
      setStatus('Supabase is not configured yet.', 'error');
      ui.feedList.innerHTML = '<div class="empty-state">Add your Supabase Project URL and publishable key in assets/js/supabase-config.js.</div>';
      return;
    }
    await applySession(await getSession());
    onAuthChange(async (session) => applySession(session));
    refreshHandle = window.setInterval(refreshFeed, 10000);
  }

  init();
}
