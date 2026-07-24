import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getAdminClient } from '../../../lib/supabase';

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.isAdmin) return json({ error: 'Yetkisiz' }, 401);
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      console.error(error);
      return json({ error: error.message }, 500);
    }
    return json({ data });
  } catch (e) {
    console.error(e);
    return json({ error: 'Sunucu yapılandırması eksik.' }, 500);
  }
};

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'converted', 'archived']).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!locals.isAdmin) return json({ error: 'Yetkisiz' }, 401);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Geçersiz istek.' }, 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Geçersiz veri.' }, 400);

  const { id, ...patch } = parsed.data;
  if (Object.keys(patch).length === 0) return json({ ok: true });

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!locals.isAdmin) return json({ error: 'Yetkisiz' }, 401);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return json({ error: 'id gerekli' }, 400);
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('applications').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: 'Sunucu hatası.' }, 500);
  }
};
