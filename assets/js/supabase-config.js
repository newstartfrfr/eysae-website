export const supabaseConfig = {
  url: "https://dnzysgfiqcyhlguticcw.supabase.co",
  anonKey: "sb_publishable_HW5twbWGZFLP9fhL2aWjUw_gFgs_S0O",
  postImageBucket: "post-images",
  adminEmails: ["krizo19@gmail.com"]
};

export function supabaseIsConfigured(config = supabaseConfig) {
  return Boolean(config?.url && config?.anonKey);
}
