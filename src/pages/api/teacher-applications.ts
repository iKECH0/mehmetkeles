import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getAdminClient } from '../../lib/supabase';
import { rateLimit } from '../../lib/rateLimit';

export const prerender = false;

const schema = z.object({
  full_name: z.string().min(3).max(80),
  phone: z.string().min(10).max(20).regex(/^[0-9 +()-]+$/),
  email: z.string().email().max(120),
  branch: z.string().min(2).max(80),
  education: z.string().min(2).max(160),
  experience_years: z.coerce.number().int().min(0).max(60),
  message: z.string().max(2000).optional().or(z.literal('')),
  consent: z.literal(true),
  website: z.string().max(0).optional().or(z.literal('')),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`teacher-apply:${ip}`, 3, 60_000)) {
    return json({ error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Geçersiz istek.' }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'Form hatalı.' }, 400);
  }

  if (parsed.data.website) {
    return json({ ok: true }, 200);
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('teacher_applications').insert({
      full_name: parsed.data.full_name.trim(),
      phone: parsed.data.phone.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      branch: parsed.data.branch.trim(),
      education: parsed.data.education.trim(),
      experience_years: parsed.data.experience_years,
      message: parsed.data.message?.toString().trim() || null,
    });
    if (error) {
      console.error('[teacher_applications:insert]', error);
      return json({ error: 'Kayıt sırasında bir hata oluştu.' }, 500);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[teacher_applications:exception]', err);
    return json({ error: 'Sunucu yapılandırması eksik. Lütfen daha sonra tekrar deneyin.' }, 500);
  }
};
