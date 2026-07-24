import { defineMiddleware } from 'astro:middleware';
import { isValidSession } from './lib/session';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookie = context.request.headers.get('cookie');
  const valid = isValidSession(cookie);
  context.locals.isAdmin = valid;

  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Korunan yollar: /admin (login hariç) ve /api/admin/*
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isLogin = pathname === '/admin/login' || pathname === '/api/admin/login';

  if ((isAdminPage || isAdminApi) && !isLogin && !valid) {
    if (isAdminApi) {
      return new Response(JSON.stringify({ error: 'Yetkisiz' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login');
  }

  return next();
});
