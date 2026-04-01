import { supabaseConfig, supabaseIsConfigured } from "./supabase-config.js";

let client = null;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
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

export function adminEmails() {
  return (supabaseConfig.adminEmails || []).map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email) {
  return adminEmails().includes(String(email || "").trim().toLowerCase());
}

export function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  if (lower.includes("invalid login credentials")) return "Wrong email or password.";
  if (lower.includes("email not confirmed")) return "Confirm the sign-up email first, then sign in.";
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
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAuthChange(callback) {
  const supabase = getSupabase();
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
  return supabase.auth.onAuthStateChange((_event, session) => callback(session || null));
}

export async function signInWithPassword(email, password) {
  const supabase = getSupabase();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword({ email, password, displayName, roleLabel }) {
  const supabase = getSupabase();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("community.html", window.location.href).toString(),
      data: {
        display_name: displayName || "",
        role_label: roleLabel || ""
      }
    }
  });
}

export async function signOutCurrentUser() {
  const supabase = getSupabase();
  return supabase.auth.signOut();
}

export async function ensureProfile(user, overrides = {}) {
  const supabase = getSupabase();
  if (!supabase || !user?.id) return null;
  const payload = {
    id: user.id,
    email: String(user.email || "").toLowerCase(),
    display_name: overrides.displayName || user.user_metadata?.display_name || user.email?.split('@')[0] || "Member",
    role_label: overrides.roleLabel || user.user_metadata?.role_label || "Member",
    bio: overrides.bio ?? null,
    social_link: overrides.socialLink ?? null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
  return getMyProfile(user.id);
}

export async function getMyProfile(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function updateMyProfile(userId, payload) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: payload.displayName,
      role_label: payload.roleLabel,
      bio: payload.bio,
      social_link: payload.socialLink,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);
  if (error) throw error;
  return getMyProfile(userId);
}

export async function loadMembers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role_label, bio, social_link, is_admin, created_at, updated_at")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return data || [];
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

export async function submitPost({ userId, profile, type, tag, title, content, file }) {
  const supabase = getSupabase();
  let imageUrl = null;
  let imagePath = null;
  if (file) {
    const uploaded = await uploadPostImage(file, userId);
    imageUrl = uploaded.imageUrl;
    imagePath = uploaded.imagePath;
  }

  const isAdmin = Boolean(profile?.is_admin) || isAdminEmail(profile?.email || "");
  const now = new Date().toISOString();

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
    status: isAdmin ? "approved" : "pending",
    published_at: isAdmin ? now : null,
    created_at: now,
    updated_at: now
  });
  if (error) throw error;
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
      other_is_admin: Boolean(other.is_admin),
      unread_count: unreadMap.get(item.id) || 0
    };
  });
}

export async function ensureConversation(meId, otherId) {
  const supabase = getSupabase();
  const [memberA, memberB] = [meId, otherId].sort();
  const id = conversationIdFor(meId, otherId);
  const now = new Date().toISOString();
  const { error } = await supabase.from("conversations").upsert({
    id,
    member_a: memberA,
    member_b: memberB,
    updated_at: now
  }, { onConflict: "id" });
  if (error) throw error;
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
