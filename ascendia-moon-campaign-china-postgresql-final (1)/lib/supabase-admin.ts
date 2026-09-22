import { createClient } from "@supabase/supabase-js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("服务尚未配置完成。");
  return value;
}

export function getSupabaseAdmin() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "ascendia-moon-server" } }
    }
  );
}

export function getSupabaseAuthClient() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "ascendia-moon-auth" } }
    }
  );
}
