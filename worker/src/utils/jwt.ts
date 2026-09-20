const enc = new TextEncoder();

function b64urlEncode(bytes: Uint8Array | string): string {
  const raw = typeof bytes === "string" ? enc.encode(bytes) : bytes;
  let bin = "";
  raw.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "user";
  iat: number;
  exp: number;
  iss: string;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signToken(payload: { sub: string; email: string; name: string; role: string }, secret: string, ttlSeconds: number, issuer: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const header = b64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64urlEncode(JSON.stringify({ ...payload, iss: issuer, iat, exp: iat + ttlSeconds }));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(token: string, secret: string, issuer: string): Promise<TokenPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify("HMAC", key, b64urlDecode(sig) as BufferSource, enc.encode(`${header}.${body}`));
  if (!valid) return null;
  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return null;
  if (payload.iss !== issuer) return null;
  if (payload.role !== "admin") return null;
  return payload;
}
