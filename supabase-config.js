window.SUPABASE_CONFIG = Object.freeze({
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  clientUrl: "https://esm.sh/@supabase/supabase-js@2",
  isConfigured() {
    return Boolean(this.url && this.anonKey && !this.url.includes("YOUR_") && !this.anonKey.includes("YOUR_"));
  }
});