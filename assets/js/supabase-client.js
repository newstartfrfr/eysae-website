import { supabaseConfig, supabaseIsConfigured } from "./supabase-config.js";

let client = null;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function getSupabase() {
  if (client) return client;
  if (!supabaseIsConfigured()) return null;
  if (!window.supabase?.createClient) return null;

  client = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return client;
}

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function safeExternalUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch (_) {
    return "";
  }
}

export function initials(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.length ? parts.map((part) => part[0]?.toUpperCase() || "").join("") : "EY";
}

export function formatDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(document.documentElement.lang || "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function conversationIdFor(userA, userB) {
  return [String(userA || ""), String(userB || "")].sort().join("__");
}

export function safeFileName(fileName) {
  const base = String(fileName || "image")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return base || `image-${Date.now()}.jpg`;
}

export function humanizeError(error) {
  const message = String(error?.message || error?.error_description || "Something went wrong.");
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) return "The community service cannot be reached. Check that the Supabase project is active and try again.";
  if (lower.includes("invalid login credentials")) return "Wrong email or password.";
  if (lower.includes("email not confirmed")) return "Confirm the sign-up email first, then sign in.";
  if (lower.includes("password should be at least")) return "Use a password with at least 8 characters.";
  if (lower.includes("rate limit")) return "Too many attempts. Wait a moment and try again.";
  if (lower.includes("user already registered") || lower.includes("already been registered")) return "This email address is already registered.";
  if (lower.includes("row-level security") || lower.includes("permission denied") || lower.includes("insufficient permissions")) return "Permissions are blocking this action. Run the Supabase admin fix SQL, then sign out and sign in again.";
  if (lower.includes("duplicate key")) return "This record already exists.";
  if (lower.includes("jwt")) return "The current session is not valid. Refresh the page and sign in again.";
  if (lower.includes("bucket") && lower.includes("not found")) return `Create the storage bucket named "${supabaseConfig.postImageBucket}" in Supabase Storage.`;
  return message;
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

export function onAuthChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange((event, session) => {
    // Supabase recommends keeping the auth callback itself synchronous. The
    // deferred task can safely perform profile queries without holding its lock.
    window.setTimeout(() => callback(session || null, event), 0);
  });
}

export async function signInWithPassword(email, password) {
  const supabase = getSupabase();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword({ email, password, displayName, roleLabel }) {
  const supabase = getSupabase();
  const redirectUrl = new URL("community.html", window.location.href);
  redirectUrl.search = "";
  redirectUrl.hash = "";
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl.toString(),
      data: {
        display_name: displayName || "",
        role_label: roleLabel || ""
      }
    }
  });
}

export async function requestPasswordReset(email) {
  const supabase = getSupabase();
  const redirectUrl = new URL("community.html", window.location.href);
  redirectUrl.search = "?mode=recovery";
  redirectUrl.hash = "";
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl.toString() });
}

export async function updateCurrentPassword(password) {
  const supabase = getSupabase();
  return supabase.auth.updateUser({ password });
}

export async function resendConfirmationEmail(email) {
  const supabase = getSupabase();
  const redirectUrl = new URL("community.html", window.location.href);
  redirectUrl.search = "";
  redirectUrl.hash = "";
  return supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl.toString() } });
}

export async function signOutCurrentUser() {
  const supabase = getSupabase();
  return supabase.auth.signOut();
}

export async function ensureProfile(user, overrides = {}) {
  const supabase = getSupabase();
  if (!supabase || !user?.id) return null;
  const existing = await getMyProfile(user.id);
  if (existing) return existing;
  const payload = {
    id: user.id,
    email: String(user.email || "").toLowerCase(),
    display_name: overrides.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || "Member",
    role_label: overrides.roleLabel || user.user_metadata?.role_label || "Member",
    bio: overrides.bio ?? null,
    social_link: overrides.socialLink ?? null,
    updated_at: new Date().toISOString()
  };
  if (Object.hasOwn(overrides, "avatarUrl")) payload.avatar_url = overrides.avatarUrl;
  if (Object.hasOwn(overrides, "avatarPath")) payload.avatar_path = overrides.avatarPath;

  const { error } = await supabase.from("profiles").insert(payload);
  if (error && error.code !== "23505") throw error;
  return getMyProfile(user.id);
}

export async function getMyProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role_label, bio, social_link, is_admin, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Avatar columns were added after the first public release. Keep sign-in and
  // profile editing functional while an owner is still applying the migration.
  const avatarResult = await supabase
    .from("profiles")
    .select("avatar_url, avatar_path")
    .eq("id", userId)
    .maybeSingle();
  return avatarResult.error ? data : { ...data, ...(avatarResult.data || {}) };
}

export async function updateMyProfile(userId, payload) {
  const supabase = getSupabase();
  const update = {
    display_name: payload.displayName,
    role_label: payload.roleLabel,
    bio: payload.bio,
    social_link: payload.socialLink,
    updated_at: new Date().toISOString()
  };
  if (Object.hasOwn(payload, "avatarUrl")) update.avatar_url = payload.avatarUrl;
  if (Object.hasOwn(payload, "avatarPath")) update.avatar_path = payload.avatarPath;
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);
  if (error) throw error;
  return getMyProfile(userId);
}

export async function loadMembers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role_label, bio, social_link, is_admin, created_at, updated_at")
    .order("display_name", { ascending: true });
  if (error) throw error;
  const members = data || [];
  const avatarResult = await supabase.from("profiles").select("id, avatar_url");
  if (avatarResult.error) return members;
  const avatarMap = new Map((avatarResult.data || []).map((item) => [item.id, item.avatar_url]));
  return members.map((member) => ({ ...member, avatar_url: avatarMap.get(member.id) || null }));
}

export async function uploadProfileAvatar(file, userId) {
  if (!file) return { avatarUrl: null, avatarPath: null };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Profile image size must stay below 2 MB.");
  const supabase = getSupabase();
  const path = `${userId}/profile/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(supabaseConfig.postImageBucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(supabaseConfig.postImageBucket).getPublicUrl(path);
  return { avatarPath: path, avatarUrl: data?.publicUrl || null };
}

export async function uploadPostImage(file, userId) {
  const supabase = getSupabase();
  if (!file) return { imageUrl: null, imagePath: null };
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image size must stay below 5 MB.");
  }

  const path = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(supabaseConfig.postImageBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(supabaseConfig.postImageBucket).getPublicUrl(path);
  return {
    imagePath: path,
    imageUrl: data?.publicUrl || null
  };
}

export async function loadApprovedPosts(limit = 60) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function loadApprovedPost(postId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function loadMyPosts(userId, limit = 100) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function loadPendingPosts(limit = 50) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function submitPost({ userId, profile, type, tag, title, content, file, intent = "submit" }) {
  const supabase = getSupabase();
  let imageUrl = null;
  let imagePath = null;
  if (file) {
    const uploaded = await uploadPostImage(file, userId);
    imageUrl = uploaded.imageUrl;
    imagePath = uploaded.imagePath;
  }

  const isAdmin = Boolean(profile?.is_admin);
  const now = new Date().toISOString();
  const status = intent === "draft" ? "draft" : isAdmin ? "approved" : "pending";

  const { error } = await supabase.from("posts").insert({
    author_id: userId,
    author_name: profile?.display_name || "Member",
    author_role: profile?.role_label || "Member",
    type: type || "update",
    tag: tag || null,
    title: title || null,
    content,
    image_url: imageUrl,
    image_path: imagePath,
    status,
    published_at: status === "approved" ? now : null,
    created_at: now,
    updated_at: now
  });
  if (error) throw error;
}

export async function removePostImage(imagePath) {
  if (!imagePath) return;
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(supabaseConfig.postImageBucket)
    .remove([imagePath]);
  if (error) throw error;
}

export async function updateMyPost({
  postId,
  userId,
  profile,
  type,
  tag,
  title,
  content,
  file,
  currentImageUrl,
  currentImagePath,
  removeImage = false,
  intent = "submit"
}) {
  const supabase = getSupabase();
  let imageUrl = removeImage ? null : currentImageUrl || null;
  let imagePath = removeImage ? null : currentImagePath || null;

  if (file) {
    const uploaded = await uploadPostImage(file, userId);
    imageUrl = uploaded.imageUrl;
    imagePath = uploaded.imagePath;
  }

  const isAdmin = Boolean(profile?.is_admin);
  const now = new Date().toISOString();
  const status = intent === "draft" ? "draft" : isAdmin ? "approved" : "pending";
  const { error } = await supabase
    .from("posts")
    .update({
      author_name: profile?.display_name || "Member",
      author_role: profile?.role_label || "Member",
      type: type || "update",
      tag: tag || null,
      title: title || null,
      content,
      image_url: imageUrl,
      image_path: imagePath,
      status,
      published_at: status === "approved" ? now : null,
      reviewed_at: null,
      reviewer_id: null,
      updated_at: now
    })
    .eq("id", postId)
    .eq("author_id", userId);
  if (error) throw error;

  if ((file || removeImage) && currentImagePath && currentImagePath !== imagePath) {
    try {
      await removePostImage(currentImagePath);
    } catch (_) {
      // The post is already saved. Orphaned media can be cleaned up by an administrator.
    }
  }
}

export async function deleteMyPost({ postId, userId, imagePath }) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId);
  if (error) throw error;
  if (imagePath) {
    try {
      await removePostImage(imagePath);
    } catch (_) {
      // Do not report a failed media cleanup as a failed post deletion.
    }
  }
}

export async function moderatePost(postId, action, reviewerId) {
  const supabase = getSupabase();
  const nextStatus = action === "approve" ? "approved" : "rejected";
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: nextStatus,
      reviewer_id: reviewerId,
      reviewed_at: now,
      published_at: action === "approve" ? now : null,
      updated_at: now
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function loadConversationSummaries(userId) {
  const supabase = getSupabase();
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, member_a, member_b, last_message_text, last_sender_id, updated_at")
    .or(`member_a.eq.${userId},member_b.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  const otherIds = [...new Set((conversations || []).map((item) => item.member_a === userId ? item.member_b : item.member_a).filter(Boolean))];
  let profiles = [];
  if (otherIds.length) {
    const result = await supabase
      .from("profiles")
      .select("id, display_name, role_label, is_admin")
      .in("id", otherIds);
    if (result.error) throw result.error;
    profiles = result.data || [];
    const avatarResult = await supabase.from("profiles").select("id, avatar_url").in("id", otherIds);
    if (!avatarResult.error) {
      const avatarMap = new Map((avatarResult.data || []).map((item) => [item.id, item.avatar_url]));
      profiles = profiles.map((profile) => ({ ...profile, avatar_url: avatarMap.get(profile.id) || null }));
    }
  }
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  const unreadResult = await supabase
    .from("messages")
    .select("conversation_id")
    .eq("recipient_id", userId)
    .is("read_at", null)
    .limit(500);
  if (unreadResult.error) throw unreadResult.error;
  const unreadMap = new Map();
  (unreadResult.data || []).forEach((item) => {
    unreadMap.set(item.conversation_id, (unreadMap.get(item.conversation_id) || 0) + 1);
  });

  return (conversations || []).map((item) => {
    const otherId = item.member_a === userId ? item.member_b : item.member_a;
    const other = profileMap.get(otherId) || {};
    return {
      ...item,
      other_uid: otherId,
      other_name: other.display_name || "Member",
      other_role: other.role_label || "Member",
      other_avatar_url: other.avatar_url || null,
      other_is_admin: Boolean(other.is_admin),
      unread_count: unreadMap.get(item.id) || 0
    };
  });
}

export async function ensureConversation(meId, otherId) {
  const supabase = getSupabase();
  const [memberA, memberB] = [meId, otherId].sort();
  const id = conversationIdFor(meId, otherId);
  const existing = await supabase.from("conversations").select("id").eq("id", id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return id;
  const now = new Date().toISOString();
  const { error } = await supabase.from("conversations").insert({
    id,
    member_a: memberA,
    member_b: memberB,
    updated_at: now
  });
  // Two members can open the same new conversation at the same moment.
  if (error && error.code !== "23505") throw error;
  return id;
}

export async function loadConversationMessages(conversationId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, recipient_id, body, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function markConversationRead(conversationId, userId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

export async function sendConversationMessage({ conversationId, senderId, recipientId, body, senderName }) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const text = String(body || "").trim();
  if (!text) return;

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    recipient_id: recipientId,
    body: text,
    created_at: now
  });
  if (messageError) throw messageError;

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      last_message_text: text,
      last_sender_id: senderId,
      updated_at: now
    })
    .eq("id", conversationId);
  if (conversationError) throw conversationError;
}

export async function checkCommunityService() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("posts").select("id").eq("status", "approved").limit(1);
  if (error) throw error;
  return true;
}

export async function loadPostComments(postId, limit = 100) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, author_id, author_name, author_role, author_avatar_url, body, created_at, updated_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function addPostComment({ postId, userId, profile, body }) {
  const supabase = getSupabase();
  const text = String(body || "").trim();
  if (!text) throw new Error("Write a comment first.");
  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    author_id: userId,
    author_name: profile?.display_name || "Member",
    author_role: profile?.role_label || "Member",
    author_avatar_url: profile?.avatar_url || null,
    body: text
  });
  if (error) throw error;
}

export async function deletePostComment(commentId, userId) {
  const supabase = getSupabase();
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId).eq("author_id", userId);
  if (error) throw error;
}

export async function loadPostEngagement(postId, userId = null) {
  const supabase = getSupabase();
  const [likesResult, commentsResult, mineResult] = await Promise.all([
    supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", postId),
    userId
      ? supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (mineResult.error) throw mineResult.error;
  return { likes: likesResult.count || 0, comments: commentsResult.count || 0, liked: Boolean(mineResult.data) };
}

export async function togglePostLike(postId, userId) {
  const supabase = getSupabase();
  const existing = await supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    const { error } = await supabase.from("post_likes").delete().eq("id", existing.data.id).eq("user_id", userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
  return true;
}
