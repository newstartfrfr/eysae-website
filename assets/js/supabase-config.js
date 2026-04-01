export const supabaseConfig = {
  url: "",
  anonKey: "",
  postImageBucket: "post-images",
  adminEmails: ["dan.grmusa@gmail.com"]
};

export function supabaseIsConfigured(config = supabaseConfig) {
  return Boolean(config?.url && config?.anonKey);
}
