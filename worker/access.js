// Checks the Cloudflare Access login on admin requests.
//
// Cloudflare Access sits in front of /admin and signs in Shane with Google. It
// then adds a signed token (Cf-Access-Jwt-Assertion) to every request it lets
// through. The Worker verifies that token as well, so a request that reaches the
// Worker some other way (a preview URL, a route Access does not cover) is refused.
// Fails closed: without ACCESS_TEAM_DOMAIN and ACCESS_AUD nothing gets in.
//
//   ACCESS_TEAM_DOMAIN  e.g. partnerpress.cloudflareaccess.com
//   ACCESS_AUD          the Access application's "Application Audience (AUD) Tag"

const CERTS_TTL_MS = 60 * 60 * 1000;
let certsCache = { domain: '', at: 0, keys: new Map() };

/** Returns the signed-in email, or null if the request is not authorized. */
export async function accessUser(request, env) {
  const team = String(env.ACCESS_TEAM_DOMAIN ?? '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  const aud = String(env.ACCESS_AUD ?? '').trim();
  if (!team || !aud) {
    console.error('Admin is locked: set ACCESS_TEAM_DOMAIN and ACCESS_AUD on the Worker.');
    return null;
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;

  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!sigB64) return null;
    const header = JSON.parse(decodeText(headerB64));
    const payload = JSON.parse(decodeText(payloadB64));
    if (header.alg !== 'RS256') return null;

    const key = await signingKey(team, header.kid);
    if (!key) return null;
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const now = Math.floor(Date.now() / 1000);
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!auds.includes(aud)) return null;
    if (payload.iss !== `https://${team}`) return null;
    if (typeof payload.exp !== 'number' || payload.exp < now) return null;
    if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null;
    return payload.email || payload.sub || 'unknown';
  } catch (err) {
    console.error('Access token check failed:', err);
    return null;
  }
}

async function signingKey(team, kid) {
  const fresh = certsCache.domain === team && Date.now() - certsCache.at < CERTS_TTL_MS;
  if (!fresh || !certsCache.keys.has(kid)) {
    const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
    if (!res.ok) throw new Error(`Access certs: HTTP ${res.status}`);
    const { keys = [] } = await res.json();
    const map = new Map();
    for (const jwk of keys) {
      if (jwk.kty !== 'RSA' || !jwk.kid) continue;
      map.set(
        jwk.kid,
        await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']),
      );
    }
    certsCache = { domain: team, at: Date.now(), keys: map };
  }
  return certsCache.keys.get(kid) ?? null;
}

function base64UrlBytes(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(text.length / 4) * 4, '=');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

const decodeText = (text) => new TextDecoder().decode(base64UrlBytes(text));
