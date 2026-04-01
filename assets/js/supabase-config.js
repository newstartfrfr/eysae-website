export const supabaseConfig = {
  url: "",
  anonKey: "",
  postImageBucket: "post-images",
  adminEmails: ["krizo19@gmail.com"]
};

export function supabaseIsConfigured(config = supabaseConfig) {
  return Boolean(config?.url && config?.anonKey);
}
