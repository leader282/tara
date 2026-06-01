import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

let cachedClient: SupabaseClient | null = null;

function readFirstEnv(keys: string[]): string | null {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function requireEnv(keys: string[], label: string): string {
  const value = readFirstEnv(keys);
  if (!value) {
    throw new Error(`Missing ${label} environment variable.`);
  }
  return value;
}

export function getCronSecret(): string {
  return requireEnv(["CRON_SECRET", "EDGE_FUNCTION_SECRET"], "CRON_SECRET or EDGE_FUNCTION_SECRET");
}

export function isAuthorizedServiceRequest(request: Request, expectedSecret: string): boolean {
  const cronSecretHeader = request.headers.get("x-cron-secret")?.trim();
  if (cronSecretHeader && cronSecretHeader === expectedSecret) {
    return true;
  }

  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) {
    return false;
  }

  const bearerPrefix = /^Bearer\s+/i;
  if (!bearerPrefix.test(authorization)) {
    return false;
  }

  const token = authorization.replace(bearerPrefix, "").trim();
  return token.length > 0 && token === expectedSecret;
}

export function createSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = requireEnv(["SUPABASE_URL"], "SUPABASE_URL");
  const serviceRoleKey = requireEnv(
    ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"],
    "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)",
  );

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "tara-edge-notifications",
      },
    },
  });

  return cachedClient;
}
