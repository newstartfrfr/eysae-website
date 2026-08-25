import { getSupabase, esc, safeExternalUrl, initials, formatDate, humanizeError, loadApprovedPost } from "./supabase-client.js";
import { supabaseIsConfigured } from "./supabase-config.js";

if (document.body?.dataset?.page === "post") {
  const $ = (id) => document.getElementById(id);
  const ui = {
    status: $("postStatus"), article: $("postArticle"), type: $("postType"), tag: $("postTag"), title: $("postTitle"),
    byline: $("postByline"), image: $("postImage"), content: $("postContent"), authorAvatar: $("postAuthorAvatar"),
    author: $("postAuthor"), authorRole: $("postAuthorRole"), copyLink: $("copyStoryLink")
  };
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
    ui.authorAvatar.textContent = initials(post.author_name || "EY");
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

  async function init() {
    const postId = new URLSearchParams(window.location.search).get("id") || "";
    if (!postId) { showError("No story was selected."); return; }
    if (!supabaseIsConfigured() || !getSupabase()) { showError("Community services are not configured yet."); return; }
    try {
      const post = await loadApprovedPost(postId);
      if (!post) { showError("This story is not public or no longer exists."); return; }
      renderPost(post);
    } catch (error) { showError(humanizeError(error)); }
  }

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
