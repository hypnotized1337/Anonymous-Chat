const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function timingSafeEqual(a: string, b: string): boolean {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let r = 0;
  for (let i = 0; i < ae.length; i++) r |= ae[i] ^ be[i];
  return r === 0;
}

// Per-IP rate limiter with exponential backoff on failed attempts
type Bucket = { fails: number; nextAllowed: number; windowReset: number; windowCount: number };
const buckets = new Map<string, Bucket>();
const MAX_PER_MIN = 5;
const WINDOW_MS = 60_000;

function getBucket(ip: string): Bucket {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b) {
    b = { fails: 0, nextAllowed: 0, windowReset: now + WINDOW_MS, windowCount: 0 };
    buckets.set(ip, b);
  }
  if (now > b.windowReset) {
    b.windowReset = now + WINDOW_MS;
    b.windowCount = 0;
  }
  return b;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const b = getBucket(ip);

  if (now < b.nextAllowed) {
    return new Response(JSON.stringify({ error: 'Too many attempts', retryAfterMs: b.nextAllowed - now }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  b.windowCount++;
  if (b.windowCount > MAX_PER_MIN) {
    b.nextAllowed = now + 30_000;
    return new Response(JSON.stringify({ error: 'Too many attempts' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { password } = await req.json();
    if (!password || typeof password !== 'string' || password.length > 200) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const masterKey = Deno.env.get('ADMIN_MASTER_KEY');
    if (!masterKey) {
      return new Response(JSON.stringify({ error: 'Not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const valid = timingSafeEqual(password, masterKey);
    if (!valid) {
      b.fails++;
      // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at 60s
      const delay = Math.min(60_000, 1000 * 2 ** Math.min(b.fails - 1, 6));
      b.nextAllowed = now + delay;
    } else {
      b.fails = 0;
      b.nextAllowed = 0;
    }

    return new Response(JSON.stringify({ valid }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ valid: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
