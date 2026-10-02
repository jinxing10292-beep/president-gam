import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const appOrigin = Deno.env.get("APP_ORIGIN") ?? "*";

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error("Missing Supabase Edge Function secrets.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "닉네임 또는 비밀번호가 올바르지 않습니다." }, 400);
  }

  const body = payload && typeof payload === "object" ? payload : {};
  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-zA-Z0-9_가-힣]{2,20}$/.test(username) || password.length < 8 || password.length > 128) {
    return json({ error: "닉네임 또는 비밀번호가 올바르지 않습니다." }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (profileError || !profile) {
    return json({ error: "닉네임 또는 비밀번호가 올바르지 않습니다." }, 401);
  }

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
  const email = userResult.user?.email;
  if (userError || !email) {
    return json({ error: "닉네임 또는 비밀번호가 올바르지 않습니다." }, 401);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return json({ error: "닉네임 또는 비밀번호가 올바르지 않습니다." }, 401);
  }

  return json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
});