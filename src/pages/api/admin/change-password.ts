import type { APIRoute } from 'astro';
import { changePassword, isValidSession } from '../../../lib/session';
import { rateLimit } from '../../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isValidSession(request.headers.get('cookie'))) {
    return new Response(JSON.stringify({ ok: false, error: 'Yetkisiz.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const ip = clientAddress || 'unknown';
  if (!rateLimit(`change-pwd:${ip}`, 10, 60_000)) {
    return new Response(JSON.stringify({ ok: false, error: 'Çok fazla deneme.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Geçersiz istek.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const current = String(payload?.current ?? '');
  const next = String(payload?.next ?? '');
  const confirm = String(payload?.confirm ?? '');
  if (!current || !next || !confirm) {
    return new Response(JSON.stringify({ ok: false, error: 'Tüm alanları doldurun.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (next !== confirm) {
    return new Response(JSON.stringify({ ok: false, error: 'Yeni şifreler eşleşmiyor.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const result = await changePassword(current, next);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
