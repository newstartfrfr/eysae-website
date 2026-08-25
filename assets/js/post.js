import {
  getSupabase,
  esc,
  safeExternalUrl,
  initials,
  formatDate,
  humanizeError,
  getSession,
  onAuthChange,
  ensureProfile,
  loadApprovedPost,
  loadPostComments,
  addPostComment,
  deletePostComment,
  loadPostEngagement,
  togglePostLike
} from "./supabase-client.js";
import { supabaseIsConfigured } from "./supabase-config.js";

if (document.body?.dataset?.page === "post") {
  const $ = (id) => document.getElementById(id);
  const ui = {
    status: $("postStatus"), article: $("postArticle"), type: $("postType"), tag: $("postTag"), title: $("postTitle"),
    byline: $("postByline"), image: $("postImage"), content: $("postContent"), authorAvatar: $("postAuthorAvatar"),
    author: $("postAuthor"), authorRole: $("postAuthorRole"), copyLink: $("copyStoryLink"),
    likeButton: $("likeStoryBtn"), likeCount: $("likeCount"), commentCount: $("commentCount"),
    commentStatus: $("commentStatus"), commentForm: $("commentForm"), commentBody: $("commentBody"),
    commentCharacterCount: $("commentCharacterCount"), commentSignIn: $("commentSignIn"), commentList: $("commentList")
  };
  const state = { postId: "", post: null, user: null, profile: null, comments: [], liked: false, socialReady: true };
  const typeLabels = { blog: "Blog", photo: "Photo story", update: "Project update", notice: "Notice", discussion: "Discussion" };

  function showError(message) {
    ui.status.className = "container post-loading post-error";
    ui.status.innerHTML = `<strong>Story unavailable</strong><p>${esc(message)}</p><a class="button button-secondary" href="feed.html">Return to all stories</a>`;
  }

  function renderParagraphs(content) {
    const paragraphs = String(content || "").split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
    return paragraphs.map((paragraph) => `<p>${esc(paragraph).replaceAll("\n", "<br />")}</p>`).join("");
  }

  function renderPost(post) {
    const imageUrl = safeExternalUrl(post.image_url);
    document.title = `${post.title || "EYSAE Story"} — EYSAE`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", String(post.content || "").replace(/\s+/g, " ").slice(0, 155));
    ui.type.textContent = typeLabels[post.type] || "Story";
    ui.tag.textContent = post.tag ? `#${post.tag}` : "";
    ui.title.textContent = post.title || "Untitled community story";
    ui.byline.textContent = `${post.author_name || "EYSAE member"} · ${formatDate(post.published_at || post.created_at)}`;
    ui.content.innerHTML = renderParagraphs(post.content);
    const authorAvatarUrl = safeExternalUrl(post.author_avatar_url);
    ui.authorAvatar.innerHTML = authorAvatarUrl ? `<img class="avatar-image" src="${esc(authorAvatarUrl)}" alt="${esc(post.author_name || "Member")} profile photograph" />` : esc(initials(post.author_name || "EY"));
    ui.author.textContent = post.author_name || "EYSAE member";
    ui.authorRole.textContent = post.author_role || "Project member";
    if (imageUrl) {
      ui.image.src = imageUrl;
      ui.image.alt = post.title || "EYSAE community story";
      ui.image.classList.remove("hidden");
    }
    ui.status.classList.add("hidden");
    ui.article.classList.remove("hidden");
  }

  function setCommentStatus(message, tone = "neutral") {
    const clean = String(message || "").trim();
    ui.commentStatus.textContent = clean;
    ui.commentStatus.className = clean ? `status-bar ${tone}` : "status-bar hidden";
  }

  function avatarMarkup(url, name) {
    const safeUrl = safeExternalUrl(url);
    return safeUrl ? `<img class="avatar-image" src="${esc(safeUrl)}" alt="" />` : esc(initials(name || "EY"));
  }

  function renderSocialState() {
    ui.commentForm?.classList.toggle("hidden", !state.user || !state.socialReady);
    ui.commentSignIn?.classList.toggle("hidden", Boolean(state.user) || !state.socialReady);
    if (ui.likeButton) {
      ui.likeButton.disabled = !state.user || !state.socialReady;
      ui.likeButton.classList.toggle("is-liked", state.liked);
      ui.likeButton.setAttribute("aria-pressed", String(state.liked));
      const icon = ui.likeButton.querySelector("span");
      if (icon) icon.textContent = state.liked ? "♥" : "♡";
    }
  }

  function renderComments() {
    if (!ui.commentList) return;
    if (!state.socialReady) {
      ui.commentList.innerHTML = `<div class="comment-empty"><strong>Discussion is being prepared</strong><p>The story remains available while the social database update is completed.</p></div>`;
      return;
    }
    if (!state.comments.length) {
      ui.commentList.innerHTML = `<div class="comment-empty"><strong>Start the conversation</strong><p>Be the first person to respond to this story.</p></div>`;
      return;
    }
    ui.commentList.innerHTML = state.comments.map((comment) => `<article class="comment-card">
      <div class="comment-avatar">${avatarMarkup(comment.author_avatar_url, comment.author_name)}</div>
      <div class="comment-copy"><div class="comment-meta"><strong>${esc(comment.author_name || "Member")}</strong><span>${esc(comment.author_role || "EYSAE member")}</span><time>${esc(formatDate(comment.created_at))}</time>${state.user?.id === comment.author_id ? `<button type="button" data-delete-comment="${esc(comment.id)}">Delete</button>` : ""}</div><p>${esc(comment.body || "").replaceAll("\n", "<br />")}</p></div>
    </article>`).join("");
    ui.commentList.querySelectorAll("[data-delete-comment]").forEach((button) => button.addEventListener("click", async () => {
      if (!window.confirm("Delete this comment?")) return;
      try {
        await deletePostComment(button.dataset.deleteComment || "", state.user.id);
        await refreshSocial();
        setCommentStatus("Comment deleted.", "success");
      } catch (error) { setCommentStatus(humanizeError(error), "error"); }
    }));
  }

  async function refreshSocial() {
    if (!state.postId) return;
    try {
      const [comments, engagement] = await Promise.all([
        loadPostComments(state.postId),
        loadPostEngagement(state.postId, state.user?.id || null)
      ]);
      state.comments = comments;
      state.liked = engagement.liked;
      state.socialReady = true;
      ui.likeCount.textContent = String(engagement.likes);
      ui.commentCount.textContent = String(engagement.comments);
      setCommentStatus("");
    } catch (error) {
      state.socialReady = false;
      setCommentStatus("Likes and comments will appear after the community database update is applied.", "neutral");
    }
    renderSocialState();
    renderComments();
  }

  async function applySession(session) {
    state.user = session?.user || null;
    state.profile = null;
    if (state.user) {
      try { state.profile = await ensureProfile(state.user, {}); } catch (_) {}
    }
    renderSocialState();
    if (state.post) await refreshSocial();
  }

  async function init() {
    state.postId = new URLSearchParams(window.location.search).get("id") || "";
    if (!state.postId) { showError("No story was selected."); return; }
    if (!supabaseIsConfigured() || !getSupabase()) { showError("Community services are not configured yet."); return; }
    try {
      const post = await loadApprovedPost(state.postId);
      if (!post) { showError("This story is not public or no longer exists."); return; }
      state.post = post;
      renderPost(post);
      try {
        await applySession(await getSession());
      } catch (error) {
        state.user = null;
        state.profile = null;
        renderSocialState();
        setCommentStatus(humanizeError(error), "error");
      }
      onAuthChange(async (session) => applySession(session));
    } catch (error) { showError(humanizeError(error)); }
  }

  ui.likeButton?.addEventListener("click", async () => {
    if (!state.user || !state.socialReady) return;
    ui.likeButton.disabled = true;
    try {
      await togglePostLike(state.postId, state.user.id);
      await refreshSocial();
    } catch (error) { setCommentStatus(humanizeError(error), "error"); }
    finally { ui.likeButton.disabled = false; }
  });

  ui.commentBody?.addEventListener("input", () => { ui.commentCharacterCount.textContent = String(ui.commentBody.value.length); });
  ui.commentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.user || !state.profile || !state.socialReady) return;
    const submitButton = ui.commentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      await addPostComment({ postId: state.postId, userId: state.user.id, profile: state.profile, body: ui.commentBody.value });
      ui.commentForm.reset();
      ui.commentCharacterCount.textContent = "0";
      await refreshSocial();
      setCommentStatus("Comment published.", "success");
    } catch (error) { setCommentStatus(humanizeError(error), "error"); }
    finally { submitButton.disabled = false; }
  });

  ui.copyLink?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      ui.copyLink.textContent = "Link copied";
      window.setTimeout(() => { ui.copyLink.textContent = "Copy story link"; }, 1800);
    } catch (_) {
      ui.copyLink.textContent = "Copy the URL from your browser";
    }
  });

  init();
}
