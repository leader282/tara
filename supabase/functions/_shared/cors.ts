const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-cron-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

export function corsPreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  return new Response("ok", { headers: BASE_CORS_HEADERS });
}

export function jsonResponse(payload: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  for (const [key, value] of Object.entries(BASE_CORS_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return new Response(JSON.stringify(payload), {
    ...init,
    headers,
  });
}
