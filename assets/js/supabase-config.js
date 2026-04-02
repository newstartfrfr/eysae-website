export const supabaseConfig = {
  url: "https://dnzysgfiqcyhlguticcw.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuenlzZ2ZpcWN5aGxndXRpY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNzA3ODAsImV4cCI6MjA5MDY0Njc4MH0.HA_6sdN0fuaRMvzA361Al08pljKKtpU_NIYvFG2y08A",
  postImageBucket: "post-images",
  adminEmails: ["dan.grmusa@gmail.com"]
};

export function supabaseIsConfigured(config = supabaseConfig) {
  return Boolean(config?.url && config?.anonKey);
}
