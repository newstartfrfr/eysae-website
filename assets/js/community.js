import {
  getSupabase,
  esc,
  safeExternalUrl,
  initials,
  formatDate,
  humanizeError,
  onAuthChange,
  getSession,
  signInWithPassword,
  signUpWithPassword,
  requestPasswordReset,
  updateCurrentPassword,
  resendConfirmationEmail,
  signOutCurrentUser,
  ensureProfile,
  updateMyProfile,
  uploadProfileAvatar,
  removePostImage,
  loadMembers,
  loadMyPosts,
  submitPost,
  updateMyPost,
  deleteMyPost,
  loadPendingPosts,
  moderatePost,
  loadConversationSummaries,
  ensureConversation,
  loadConversationMessages,
  sendConversationMessage,
  markConversationRead,
  checkCommunityService
} from "./supabase-client.js";
import { supabaseConfig, supabaseIsConfigured } from "./supabase-config.js";

if (document.body?.dataset?.page === "community") {
  const $ = (id) => document.getElementById(id);
  const ui = {
    setupNotice: $("setupNotice"), authStatus: $("authStatus"), logoutBtn: $("logoutBtn"),
    serviceStatusDot: $("serviceStatusDot"), serviceStatusText: $("serviceStatusText"),
    profileSpotlight: $("profileSpotlight"), authPanel: $("authPanel"), memberWorkspace: $("memberWorkspace"),
    profilePanel: $("profilePanel"), composerPanel: $("composerPanel"), myPostsPanel: $("myPostsPanel"),
    adminPanel: $("adminPanel"), pendingPostsList: $("pendingPostsList"), pendingCountBadge: $("pendingCountBadge"),
    signInForm: $("signInForm"), signUpForm: $("signUpForm"), passwordResetForm: $("passwordResetForm"),
    passwordRecoveryPanel: $("passwordRecoveryPanel"), passwordRecoveryForm: $("passwordRecoveryForm"),
    forgotPasswordBtn: $("forgotPasswordBtn"), passwordResetBackBtn: $("passwordResetBackBtn"), resendConfirmationBtn: $("resendConfirmationBtn"),
    profileForm: $("profileForm"), postForm: $("postForm"),
    membersGrid: $("membersGrid"), memberCountBadge: $("memberCountBadge"), myPostsList: $("myPostsList"), myPostCount: $("myPostCount"),
    conversationList: $("conversationList"), widgetConversationList: $("widgetConversationList"), messageThread: $("messageThread"),
    activeConversationHeader: $("activeConversationHeader"), messageForm: $("messageForm"), recipientUid: $("recipientUid"),
    directMessageText: $("directMessageText"), signInEmail: $("signInEmail"), signInPassword: $("signInPassword"),
    signUpName: $("signUpName"), signUpRole: $("signUpRole"), signUpEmail: $("signUpEmail"), signUpPassword: $("signUpPassword"),
    signUpPasswordConfirm: $("signUpPasswordConfirm"), passwordResetEmail: $("passwordResetEmail"),
    newPassword: $("newPassword"), newPasswordConfirm: $("newPasswordConfirm"),
    profileName: $("profileName"), profileOrganisation: $("profileOrganisation"), profileBio: $("profileBio"), profileSocial: $("profileSocial"),
    profileAvatarInput: $("profileAvatarInput"), profileAvatarPreview: $("profileAvatarPreview"), removeProfileAvatarBtn: $("removeProfileAvatarBtn"),
    postType: $("postType"), postTag: $("postTag"), postTitle: $("postTitle"), postMessage: $("postMessage"), postImage: $("postImage"),
    postTitleCount: $("postTitleCount"), postMessageCount: $("postMessageCount"), postImagePreviewWrap: $("postImagePreviewWrap"),
    postImagePreview: $("postImagePreview"), postImageName: $("postImageName"), clearPostImageBtn: $("clearPostImageBtn"),
    cancelEditPostBtn: $("cancelEditPostBtn"), composerEyebrow: $("composerEyebrow"), composerTitle: $("composerTitle"),
    composerIntro: $("composerIntro"), postSubmitBtn: $("postSubmitBtn"), postModerationNote: $("postModerationNote"),
    chatWidget: $("chatWidget"), chatWidgetToggle: $("chatWidgetToggle"), chatWidgetPanel: $("chatWidgetPanel"),
    chatWidgetClose: $("chatWidgetClose"), chatUnreadBadge: $("chatUnreadBadge"), chatOpenFromPanel: $("chatOpenFromPanel")
  };

  const state = {
    user: null, profile: null, members: [], myPosts: [], conversations: [],
    activeConversationId: null, activeRecipientId: null, activeConversationProfile: null,
    selectedImageFile: null, editingPost: null, removeCurrentImage: false, previewObjectUrl: "",
    selectedAvatarFile: null, removeAvatar: false, avatarPreviewUrl: "", recoveryMode: false,
    refreshHandle: null, authSubscription: null, workspaceView: "create"
  };

  function isAdminUser() {
    return Boolean(state.profile?.is_admin);
  }

  function friendlyError(error) {
    const raw = (humanizeError(error) || "").trim();
    if (!raw) return "Something went wrong.";
    if (/permission|insufficient/i.test(raw)) return "Access is currently unavailable. Check the Supabase policies and sign in again.";
    return raw;
  }

  function setStatus(message, tone = "neutral") {
    if (!ui.authStatus) return;
    const clean = String(message || "").trim();
    ui.authStatus.textContent = clean;
    ui.authStatus.className = clean ? `status-bar ${tone}`.trim() : "status-bar hidden";
  }

  function setServiceStatus(stateName, text) {
    if (ui.serviceStatusText) ui.serviceStatusText.textContent = text;
    if (ui.serviceStatusDot) ui.serviceStatusDot.className = `live-dot service-${stateName}`;
  }

  function avatarContent(url, fallback, alt = "") {
    const safeUrl = safeExternalUrl(url);
    return safeUrl
      ? `<img class="avatar-image" src="${esc(safeUrl)}" alt="${esc(alt)}" />`
      : esc(initials(fallback || "EY"));
  }

  function setFormBusy(form, busy) {
    form?.querySelectorAll("button, input, select, textarea").forEach((element) => {
      element.disabled = Boolean(busy);
    });
    form?.classList.toggle("is-busy", Boolean(busy));
  }

  function showSetupNotice(message) {
    ui.setupNotice?.classList.remove("hidden");
    if (ui.setupNotice) ui.setupNotice.innerHTML = `<strong>Supabase setup</strong><p>${esc(message)}</p>`;
  }

  function toggleAuthMode(mode) {
    const signInActive = mode !== "signup";
    ui.signInForm?.classList.toggle("hidden", !signInActive);
    ui.signUpForm?.classList.toggle("hidden", signInActive);
    ui.passwordResetForm?.classList.add("hidden");
    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
      const active = button.dataset.authMode === (signInActive ? "signin" : "signup");
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function showPasswordReset() {
    ui.signInForm?.classList.add("hidden");
    ui.signUpForm?.classList.add("hidden");
    ui.passwordResetForm?.classList.remove("hidden");
    document.querySelectorAll("[data-auth-mode]").forEach((button) => button.classList.remove("active"));
    if (ui.passwordResetEmail && ui.signInEmail?.value) ui.passwordResetEmail.value = ui.signInEmail.value;
  }

  function selectWorkspaceView(view) {
    state.workspaceView = view || "create";
    document.querySelectorAll("[data-workspace-view]").forEach((button) => {
      const active = button.dataset.workspaceView === state.workspaceView;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-workspace-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.workspacePanel !== state.workspaceView);
    });
  }

  function openChat(force = true) {
    if (!state.user) return;
    ui.chatWidgetPanel?.classList.toggle("hidden", !force);
    ui.chatWidgetToggle?.setAttribute("aria-expanded", String(force));
  }

  function renderProfileSpotlight() {
    if (!ui.profileSpotlight) return;
    if (!state.user || !state.profile) {
      ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
      ui.profileSpotlight.innerHTML = `<div class="profile-avatar">EY</div><div><strong>Your place in the project</strong><p>Sign in to create stories, manage submissions and contact other members.</p></div>`;
      return;
    }
    const socialUrl = safeExternalUrl(state.profile.social_link);
    ui.profileSpotlight.className = "profile-spotlight";
    ui.profileSpotlight.innerHTML = `
      <div class="profile-avatar">${avatarContent(state.profile.avatar_url, state.profile.display_name || state.user.email, `${state.profile.display_name || "Member"} profile photograph`)}</div>
      <div><strong>${esc(state.profile.display_name || state.user.email || "Member")}</strong>
        <div class="profile-meta"><span class="role-pill">${esc(state.profile.role_label || "Member")}</span>${isAdminUser() ? `<span class="admin-badge">Editor</span>` : ""}</div>
        <p>${esc(state.profile.bio || "Complete your profile and introduce yourself to the network.")}</p>
        ${socialUrl ? `<div class="profile-links"><a href="${esc(socialUrl)}" target="_blank" rel="noreferrer">Visit profile ↗</a></div>` : ""}
      </div>`;
  }

  function renderMembers() {
    if (!ui.membersGrid) return;
    if (ui.memberCountBadge) ui.memberCountBadge.textContent = `${state.members.length} ${state.members.length === 1 ? "member" : "members"}`;
    if (!state.user) {
      ui.membersGrid.innerHTML = `<div class="empty-state">Sign in to see the member network.</div>`;
      return;
    }
    if (!state.members.length) {
      ui.membersGrid.innerHTML = `<div class="empty-state">No member profiles are available yet.</div>`;
      return;
    }
    ui.membersGrid.innerHTML = state.members.map((member) => {
      const socialUrl = safeExternalUrl(member.social_link);
      const canMessage = member.id !== state.user.id;
      return `<article class="member-card compact-member-card">
        <div class="member-card-top"><div class="member-author-row"><div class="member-avatar">${avatarContent(member.avatar_url, member.display_name, `${member.display_name || "Member"} profile photograph`)}</div><div><strong class="member-name">${esc(member.display_name || "Member")}</strong><div class="member-role-row"><span class="role-pill">${esc(member.role_label || "Member")}</span>${member.is_admin ? `<span class="admin-badge">Editor</span>` : ""}</div></div></div></div>
        ${member.bio ? `<p class="member-bio">${esc(member.bio)}</p>` : ""}
        <div class="member-actions">${canMessage ? `<button type="button" class="member-message-btn" data-member-id="${esc(member.id)}">Message</button>` : `<span class="section-mini-note">Your profile</span>`}${socialUrl ? `<a href="${esc(socialUrl)}" target="_blank" rel="noreferrer">Profile ↗</a>` : ""}</div>
      </article>`;
    }).join("");
    ui.membersGrid.querySelectorAll("[data-member-id]").forEach((button) => button.addEventListener("click", async () => {
      await openConversation(button.dataset.memberId || "");
      openChat(true);
    }));
  }

  function statusLabel(status) {
    return ({ draft: "Draft", pending: "In review", approved: "Published", rejected: "Needs revision" })[status] || "Draft";
  }

  function renderMyPosts() {
    if (!ui.myPostsList) return;
    if (ui.myPostCount) ui.myPostCount.textContent = String(state.myPosts.length);
    if (!state.myPosts.length) {
      ui.myPostsList.innerHTML = `<div class="empty-state my-posts-empty"><strong>No posts yet</strong><p>Create a blog, photo story or project update when you are ready.</p><button type="button" class="button button-small" data-empty-create>Create your first post</button></div>`;
      ui.myPostsList.querySelector("[data-empty-create]")?.addEventListener("click", () => selectWorkspaceView("create"));
      return;
    }
    ui.myPostsList.innerHTML = state.myPosts.map((post) => {
      const excerpt = String(post.content || "").replace(/\s+/g, " ").slice(0, 150);
      return `<article class="my-post-card">
        ${post.image_url ? `<img class="my-post-thumb" src="${esc(post.image_url)}" alt="" />` : `<div class="my-post-thumb my-post-thumb-empty">${esc(initials(post.type || "post"))}</div>`}
        <div class="my-post-copy"><div class="my-post-meta"><span class="content-status status-${esc(post.status || "draft")}">${esc(statusLabel(post.status))}</span><span>${esc(post.type || "update")}</span><span>${esc(formatDate(post.updated_at || post.created_at))}</span></div><h3>${esc(post.title || "Untitled story")}</h3><p>${esc(excerpt)}${String(post.content || "").length > 150 ? "…" : ""}</p></div>
        <div class="my-post-actions">${post.status === "approved" ? `<a class="button button-secondary button-small" href="post.html?id=${encodeURIComponent(post.id)}">View</a>` : ""}<button type="button" class="button button-secondary button-small" data-edit-post="${esc(post.id)}">Edit</button><button type="button" class="button button-quiet-danger button-small" data-delete-post="${esc(post.id)}">Delete</button></div>
      </article>`;
    }).join("");
    ui.myPostsList.querySelectorAll("[data-edit-post]").forEach((button) => button.addEventListener("click", () => startEditing(button.dataset.editPost || "")));
    ui.myPostsList.querySelectorAll("[data-delete-post]").forEach((button) => button.addEventListener("click", () => removePost(button.dataset.deletePost || "")));
  }

  function renderConversationList() {
    const render = (container) => {
      if (!container) return;
      if (!state.user) { container.innerHTML = `<div class="empty-state">Sign in to open messages.</div>`; return; }
      if (!state.conversations.length) { container.innerHTML = `<div class="empty-state">No conversations yet. Choose a member and select Message.</div>`; return; }
      container.innerHTML = state.conversations.map((item) => `<button type="button" class="conversation-item${item.id === state.activeConversationId ? " active" : ""}" data-conversation-id="${esc(item.id)}" data-member-id="${esc(item.other_uid)}"><span class="conversation-avatar">${avatarContent(item.other_avatar_url, item.other_name, "")}</span><span class="conversation-copy"><strong>${esc(item.other_name || "Member")}</strong><small>${esc(item.last_message_text || "Open conversation")}</small></span>${item.unread_count ? `<span class="conversation-count">${esc(item.unread_count)}</span>` : ""}</button>`).join("");
      container.querySelectorAll("[data-member-id]").forEach((button) => button.addEventListener("click", async () => {
        await openConversation(button.dataset.memberId || "", button.dataset.conversationId || "");
        openChat(true);
      }));
    };
    render(ui.conversationList);
    render(ui.widgetConversationList);
    const unread = state.conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
    if (ui.chatUnreadBadge) { ui.chatUnreadBadge.textContent = String(unread); ui.chatUnreadBadge.classList.toggle("hidden", unread < 1); }
  }

  function renderMessages(messages) {
    if (!ui.messageThread || !ui.activeConversationHeader) return;
    if (!state.activeConversationProfile) {
      ui.activeConversationHeader.innerHTML = `<strong>Select a conversation</strong><p>Choose a member to begin.</p>`;
      ui.messageThread.innerHTML = `<div class="empty-state">No conversation selected.</div>`;
      ui.messageForm?.classList.add("hidden");
      return;
    }
    ui.activeConversationHeader.innerHTML = `<div><strong>${esc(state.activeConversationProfile.display_name || "Member")}</strong><p>${esc(state.activeConversationProfile.role_label || "Project member")}</p></div>`;
    ui.messageThread.innerHTML = messages.length ? messages.map((item) => `<div class="message-bubble ${item.sender_id === state.user.id ? "mine" : ""}"><div class="message-bubble-meta">${esc(item.sender_id === state.user.id ? "You" : state.activeConversationProfile.display_name || "Member")} · ${esc(formatDate(item.created_at))}</div><p>${esc(item.body || "")}</p></div>`).join("") : `<div class="empty-state">Write the first message below.</div>`;
    ui.messageThread.scrollTop = ui.messageThread.scrollHeight;
    ui.messageForm?.classList.remove("hidden");
  }

  function renderPendingPosts(items) {
    if (!ui.pendingPostsList || !ui.pendingCountBadge) return;
    ui.pendingCountBadge.textContent = `${items.length} pending`;
    if (!items.length) { ui.pendingPostsList.innerHTML = `<div class="empty-state">Nothing is waiting for review.</div>`; return; }
    ui.pendingPostsList.innerHTML = items.map((post) => `<article class="moderation-card"><div class="moderation-card-top"><div><strong>${esc(post.title || "Untitled submission")}</strong><p>${esc(post.author_name || "Member")} · ${esc(post.author_role || "Member")} · ${esc(formatDate(post.created_at))}</p></div><span class="feed-chip">${esc(post.type || "update")}</span></div>${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ""}<p class="moderation-copy">${esc(post.content || "")}</p>${post.image_url ? `<img class="feed-image" src="${esc(post.image_url)}" alt="${esc(post.title || "Submitted image")}" />` : ""}<div class="moderation-actions"><button type="button" class="button button-small" data-moderate-action="approve" data-post-id="${esc(post.id)}">Publish</button><button type="button" class="button button-secondary button-small" data-moderate-action="reject" data-post-id="${esc(post.id)}">Return for revision</button></div></article>`).join("");
    ui.pendingPostsList.querySelectorAll("[data-moderate-action]").forEach((button) => button.addEventListener("click", async () => {
      try {
        setStatus("Updating submission…");
        await moderatePost(button.dataset.postId || "", button.dataset.moderateAction || "reject", state.user.id);
        await Promise.all([refreshPendingPosts(), refreshMyPosts()]);
        setStatus(button.dataset.moderateAction === "approve" ? "Story published." : "Submission returned for revision.", "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
    }));
  }

  async function refreshMembers() { state.members = await loadMembers(); renderMembers(); }
  async function refreshMyPosts() { if (!state.user) return; state.myPosts = await loadMyPosts(state.user.id); renderMyPosts(); }
  async function refreshPendingPosts() {
    if (!isAdminUser()) { ui.adminPanel?.classList.add("hidden"); return; }
    renderPendingPosts(await loadPendingPosts());
    ui.adminPanel?.classList.remove("hidden");
  }
  async function refreshConversations() {
    if (!state.user) { state.conversations = []; renderConversationList(); renderMessages([]); return; }
    state.conversations = await loadConversationSummaries(state.user.id);
    renderConversationList();
  }

  async function openConversation(otherUserId, conversationId = "") {
    if (!state.user || !otherUserId) return;
    const resolvedId = conversationId || await ensureConversation(state.user.id, otherUserId);
    state.activeConversationId = resolvedId;
    state.activeRecipientId = otherUserId;
    state.activeConversationProfile = state.members.find((item) => item.id === otherUserId) || { display_name: "Member", role_label: "Project member" };
    if (ui.recipientUid) ui.recipientUid.value = otherUserId;
    renderMessages(await loadConversationMessages(resolvedId));
    await markConversationRead(resolvedId, state.user.id);
    await refreshConversations();
  }

  function updateCounters() {
    if (ui.postTitleCount) ui.postTitleCount.textContent = String(ui.postTitle?.value.length || 0);
    if (ui.postMessageCount) ui.postMessageCount.textContent = String(ui.postMessage?.value.length || 0);
  }

  function clearPreview({ markRemoval = true } = {}) {
    if (state.previewObjectUrl) URL.revokeObjectURL(state.previewObjectUrl);
    state.previewObjectUrl = "";
    state.selectedImageFile = null;
    if (ui.postImage) ui.postImage.value = "";
    if (markRemoval && state.editingPost?.image_url) state.removeCurrentImage = true;
    ui.postImagePreviewWrap?.classList.add("hidden");
    if (ui.postImagePreview) ui.postImagePreview.removeAttribute("src");
  }

  function showPreview(url, label) {
    if (ui.postImagePreview) ui.postImagePreview.src = url;
    if (ui.postImageName) ui.postImageName.textContent = label || "Cover photograph";
    ui.postImagePreviewWrap?.classList.remove("hidden");
  }

  function resetEditor() {
    clearPreview({ markRemoval: false });
    state.editingPost = null;
    state.removeCurrentImage = false;
    ui.postForm?.reset();
    if (ui.postType) ui.postType.value = "blog";
    ui.cancelEditPostBtn?.classList.add("hidden");
    if (ui.composerEyebrow) ui.composerEyebrow.textContent = "NEW STORY";
    if (ui.composerTitle) ui.composerTitle.textContent = "Create a community post";
    if (ui.composerIntro) ui.composerIntro.textContent = "Turn an activity, result or photograph into a clear project story.";
    if (ui.postSubmitBtn) ui.postSubmitBtn.textContent = isAdminUser() ? "Publish now" : "Submit for review";
    updateCounters();
  }

  function startEditing(postId) {
    const post = state.myPosts.find((item) => item.id === postId);
    if (!post) return;
    resetEditor();
    state.editingPost = post;
    if (ui.postType) ui.postType.value = post.type || "update";
    if (ui.postTag) ui.postTag.value = post.tag || "";
    if (ui.postTitle) ui.postTitle.value = post.title || "";
    if (ui.postMessage) ui.postMessage.value = post.content || "";
    if (post.image_url) showPreview(post.image_url, "Current cover photograph");
    ui.cancelEditPostBtn?.classList.remove("hidden");
    if (ui.composerEyebrow) ui.composerEyebrow.textContent = "EDIT STORY";
    if (ui.composerTitle) ui.composerTitle.textContent = "Update your post";
    if (ui.composerIntro) ui.composerIntro.textContent = post.status === "approved" && !isAdminUser() ? "Changes to a published post will be reviewed again." : "Make your changes and choose how to save them.";
    if (ui.postSubmitBtn) ui.postSubmitBtn.textContent = isAdminUser() ? "Update publication" : "Submit changes";
    updateCounters();
    selectWorkspaceView("create");
    ui.composerPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function removePost(postId) {
    const post = state.myPosts.find((item) => item.id === postId);
    if (!post || !window.confirm(`Delete “${post.title || "this post"}”? This cannot be undone.`)) return;
    try {
      setStatus("Deleting post…");
      await deleteMyPost({ postId: post.id, userId: state.user.id, imagePath: post.image_path });
      if (state.editingPost?.id === post.id) resetEditor();
      await refreshMyPosts();
      setStatus("Post deleted.", "success");
    } catch (error) { setStatus(friendlyError(error), "error"); }
  }

  function clearAvatarPreview() {
    if (state.avatarPreviewUrl) URL.revokeObjectURL(state.avatarPreviewUrl);
    state.avatarPreviewUrl = "";
    state.selectedAvatarFile = null;
    if (ui.profileAvatarInput) ui.profileAvatarInput.value = "";
  }

  function renderAvatarEditor() {
    if (!ui.profileAvatarPreview) return;
    const avatarUrl = state.removeAvatar ? "" : state.avatarPreviewUrl || state.profile?.avatar_url || "";
    ui.profileAvatarPreview.innerHTML = avatarContent(avatarUrl, state.profile?.display_name || state.user?.email, "Profile photograph preview");
    ui.removeProfileAvatarBtn?.classList.toggle("hidden", !avatarUrl);
  }

  function syncProfileForm() {
    if (!state.profile) return;
    ui.profileName.value = state.profile.display_name || "";
    ui.profileOrganisation.value = state.profile.role_label || "";
    ui.profileBio.value = state.profile.bio || "";
    ui.profileSocial.value = state.profile.social_link || "";
    clearAvatarPreview();
    state.removeAvatar = false;
    renderAvatarEditor();
  }

  function setSignedInState(signedIn) {
    ui.logoutBtn?.classList.toggle("hidden", !signedIn);
    ui.memberWorkspace?.classList.toggle("hidden", !signedIn);
    ui.chatWidget?.classList.toggle("hidden", !signedIn);
    ui.authPanel?.classList.toggle("hidden", signedIn || state.recoveryMode);
    ui.passwordRecoveryPanel?.classList.toggle("hidden", !state.recoveryMode);
    if (ui.chatOpenFromPanel) ui.chatOpenFromPanel.disabled = !signedIn;
    if (!signedIn) { ui.adminPanel?.classList.add("hidden"); openChat(false); }
  }

  function bindStaticEvents() {
    document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => toggleAuthMode(button.dataset.authMode || "signin")));
    document.querySelectorAll("[data-workspace-view]").forEach((button) => button.addEventListener("click", () => selectWorkspaceView(button.dataset.workspaceView || "create")));
    document.querySelectorAll("[data-open-create]").forEach((button) => button.addEventListener("click", () => { resetEditor(); selectWorkspaceView("create"); }));
    ui.chatWidgetToggle?.addEventListener("click", () => openChat(ui.chatWidgetPanel?.classList.contains("hidden")));
    ui.chatWidgetClose?.addEventListener("click", () => openChat(false));
    ui.chatOpenFromPanel?.addEventListener("click", () => openChat(true));
    ui.logoutBtn?.addEventListener("click", async () => {
      ui.logoutBtn.disabled = true;
      try {
        setStatus("Signing out…");
        const { error } = await signOutCurrentUser();
        if (error) throw error;
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { ui.logoutBtn.disabled = false; }
    });
    ui.forgotPasswordBtn?.addEventListener("click", showPasswordReset);
    ui.passwordResetBackBtn?.addEventListener("click", () => toggleAuthMode("signin"));
    document.querySelectorAll("[data-password-toggle]").forEach((button) => button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle || "");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    }));
    ui.cancelEditPostBtn?.addEventListener("click", resetEditor);
    ui.clearPostImageBtn?.addEventListener("click", () => {
      if (state.selectedImageFile && state.editingPost?.image_url && !state.removeCurrentImage) {
        clearPreview({ markRemoval: false });
        showPreview(state.editingPost.image_url, "Current cover photograph");
        return;
      }
      clearPreview({ markRemoval: true });
    });
    ui.postTitle?.addEventListener("input", updateCounters);
    ui.postMessage?.addEventListener("input", updateCounters);
    ui.postImage?.addEventListener("change", () => {
      const file = ui.postImage.files?.[0] || null;
      if (!file) return;
      clearPreview({ markRemoval: false });
      state.selectedImageFile = file;
      state.removeCurrentImage = false;
      state.previewObjectUrl = URL.createObjectURL(file);
      showPreview(state.previewObjectUrl, `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
    });
    ui.profileAvatarInput?.addEventListener("change", () => {
      const file = ui.profileAvatarInput.files?.[0] || null;
      if (!file) return;
      clearAvatarPreview();
      state.selectedAvatarFile = file;
      state.removeAvatar = false;
      state.avatarPreviewUrl = URL.createObjectURL(file);
      renderAvatarEditor();
    });
    ui.removeProfileAvatarBtn?.addEventListener("click", () => {
      clearAvatarPreview();
      state.removeAvatar = true;
      renderAvatarEditor();
    });

    ui.signInForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFormBusy(ui.signInForm, true);
      try {
        setStatus("Signing in…");
        const { error } = await signInWithPassword(ui.signInEmail.value.trim(), ui.signInPassword.value);
        if (error) throw error;
        ui.signInForm.reset();
        ui.resendConfirmationBtn?.classList.add("hidden");
      } catch (error) {
        setStatus(friendlyError(error), "error");
        ui.resendConfirmationBtn?.classList.toggle("hidden", !/email not confirmed/i.test(String(error?.message || "")));
      } finally { setFormBusy(ui.signInForm, false); }
    });

    ui.signUpForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (ui.signUpPassword.value !== ui.signUpPasswordConfirm.value) {
        setStatus("The two passwords do not match.", "error");
        ui.signUpPasswordConfirm.focus();
        return;
      }
      setFormBusy(ui.signUpForm, true);
      try {
        setStatus("Creating account…");
        const { data, error } = await signUpWithPassword({ email: ui.signUpEmail.value.trim(), password: ui.signUpPassword.value, displayName: ui.signUpName.value.trim(), roleLabel: ui.signUpRole.value.trim() });
        if (error) throw error;
        ui.signUpForm.reset();
        toggleAuthMode("signin");
        setStatus(data?.session ? "Account created and signed in." : "Account created. Confirm your email, then sign in.", "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { setFormBusy(ui.signUpForm, false); }
    });

    ui.passwordResetForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFormBusy(ui.passwordResetForm, true);
      try {
        setStatus("Sending recovery link…");
        const { error } = await requestPasswordReset(ui.passwordResetEmail.value.trim());
        if (error) throw error;
        toggleAuthMode("signin");
        setStatus("Recovery link sent. Check your inbox and spam folder.", "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { setFormBusy(ui.passwordResetForm, false); }
    });

    ui.resendConfirmationBtn?.addEventListener("click", async () => {
      const email = ui.signInEmail?.value.trim();
      if (!email) { setStatus("Enter your email address first.", "error"); return; }
      try {
        setStatus("Sending confirmation email…");
        const { error } = await resendConfirmationEmail(email);
        if (error) throw error;
        setStatus("Confirmation email sent. Check your inbox and spam folder.", "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
    });

    ui.passwordRecoveryForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (ui.newPassword.value !== ui.newPasswordConfirm.value) {
        setStatus("The two passwords do not match.", "error");
        return;
      }
      setFormBusy(ui.passwordRecoveryForm, true);
      try {
        setStatus("Updating password…");
        const { error } = await updateCurrentPassword(ui.newPassword.value);
        if (error) throw error;
        ui.passwordRecoveryForm.reset();
        state.recoveryMode = false;
        history.replaceState(null, "", new URL("community.html", window.location.href).toString());
        await applySession(await getSession(), "PASSWORD_UPDATED");
        setStatus("Password updated. You are signed in.", "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { setFormBusy(ui.passwordRecoveryForm, false); }
    });

    ui.profileForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user) return;
      setFormBusy(ui.profileForm, true);
      let uploadedAvatarPath = "";
      try {
        setStatus("Saving profile…");
        let avatarUrl = state.removeAvatar ? null : state.profile.avatar_url || null;
        let avatarPath = state.removeAvatar ? null : state.profile.avatar_path || null;
        if (state.selectedAvatarFile) {
          const uploaded = await uploadProfileAvatar(state.selectedAvatarFile, state.user.id);
          avatarUrl = uploaded.avatarUrl;
          avatarPath = uploaded.avatarPath;
          uploadedAvatarPath = uploaded.avatarPath || "";
        }
        const previousAvatarPath = state.profile.avatar_path || "";
        const profileUpdate = { displayName: ui.profileName.value.trim(), roleLabel: ui.profileOrganisation.value.trim(), bio: ui.profileBio.value.trim(), socialLink: ui.profileSocial.value.trim() };
        if (state.removeAvatar || state.selectedAvatarFile) {
          profileUpdate.avatarUrl = avatarUrl;
          profileUpdate.avatarPath = avatarPath;
        }
        state.profile = await updateMyProfile(state.user.id, profileUpdate);
        if ((state.removeAvatar || state.selectedAvatarFile) && previousAvatarPath && previousAvatarPath !== avatarPath) {
          try { await removePostImage(previousAvatarPath); } catch (_) {}
        }
        clearAvatarPreview();
        state.removeAvatar = false;
        renderAvatarEditor();
        renderProfileSpotlight();
        await refreshMembers();
        setStatus("Profile saved.", "success");
      } catch (error) {
        if (uploadedAvatarPath) { try { await removePostImage(uploadedAvatarPath); } catch (_) {} }
        setStatus(friendlyError(error), "error");
      } finally { setFormBusy(ui.profileForm, false); }
    });

    ui.postForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user || !state.profile) return;
      const intent = event.submitter?.value === "draft" ? "draft" : "submit";
      setFormBusy(ui.postForm, true);
      try {
        setStatus(state.editingPost ? "Saving changes…" : intent === "draft" ? "Saving draft…" : "Submitting story…");
        const common = { userId: state.user.id, profile: { ...state.profile, is_admin: isAdminUser(), email: state.user.email || "" }, type: ui.postType.value, tag: ui.postTag.value.trim(), title: ui.postTitle.value.trim(), content: ui.postMessage.value.trim(), file: state.selectedImageFile, intent };
        if (state.editingPost) {
          await updateMyPost({ ...common, postId: state.editingPost.id, currentImageUrl: state.editingPost.image_url, currentImagePath: state.editingPost.image_path, removeImage: state.removeCurrentImage });
        } else {
          await submitPost(common);
        }
        const success = intent === "draft" ? "Draft saved." : isAdminUser() ? "Story published." : "Story submitted for review.";
        resetEditor();
        await Promise.all([refreshMyPosts(), refreshPendingPosts()]);
        selectWorkspaceView("posts");
        setStatus(success, "success");
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { setFormBusy(ui.postForm, false); }
    });

    ui.messageForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user || !state.activeConversationId || !state.activeRecipientId) return;
      setFormBusy(ui.messageForm, true);
      try {
        await sendConversationMessage({ conversationId: state.activeConversationId, senderId: state.user.id, recipientId: state.activeRecipientId, body: ui.directMessageText.value, senderName: state.profile?.display_name || "Member" });
        ui.directMessageText.value = "";
        await openConversation(state.activeRecipientId, state.activeConversationId);
      } catch (error) { setStatus(friendlyError(error), "error"); }
      finally { setFormBusy(ui.messageForm, false); }
    });
  }

  async function applySession(session, event = "") {
    state.user = session?.user || null;
    const recoveryRequested = event === "PASSWORD_RECOVERY" || new URLSearchParams(window.location.search).get("mode") === "recovery";
    if (!state.user) {
      state.recoveryMode = false;
      state.profile = null; state.members = []; state.myPosts = []; state.conversations = [];
      state.activeConversationId = null; state.activeRecipientId = null; state.activeConversationProfile = null;
      resetEditor(); setSignedInState(false); renderProfileSpotlight(); renderMembers(); renderMyPosts(); renderConversationList(); renderMessages([]);
      if (recoveryRequested) setStatus("This recovery link is invalid or has expired. Request a new one.", "error");
      else setStatus("");
      return;
    }
    if (recoveryRequested) {
      state.recoveryMode = true;
      setSignedInState(false);
      setStatus("Recovery link verified. Choose a new password.", "success");
      return;
    }
    state.recoveryMode = false;
    try {
      setStatus("Loading your workspace…");
      state.profile = await ensureProfile(state.user, {});
      syncProfileForm(); setSignedInState(true); renderProfileSpotlight(); resetEditor(); selectWorkspaceView("create");
      await Promise.all([refreshMembers(), refreshMyPosts(), refreshPendingPosts(), refreshConversations()]);
      setServiceStatus("online", "Community service online");
      setStatus(`Signed in as ${state.user.email}.`, "success");
    } catch (error) {
      if (/fetch|network|reach/i.test(String(error?.message || ""))) setServiceStatus("offline", "Community service unavailable");
      setStatus(friendlyError(error), "error");
    }
  }

  function startRefreshLoop() {
    window.clearInterval(state.refreshHandle);
    state.refreshHandle = window.setInterval(async () => {
      if (!state.user || document.hidden) return;
      try {
        await Promise.all([refreshMembers(), refreshConversations()]);
        if (state.activeConversationId && state.activeRecipientId) await openConversation(state.activeRecipientId, state.activeConversationId);
        if (isAdminUser()) await refreshPendingPosts();
      } catch (_) {}
    }, 15000);
  }

  async function init() {
    bindStaticEvents();
    updateCounters();
    if (!supabaseIsConfigured(supabaseConfig) || !getSupabase()) {
      showSetupNotice("Add your Supabase Project URL and publishable key, then run supabase/schema.sql.");
      setStatus("Community services are not configured yet.", "error");
      return;
    }
    ui.setupNotice?.classList.add("hidden");
    try {
      await checkCommunityService();
      setServiceStatus("online", "Community service online");
    } catch (error) {
      setServiceStatus("offline", "Community service unavailable");
      setStatus(friendlyError(error), "error");
    }
    try {
      await applySession(await getSession());
    } catch (error) {
      setSignedInState(false);
      setServiceStatus("offline", "Community service unavailable");
      setStatus(friendlyError(error), "error");
    }
    startRefreshLoop();
    state.authSubscription = onAuthChange(async (nextSession, event) => applySession(nextSession, event));
  }

  init();
}
