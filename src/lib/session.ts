import crypto from 'node:crypto';
import { getAdminClient } from './supabase';

const COOKIE_NAME = 'mk_admin';
const PWD_KEY = 'admin_password_hash';

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

async function getStoredPasswordHash(): Promise<string | null> {
  try {
    const sb = getAdminClient();
    const { data, error } = await sb.from('admin_settings').select('value').eq('key', PWD_KEY).maybeSingle();
    if (error) return null;
    return (data?.value as string) || null;
  } catch {
    return null;
  }
}

async function setStoredPasswordHash(hash: string): Promise<void> {
  const sb = getAdminClient();
  const { error } = await sb.from('admin_settings').upsert({ key: PWD_KEY, value: hash });
  if (error) throw new Error(error.message);
}
const MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function getSecret(): string {
  const s = import.meta.env.ADMIN_PASSWORD;
  if (!s || s.length < 4) {
    throw new Error('ADMIN_PASSWORD tanımlı değil veya çok kısa.');
  }
  // Parolayı doğrudan kullanmak yerine sabit bir tuzla türetilmiş anahtar.
  return crypto.createHash('sha256').update('mk-admin::' + s).digest('hex');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function createSessionCookie(): string {
  const issuedAt = Date.now();
  const payload = `admin.${issuedAt}`;
  const sig = sign(payload);
  const value = `${payload}.${sig}`;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isValidSession(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const target = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!target) return false;
  try {
    const raw = decodeURIComponent(target.substring(COOKIE_NAME.length + 1));
    const lastDot = raw.lastIndexOf('.');
    if (lastDot < 0) return false;
    const payload = raw.substring(0, lastDot);
    const sig = raw.substring(lastDot + 1);
    const expected = sign(payload);
    if (
      sig.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      return false;
    }
    const [scope, issuedAtStr] = payload.split('.');
    if (scope !== 'admin') return false;
    const issuedAt = parseInt(issuedAtStr, 10);
    if (!Number.isFinite(issuedAt)) return false;
    if (Date.now() - issuedAt > MAX_AGE * 1000) return false;
    return true;
  } catch {
    return false;
  }
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function checkPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const stored = await getStoredPasswordHash();
  if (stored) {
    return safeEq(sha256(input), stored);
  }
  // Fallback: ilk kurulum / DB tablosu yoksa env'den oku.
  const expected = import.meta.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEq(input, expected);
}

export async function changePassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  if (!next || next.length < 6) return { ok: false, error: 'Yeni şifre en az 6 karakter olmalı.' };
  const valid = await checkPassword(current);
  if (!valid) return { ok: false, error: 'Mevcut şifre hatalı.' };
  try {
    await setStoredPasswordHash(sha256(next));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Şifre güncellenemedi.' };
  }
}
