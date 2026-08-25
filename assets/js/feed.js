import {
  getSupabase,
  esc,
  safeExternalUrl,
  initials,
  formatDate,
  humanizeError,
  getSession,
  onAuthChange,
  getMyProfile,
  loadApprovedPosts
} from "./supabase-client.js";
import { supabaseIsConfigured } from "./supabase-config.js";

if (document.body?.dataset?.page === "feed") {
  const $ = (id) => document.getElementById(id);
  const ui = {
    authStatus: $("authStatus"), profileSpotlight: $("profileSpotlight"), feedList: $("feedList"),
    feedSearch: $("feedSearch"), feedCount: $("feedCount"), blogCount: $("blogCount")
  };
  const state = { user: null, profile: null, posts: [], filter: "all", search: "", refreshHandle: null };

  const typeLabels = { blog: "Blog", photo: "Photo story", update: "Project update", notice: "Notice", discussion: "Discussion" };

  function setStatus(text, tone = "neutral") {
    if (!ui.authStatus) return;
    ui.authStatus.textContent = text;
    ui.authStatus.className = `stories-status ${tone}`.trim();
  }

  function renderSpotlight() {
    if (!state.user || !state.profile) {
      ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
      ui.profileSpotlight.innerHTML = `<div class="profile-avatar">EY</div><div><strong>Join the conversation</strong><p>Members can publish stories and photographs from the community workspace.</p><a class="text-link" href="community.html">Open member workspace →</a></div>`;
      return;
    }
    ui.profileSpotlight.className = "profile-spotlight";
    ui.profileSpotlight.innerHTML = `<div class="profile-avatar">${esc(initials(state.profile.display_name || state.user.email || "EY"))}</div><div><strong>${esc(state.profile.display_name || state.user.email || "Member")}</strong><div class="profile-meta"><span class="role-pill">${esc(state.profile.role_label || "Member")}</span>${state.profile.is_admin ? `<span class="admin-badge">Editor</span>` : ""}</div><p>Signed in and ready to contribute.</p><a class="text-link" href="community.html">Open your workspace →</a></div>`;
  }

  function excerpt(value, max = 230) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
  }

  function visiblePosts() {
    const query = state.search.toLowerCase();
    return state.posts.filter((post) => {
      if (state.filter !== "all" && post.type !== state.filter) return false;
      if (!query) return true;
      return [post.title, post.content, post.tag, post.author_name, post.author_role, post.type].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }

  function renderFeed() {
    const posts = visiblePosts();
    if (!posts.length) {
      ui.feedList.innerHTML = `<div class="empty-state stories-empty"><strong>${state.posts.length ? "No matching stories" : "The first stories are on their way"}</strong><p>${state.posts.length ? "Try another search term or category." : "Approved community posts will appear here."}</p></div>`;
      return;
    }
    ui.feedList.innerHTML = posts.map((post, index) => {
      const imageUrl = safeExternalUrl(post.image_url);
      const href = `post.html?id=${encodeURIComponent(post.id)}`;
      const prominent = post.type === "blog" && index === 0 ? " story-card-featured" : "";
      return `<article class="story-card story-card-${esc(post.type || "update")}${prominent}">
        ${imageUrl ? `<a class="story-card-media" href="${href}" aria-label="Read ${esc(post.title || "story")}"><img src="${esc(imageUrl)}" alt="${esc(post.title || "EYSAE community story")}" loading="lazy" /></a>` : `<a class="story-card-media story-card-media-placeholder" href="${href}" aria-label="Read ${esc(post.title || "story")}"><span>${esc(initials(post.type || "EY"))}</span></a>`}
        <div class="story-card-body">
          <div class="story-card-kicker"><span class="feed-chip">${esc(typeLabels[post.type] || "Story")}</span>${post.tag ? `<span>#${esc(post.tag)}</span>` : ""}</div>
          <h3><a href="${href}">${esc(post.title || "Untitled community story")}</a></h3>
          <p>${esc(excerpt(post.content))}</p>
          <div class="story-card-footer"><div class="story-author"><span class="story-author-avatar">${esc(initials(post.author_name || "Member"))}</span><span><strong>${esc(post.author_name || "Member")}</strong><small>${esc(post.author_role || "EYSAE member")} · ${esc(formatDate(post.published_at || post.created_at))}</small></span></div><a class="story-read-link" href="${href}">Read story <span>→</span></a></div>
        </div>
      </article>`;
    }).join("");
  }

  function renderMetrics() {
    if (ui.feedCount) ui.feedCount.textContent = String(state.posts.length);
    if (ui.blogCount) ui.blogCount.textContent = String(state.posts.filter((post) => post.type === "blog").length);
  }

  async function refreshFeed() {
    try {
      state.posts = await loadApprovedPosts(100);
      renderMetrics();
      renderFeed();
      setStatus(state.user ? `Signed in as ${state.user.email}` : "Public stories");
    } catch (error) {
      setStatus(humanizeError(error), "error");
      ui.feedList.innerHTML = `<div class="empty-state stories-empty"><strong>Stories could not be loaded</strong><p>Please try again shortly.</p></div>`;
    }
  }

  async function applySession(session) {
    state.user = session?.user || null;
    state.profile = null;
    if (state.user) {
      try { state.profile = await getMyProfile(state.user.id); } catch (_) {}
    }
    renderSpotlight();
    await refreshFeed();
  }

  function bindFilters() {
    document.querySelectorAll("[data-feed-filter]").forEach((button) => button.addEventListener("click", () => {
      state.filter = button.dataset.feedFilter || "all";
      document.querySelectorAll("[data-feed-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderFeed();
    }));
    ui.feedSearch?.addEventListener("input", () => { state.search = ui.feedSearch.value.trim(); renderFeed(); });
  }

  async function init() {
    bindFilters();
    if (!supabaseIsConfigured() || !getSupabase()) {
      setStatus("Community services are not configured yet.", "error");
      ui.feedList.innerHTML = `<div class="empty-state stories-empty"><strong>Setup required</strong><p>Add the Supabase connection and run supabase/schema.sql.</p></div>`;
      return;
    }
    await applySession(await getSession());
    onAuthChange(async (session) => applySession(session));
    state.refreshHandle = window.setInterval(() => { if (!document.hidden) refreshFeed(); }, 60000);
  }

  init();
}
