import crypto from "crypto";

export function parseHash(hash: string) {
  const parts = hash.split(":");
  if (parts.length !== 2) return null;
  return { salt: parts[0], hash: parts[1] };
}

export async function verifyPassword(password: string, stored: string) {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, parsed.salt, 64, (err, dk) => {
      if (err) reject(err);
      else resolve(dk);
    });
  });
  const given = Buffer.from(parsed.hash, "hex");
  if (given.length !== key.length) return false;
  return crypto.timingSafeEqual(given, key);
}

export function signToken(payload: Record<string, any>, secret: string, expiresInSeconds: number) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };
  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const h = base64url(header);
  const b = base64url(body);
  const data = `${h}.${b}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function b64urlToB64(u: string) {
  let b = u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4;
  if (pad) b += "=".repeat(4 - pad);
  return b;
}

function base64urlToUint8(u: string): Uint8Array {
  const b = b64urlToB64(u);
  if (typeof atob === "function") {
    const bin = atob(b);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return Uint8Array.from(Buffer.from(b, "base64"));
}

function decodeJsonBase64Url(u: string): any {
  const b = b64urlToB64(u);
  if (typeof atob === "function") {
    const s = atob(b);
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }
  try {
    return JSON.parse(Buffer.from(b, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export async function verifyToken(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const data = `${h}.${b}`;
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.subtle !== "undefined") {
    try {
      const key = await globalThis.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["verify"]
      );
      const ok = await globalThis.crypto.subtle.verify(
        "HMAC",
        key,
        base64urlToUint8(s),
        new TextEncoder().encode(data)
      );
      if (!ok) return null;
      const payload = decodeJsonBase64Url(b);
      if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  } else {
    const expected = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    try {
      const payload = JSON.parse(Buffer.from(b, "base64url").toString("utf8"));
      if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
