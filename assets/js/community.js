import {
  getSupabase,
  esc,
  initials,
  formatDate,
  humanizeError,
  onAuthChange,
  getSession,
  signInWithPassword,
  signUpWithPassword,
  signOutCurrentUser,
  ensureProfile,
  updateMyProfile,
  loadMembers,
  submitPost,
  loadPendingPosts,
  moderatePost,
  loadConversationSummaries,
  ensureConversation,
  loadConversationMessages,
  sendConversationMessage,
  markConversationRead
} from "./supabase-client.js";
import { supabaseConfig, supabaseIsConfigured } from "./supabase-config.js";

const ADMIN_EMAIL = "dan.grmusa@gmail.com";

const page = document.body?.dataset?.page || "";

if (page === "community") {
  const $ = (id) => document.getElementById(id);

  const ui = {
    setupNotice: $("setupNotice"),
    authStatus: $("authStatus"),
    logoutBtn: $("logoutBtn"),
    profileSpotlight: $("profileSpotlight"),
    authPanel: $("authPanel"),
    profilePanel: $("profilePanel"),
    composerPanel: $("composerPanel"),
    adminPanel: $("adminPanel"),
    pendingPostsList: $("pendingPostsList"),
    pendingCountBadge: $("pendingCountBadge"),
    signInForm: $("signInForm"),
    signUpForm: $("signUpForm"),
    profileForm: $("profileForm"),
    postForm: $("postForm"),
    membersGrid: $("membersGrid"),
    conversationList: $("conversationList"),
    widgetConversationList: $("widgetConversationList"),
    messageThread: $("messageThread"),
    activeConversationHeader: $("activeConversationHeader"),
    messageForm: $("messageForm"),
    recipientUid: $("recipientUid"),
    directMessageText: $("directMessageText"),
    signInEmail: $("signInEmail"),
    signInPassword: $("signInPassword"),
    signUpName: $("signUpName"),
    signUpRole: $("signUpRole"),
    signUpEmail: $("signUpEmail"),
    signUpPassword: $("signUpPassword"),
    profileName: $("profileName"),
    profileOrganisation: $("profileOrganisation"),
    profileBio: $("profileBio"),
    profileSocial: $("profileSocial"),
    postType: $("postType"),
    postTag: $("postTag"),
    postTitle: $("postTitle"),
    postMessage: $("postMessage"),
    postImage: $("postImage"),
    postImagePreviewWrap: $("postImagePreviewWrap"),
    postImagePreview: $("postImagePreview"),
    clearPostImageBtn: $("clearPostImageBtn"),
    chatWidget: $("chatWidget"),
    chatWidgetToggle: $("chatWidgetToggle"),
    chatWidgetPanel: $("chatWidgetPanel"),
    chatWidgetClose: $("chatWidgetClose"),
    chatUnreadBadge: $("chatUnreadBadge"),
    chatOpenFromPanel: $("chatOpenFromPanel")
  };

  const state = {
    user: null,
    profile: null,
    members: [],
    conversations: [],
    activeConversationId: null,
    activeRecipientId: null,
    activeConversationProfile: null,
    selectedImageFile: null,
    refreshHandle: null,
    authSubscription: null
  };

  function isEmailAdmin(email) {
    return (email || "").trim().toLowerCase() === ADMIN_EMAIL;
  }

  function isAdminUser() {
    return Boolean(state.profile?.is_admin || isEmailAdmin(state.user?.email));
  }

  function friendlyError(error) {
    const raw = (humanizeError(error) || "").trim();
    if (!raw) return "Something went wrong.";
    if (/firestore/i.test(raw)) return "Access is currently unavailable.";
    if (/permission/i.test(raw)) return "Access is currently unavailable.";
    if (/insufficient/i.test(raw)) return "Access is currently unavailable.";
    return raw;
  }

  function setStatus(message, tone = "neutral") {
    if (!ui.authStatus) return;

    const clean = (message || "").trim();
    if (!clean) {
      ui.authStatus.textContent = "";
      ui.authStatus.className = "status-bar hidden";
      return;
    }

    ui.authStatus.textContent = clean;
    ui.authStatus.className = `status-bar ${tone}`.trim();
    ui.authStatus.classList.remove("hidden");
  }

  function showSetupNotice(message) {
    ui.setupNotice?.classList.remove("hidden");
    if (ui.setupNotice) {
      ui.setupNotice.innerHTML = `<strong>Supabase setup</strong><p>${esc(message)}</p>`;
    }
  }

  function hideSetupNotice() {
    ui.setupNotice?.classList.add("hidden");
  }

  function toggleAuthMode(mode) {
    const signInActive = mode !== "signup";
    ui.signInForm?.classList.toggle("hidden", !signInActive);
    ui.signUpForm?.classList.toggle("hidden", signInActive);

    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.authMode === (signInActive ? "signin" : "signup")
      );
    });
  }

  function bindAuthTabs() {
    document.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        toggleAuthMode(button.dataset.authMode || "signin");
      });
    });
  }

  function openChat(force = true) {
    ui.chatWidgetPanel?.classList.toggle("hidden", !force);
    ui.chatWidgetToggle?.setAttribute("aria-expanded", String(force));
  }

  function closeChat() {
    openChat(false);
  }

  function renderProfileSpotlight() {
    if (!ui.profileSpotlight) return;

    if (!state.user || !state.profile) {
      ui.profileSpotlight.className = "profile-spotlight profile-spotlight-empty";
      ui.profileSpotlight.innerHTML = `
        <div class="profile-avatar">EY</div>
        <div>
          <strong>Member area</strong>
          <p>Sign in to access your profile, direct messages and member tools.</p>
        </div>
      `;
      return;
    }

    const adminBadge = isAdminUser() ? `<span class="admin-badge">Admin</span>` : "";

    ui.profileSpotlight.className = "profile-spotlight";
    ui.profileSpotlight.innerHTML = `
      <div class="profile-avatar">${esc(initials(state.profile.display_name || state.user.email || "EY"))}</div>
      <div>
        <strong>${esc(state.profile.display_name || state.user.email || "Member")}</strong>
        <div class="profile-meta">
          <span class="role-pill">${esc(state.profile.role_label || "Member")}</span>
          ${adminBadge}
        </div>
        <p>${esc(state.profile.bio || "Your profile is visible inside the member workspace.")}</p>
        ${
          state.profile.social_link
            ? `<div class="profile-links"><a href="${esc(state.profile.social_link)}" target="_blank" rel="noreferrer">Open link</a></div>`
            : ""
        }
      </div>
    `;
  }

  function renderMembers() {
    if (!ui.membersGrid) return;

    if (!state.members.length) {
      ui.membersGrid.innerHTML = `<div class="empty-state">No members yet.</div>`;
      return;
    }

    ui.membersGrid.innerHTML = state.members
      .map((member) => {
        const canMessage = state.user && member.id !== state.user.id;
        const memberIsAdmin = Boolean(member.is_admin) || isEmailAdmin(member.email);

        return `
          <article class="member-card">
            <div class="member-card-top">
              <div class="member-author-row">
                <div class="member-avatar">${esc(initials(member.display_name || member.email || "Member"))}</div>
                <div>
                  <strong class="member-name">${esc(member.display_name || member.email || "Member")}</strong>
                  <div class="member-role-row">
                    <span class="role-pill">${esc(member.role_label || "Member")}</span>
                    ${memberIsAdmin ? `<span class="admin-badge">Admin</span>` : ""}
                  </div>
                </div>
              </div>
              ${
                canMessage
                  ? `<button type="button" class="member-message-btn" data-member-id="${esc(member.id)}">Message</button>`
                  : ""
              }
            </div>
            ${member.bio ? `<p class="member-bio">${esc(member.bio)}</p>` : ""}
          </article>
        `;
      })
      .join("");

    ui.membersGrid.querySelectorAll("[data-member-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await openConversation(button.dataset.memberId || "");
        openChat(true);
      });
    });
  }

  function renderConversationList() {
    const render = (container) => {
      if (!container) return;

      if (!state.user) {
        container.innerHTML = `<div class="empty-state">Sign in to open messages.</div>`;
        return;
      }

      if (!state.conversations.length) {
        container.innerHTML = `<div class="empty-state">No conversations yet. Open a member profile and click Message.</div>`;
        return;
      }

      container.innerHTML = state.conversations
        .map(
          (item) => `
          <button
            type="button"
            class="conversation-item${item.id === state.activeConversationId ? " active" : ""}"
            data-conversation-id="${esc(item.id)}"
            data-member-id="${esc(item.other_uid)}"
          >
            <span class="conversation-avatar">${esc(initials(item.other_name || "Member"))}</span>
            <span class="conversation-copy">
              <strong>${esc(item.other_name || "Member")}</strong>
              <small>${esc(item.last_message_text || "Open conversation")}</small>
            </span>
            ${item.unread_count ? `<span class="conversation-count">${esc(item.unread_count)}</span>` : ""}
          </button>
        `
        )
        .join("");

      container.querySelectorAll("[data-member-id]").forEach((button) => {
        button.addEventListener("click", async () => {
          await openConversation(
            button.dataset.memberId || "",
            button.dataset.conversationId || ""
          );
          openChat(true);
        });
      });
    };

    render(ui.conversationList);
    render(ui.widgetConversationList);

    const unread = state.conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0);
    if (ui.chatUnreadBadge) {
      ui.chatUnreadBadge.textContent = String(unread);
      ui.chatUnreadBadge.classList.toggle("hidden", unread < 1);
    }
  }

  function renderMessages(messages) {
    if (!ui.messageThread || !ui.activeConversationHeader) return;

    if (!state.activeConversationProfile) {
      ui.activeConversationHeader.innerHTML = `
        <strong>Select a conversation</strong>
        <p>Your recent private messages appear here.</p>
      `;
      ui.messageThread.innerHTML = `<div class="empty-state">Choose a member to open a conversation.</div>`;
      ui.messageForm?.classList.add("hidden");
      return;
    }

    ui.activeConversationHeader.innerHTML = `
      <strong>${esc(state.activeConversationProfile.display_name || "Member")}</strong>
      <p>${esc(state.activeConversationProfile.role_label || "Project member")}</p>
    `;

    ui.messageThread.innerHTML = messages.length
      ? messages
          .map(
            (item) => `
            <div class="message-bubble ${item.sender_id === state.user.id ? "mine" : ""}">
              <div class="message-bubble-meta">
                ${esc(item.sender_id === state.user.id ? "You" : state.activeConversationProfile.display_name || "Member")}
                · ${esc(formatDate(item.created_at))}
              </div>
              <p>${esc(item.body || "")}</p>
            </div>
          `
          )
          .join("")
      : `<div class="empty-state">No messages yet. Write the first one below.</div>`;

    ui.messageThread.scrollTop = ui.messageThread.scrollHeight;
    ui.messageForm?.classList.remove("hidden");
  }

  function renderPendingPosts(items) {
    if (!ui.pendingPostsList || !ui.pendingCountBadge) return;

    ui.pendingCountBadge.textContent = `${items.length} pending`;

    if (!items.length) {
      ui.pendingPostsList.innerHTML = `<div class="empty-state">Nothing is waiting for review.</div>`;
      return;
    }

    ui.pendingPostsList.innerHTML = items
      .map(
        (post) => `
        <article class="moderation-card">
          <div class="moderation-card-top">
            <div>
              <strong>${esc(post.title || "Untitled submission")}</strong>
              <p>${esc(post.author_name || "Member")} · ${esc(post.author_role || "Member")} · ${esc(formatDate(post.created_at))}</p>
            </div>
            <span class="feed-chip">${esc(post.type || "update")}</span>
          </div>
          ${post.tag ? `<p class="feed-tag">#${esc(post.tag)}</p>` : ""}
          <p class="moderation-copy">${esc(post.content || "")}</p>
          ${post.image_url ? `<img class="feed-image" src="${esc(post.image_url)}" alt="${esc(post.title || "Submitted image")}" />` : ""}
          <div class="moderation-actions">
            <button type="button" class="button button-small" data-moderate-action="approve" data-post-id="${esc(post.id)}">Approve</button>
            <button type="button" class="button button-secondary button-small" data-moderate-action="reject" data-post-id="${esc(post.id)}">Reject</button>
          </div>
        </article>
      `
      )
      .join("");

    ui.pendingPostsList.querySelectorAll("[data-moderate-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          setStatus("Updating submission…");
          await moderatePost(
            button.dataset.postId || "",
            button.dataset.moderateAction || "reject",
            state.user.id
          );
          await refreshPendingPosts();
          setStatus("Submission updated.", "success");
        } catch (error) {
          setStatus(friendlyError(error), "error");
        }
      });
    });
  }

  async function refreshMembers() {
    state.members = await loadMembers();
    renderMembers();
  }

  async function refreshPendingPosts() {
    if (!isAdminUser()) {
      ui.adminPanel?.classList.add("hidden");
      return;
    }

    const items = await loadPendingPosts();
    renderPendingPosts(items);
    ui.adminPanel?.classList.remove("hidden");
  }

  async function refreshConversations() {
    if (!state.user) {
      state.conversations = [];
      renderConversationList();
      renderMessages([]);
      return;
    }

    state.conversations = await loadConversationSummaries(state.user.id);
    renderConversationList();
  }

  async function openConversation(otherUserId, conversationId = "") {
    if (!state.user || !otherUserId) return;

    const resolvedId = conversationId || (await ensureConversation(state.user.id, otherUserId));

    state.activeConversationId = resolvedId;
    state.activeRecipientId = otherUserId;
    state.activeConversationProfile =
      state.members.find((item) => item.id === otherUserId) || {
        display_name: "Member",
        role_label: "Project member"
      };

    if (ui.recipientUid) ui.recipientUid.value = otherUserId;

    const messages = await loadConversationMessages(resolvedId);
    renderMessages(messages);
    await markConversationRead(resolvedId, state.user.id);
    await refreshConversations();
  }

  function syncProfileForm() {
    if (!state.profile) return;
    if (ui.profileName) ui.profileName.value = state.profile.display_name || "";
    if (ui.profileOrganisation) ui.profileOrganisation.value = state.profile.role_label || "";
    if (ui.profileBio) ui.profileBio.value = state.profile.bio || "";
    if (ui.profileSocial) ui.profileSocial.value = state.profile.social_link || "";
  }

  function setSignedInState(signedIn) {
    ui.logoutBtn?.classList.toggle("hidden", !signedIn);
    ui.profilePanel?.classList.toggle("hidden", !signedIn);
    ui.composerPanel?.classList.toggle("hidden", !signedIn);
    ui.chatWidget?.classList.toggle("hidden", !signedIn);
    ui.authPanel?.classList.toggle("hidden", signedIn);

    if (!signedIn) {
      ui.adminPanel?.classList.add("hidden");
      closeChat();
    }
  }

  function resetPreview() {
    state.selectedImageFile = null;
    if (ui.postImage) ui.postImage.value = "";
    ui.postImagePreviewWrap?.classList.add("hidden");
    if (ui.postImagePreview) ui.postImagePreview.src = "";
  }

  function bindStaticEvents() {
    bindAuthTabs();

    ui.chatWidgetToggle?.addEventListener("click", () => {
      const nextOpen = ui.chatWidgetPanel?.classList.contains("hidden");
      openChat(Boolean(nextOpen));
    });

    ui.chatWidgetClose?.addEventListener("click", closeChat);
    ui.chatOpenFromPanel?.addEventListener("click", () => openChat(true));

    ui.logoutBtn?.addEventListener("click", async () => {
      await signOutCurrentUser();
    });

    ui.clearPostImageBtn?.addEventListener("click", resetPreview);

    ui.postImage?.addEventListener("change", () => {
      const file = ui.postImage.files?.[0] || null;
      state.selectedImageFile = file;
      if (!file) {
        resetPreview();
        return;
      }
      const url = URL.createObjectURL(file);
      if (ui.postImagePreview) ui.postImagePreview.src = url;
      ui.postImagePreviewWrap?.classList.remove("hidden");
    });

    ui.signInForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        setStatus("Signing in…");
        const { error } = await signInWithPassword(ui.signInEmail.value.trim(), ui.signInPassword.value);
        if (error) throw error;
        setStatus("Signed in.", "success");
        ui.signInForm.reset();
      } catch (error) {
        setStatus(friendlyError(error), "error");
      }
    });

    ui.signUpForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        setStatus("Creating account…");
        const { data, error } = await signUpWithPassword({
          email: ui.signUpEmail.value.trim(),
          password: ui.signUpPassword.value,
          displayName: ui.signUpName.value.trim(),
          roleLabel: ui.signUpRole.value.trim()
        });
        if (error) throw error;
        ui.signUpForm.reset();
        toggleAuthMode("signin");
        if (data?.session) {
          setStatus("Account created and signed in.", "success");
        } else {
          setStatus("Account created. Confirm the email, then sign in.", "success");
        }
      } catch (error) {
        setStatus(friendlyError(error), "error");
      }
    });

    ui.profileForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user) return;
      try {
        setStatus("Saving profile…");
        state.profile = await updateMyProfile(state.user.id, {
          displayName: ui.profileName.value.trim(),
          roleLabel: ui.profileOrganisation.value.trim(),
          bio: ui.profileBio.value.trim(),
          socialLink: ui.profileSocial.value.trim()
        });
        if (isEmailAdmin(state.user.email)) state.profile.is_admin = true;
        renderProfileSpotlight();
        await refreshMembers();
        await refreshPendingPosts();
        setStatus("Profile saved.", "success");
      } catch (error) {
        setStatus(friendlyError(error), "error");
      }
    });

    ui.postForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user || !state.profile) return;
      try {
        setStatus("Submitting post…");
        await submitPost({
          userId: state.user.id,
          profile: { ...state.profile, is_admin: isAdminUser(), email: state.user.email || state.profile.email || "" },
          type: ui.postType.value,
          tag: ui.postTag.value.trim(),
          title: ui.postTitle.value.trim(),
          content: ui.postMessage.value.trim(),
          file: state.selectedImageFile
        });
        ui.postForm.reset();
        resetPreview();
        setStatus(isAdminUser() ? "Post published." : "Post submitted for review.", "success");
        await refreshPendingPosts();
      } catch (error) {
        setStatus(friendlyError(error), "error");
      }
    });

    ui.messageForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!state.user || !state.activeConversationId || !state.activeRecipientId) return;
      try {
        await sendConversationMessage({
          conversationId: state.activeConversationId,
          senderId: state.user.id,
          recipientId: state.activeRecipientId,
          body: ui.directMessageText.value,
          senderName: state.profile?.display_name || state.user.email || "Member"
        });
        ui.directMessageText.value = "";
        await openConversation(state.activeRecipientId, state.activeConversationId);
      } catch (error) {
        setStatus(friendlyError(error), "error");
      }
    });
  }

  async function applySession(session) {
    state.user = session?.user || null;

    if (!state.user) {
      state.profile = null;
      state.conversations = [];
      state.activeConversationId = null;
      state.activeRecipientId = null;
      state.activeConversationProfile = null;
      setSignedInState(false);
      renderProfileSpotlight();
      renderMembers();
      renderConversationList();
      renderMessages([]);
      setStatus("");
      return;
    }

    try {
      setStatus("Loading workspace…");
      state.profile = await ensureProfile(state.user, {});
      if (isEmailAdmin(state.user.email)) state.profile.is_admin = true;
      syncProfileForm();
      setSignedInState(true);
      renderProfileSpotlight();
      await refreshMembers();
      await refreshPendingPosts();
      await refreshConversations();
      setStatus(`Signed in as ${state.user.email}.`, "success");
      if (state.conversations[0] && !state.activeConversationId) {
        await openConversation(state.conversations[0].other_uid, state.conversations[0].id);
      }
    } catch (error) {
      setStatus(friendlyError(error), "error");
    }
  }

  function startRefreshLoop() {
    window.clearInterval(state.refreshHandle);
    state.refreshHandle = window.setInterval(async () => {
      try {
        await refreshMembers();
        if (state.user) {
          await refreshConversations();
          if (state.activeConversationId && state.activeRecipientId) {
            await openConversation(state.activeRecipientId, state.activeConversationId);
          }
          if (isAdminUser()) {
            await refreshPendingPosts();
          }
        }
      } catch (_) {
      }
    }, 8000);
  }

  async function init() {
    bindStaticEvents();

    if (!supabaseIsConfigured(supabaseConfig) || !getSupabase()) {
      showSetupNotice("Open assets/js/supabase-config.js and paste your Supabase Project URL and publishable key.");
      setStatus("Supabase is not configured yet.", "error");
      return;
    }

    hideSetupNotice();
    const session = await getSession();
    await applySession(session);
    startRefreshLoop();
    state.authSubscription = onAuthChange(async (nextSession) => {
      await applySession(nextSession);
    });
  }

  init();
}
