import type { APIRoute } from 'astro';
import { checkPassword, createSessionCookie } from '../../../lib/session';
import { rateLimit } from '../../../lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const ip = clientAddress || 'unknown';
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return new Response('Çok fazla deneme. 1 dk sonra tekrar deneyin.', { status: 429 });
  }

  const form = await request.formData();
  const password = String(form.get('password') ?? '');
  if (!(await checkPassword(password))) {
    return redirect('/admin/login?error=1', 303);
  }
  const cookie = createSessionCookie();
  return new Response(null, {
    status: 303,
    headers: {
      'Set-Cookie': cookie,
      Location: '/admin',
    },
  });
};
