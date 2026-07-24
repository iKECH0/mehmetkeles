import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const schema = z.object({
  full_name: z.string().min(3, 'Lütfen ad soyadınızı girin').max(80),
  phone: z
    .string()
    .min(10, 'Geçerli bir telefon girin')
    .regex(/^[0-9 +()-]{10,20}$/, 'Telefon yalnızca rakam ve ayraç içerebilir'),
  email: z.string().email('Geçerli bir e-posta girin'),
  branch: z.string().min(2, 'Branş girin').max(80),
  education: z.string().min(2, 'Mezuniyet/üniversite bilgisi girin').max(160),
  experience_years: z.coerce.number({ invalid_type_error: 'Sayı girin' }).int().min(0).max(60),
  message: z.string().max(2000).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'KVKK onayı zorunludur' }) }),
  website: z.string().max(0).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;
type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function TeacherApplicationForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      branch: '',
      education: '',
      experience_years: 0 as unknown as number,
      message: '',
      consent: false as unknown as true,
      website: '',
    },
  });

  const onSubmit = async (raw: FormValues) => {
    setServerError(null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setStatus('error');
      setServerError(parsed.error.issues[0]?.message ?? 'Form hatalı');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/teacher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setServerError(json?.error ?? 'Gönderim başarısız. Lütfen tekrar deneyin.');
        return;
      }
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
      setServerError('Ağ hatası. Lütfen tekrar deneyin.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-emerald-500 text-white">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-emerald-900">Başvurunuz alındı</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Öğretmen başvurunuz tarafımıza ulaştı. Değerlendirme sonrası en kısa sürede sizinle iletişime geçilecektir.
        </p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-outline mt-6">
          Yeni Başvuru
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...register('website')} />

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="t_full_name">Ad Soyad *</label>
          <input id="t_full_name" className={`input ${errors.full_name ? 'input-err' : ''}`} placeholder="Adınız Soyadınız" {...register('full_name')} />
          {errors.full_name && <p className="mt-1 text-xs text-rose-600">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="t_phone">Telefon *</label>
          <input id="t_phone" className={`input ${errors.phone ? 'input-err' : ''}`} placeholder="0541 105 55 43" inputMode="tel" {...register('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="t_email">E-posta *</label>
        <input id="t_email" type="email" className={`input ${errors.email ? 'input-err' : ''}`} placeholder="ornek@eposta.com" {...register('email')} />
        {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="label" htmlFor="t_branch">Branş *</label>
          <input id="t_branch" className={`input ${errors.branch ? 'input-err' : ''}`} placeholder="Matematik, Türkçe..." {...register('branch')} />
          {errors.branch && <p className="mt-1 text-xs text-rose-600">{errors.branch.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="t_exp">Deneyim (yıl) *</label>
          <input id="t_exp" type="number" min={0} max={60} className={`input ${errors.experience_years ? 'input-err' : ''}`} placeholder="5" {...register('experience_years')} />
          {errors.experience_years && <p className="mt-1 text-xs text-rose-600">{errors.experience_years.message as string}</p>}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="t_edu">Mezuniyet / Üniversite *</label>
        <input id="t_edu" className={`input ${errors.education ? 'input-err' : ''}`} placeholder="Örn. Selçuk Üniversitesi - Matematik Öğretmenliği" {...register('education')} />
        {errors.education && <p className="mt-1 text-xs text-rose-600">{errors.education.message}</p>}
      </div>

      <div>
        <label className="label" htmlFor="t_msg">Özgeçmiş / Mesajınız</label>
        <textarea id="t_msg" rows={5} className="input resize-none" placeholder="Tecrübeleriniz, çalışmak istediğiniz programlar, eklemek istedikleriniz..." {...register('message')} />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...register('consent')} />
        <span>Kişisel verilerimin yalnızca başvuru değerlendirme amacıyla işlenmesine onay veriyorum (KVKK).</span>
      </label>
      {errors.consent && <p className="-mt-3 text-xs text-rose-600">{errors.consent.message as string}</p>}

      {status === 'error' && serverError && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <button type="submit" disabled={status === 'submitting'} className="btn-primary w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed">
        {status === 'submitting' ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Gönderiliyor...
          </>
        ) : (
          <>Başvuruyu Gönder</>
        )}
      </button>
    </form>
  );
}
