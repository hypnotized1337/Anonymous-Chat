import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let r = 0;
  for (let i = 0; i < ae.length; i++) r |= ae[i] ^ be[i];
  return r === 0;
}

function genToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

// In-memory IP rate limiter (per isolate)
const rl = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const r = rl.get(ip);
  if (!r || now > r.reset) {
    rl.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  r.count++;
  return r.count <= max;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!rateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, roomCode, password, ownerToken } = await req.json();

    if (!roomCode || typeof roomCode !== "string" || roomCode.length > 30) {
      return new Response(JSON.stringify({ error: "Invalid room code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "set") {
      if (!password || typeof password !== "string" || password.length < 1 || password.length > 100) {
        return new Response(JSON.stringify({ error: "Invalid password" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existing } = await supabase
        .from("room_passwords")
        .select("owner_token_hash")
        .eq("room_code", roomCode)
        .maybeSingle();

      // If a record exists with an owner token, require matching token to overwrite
      if (existing?.owner_token_hash) {
        if (!ownerToken || typeof ownerToken !== "string") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const providedHash = await sha256Hex(ownerToken);
        if (!timingSafeEqual(providedHash, existing.owner_token_hash)) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const newToken = genToken();
      const tokenHash = await sha256Hex(newToken);
      const passwordHash = await sha256Hex(password);

      const { error } = await supabase
        .from("room_passwords")
        .upsert(
          { room_code: roomCode, password_hash: passwordHash, owner_token_hash: tokenHash, created_by: null },
          { onConflict: "room_code" },
        );
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, ownerToken: newToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      const { data } = await supabase
        .from("room_passwords").select("id").eq("room_code", roomCode).maybeSingle();
      return new Response(JSON.stringify({ hasPassword: !!data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      if (!password || typeof password !== "string") {
        return new Response(JSON.stringify({ valid: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data } = await supabase
        .from("room_passwords").select("password_hash").eq("room_code", roomCode).maybeSingle();
      if (!data) {
        return new Response(JSON.stringify({ valid: true, noPassword: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const provided = await sha256Hex(password);
      return new Response(JSON.stringify({ valid: timingSafeEqual(provided, data.password_hash) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { data: existing } = await supabase
        .from("room_passwords")
        .select("owner_token_hash")
        .eq("room_code", roomCode)
        .maybeSingle();

      // If no record, treat as success (idempotent)
      if (!existing) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If the record predates the owner-token system (legacy), allow delete
      if (existing.owner_token_hash) {
        if (!ownerToken || typeof ownerToken !== "string") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const providedHash = await sha256Hex(ownerToken);
        if (!timingSafeEqual(providedHash, existing.owner_token_hash)) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      await supabase.from("room_passwords").delete().eq("room_code", roomCode);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
