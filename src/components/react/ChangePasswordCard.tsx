import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!current || !next || !confirm) {
      setStatus('error');
      setMessage('Tüm alanları doldurun.');
      return;
    }
    if (next.length < 6) {
      setStatus('error');
      setMessage('Yeni şifre en az 6 karakter olmalı.');
      return;
    }
    if (next !== confirm) {
      setStatus('error');
      setMessage('Yeni şifreler eşleşmiyor.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ current, next, confirm }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setStatus('error');
        setMessage(json?.error || 'Şifre değiştirilemedi.');
        return;
      }
      setStatus('success');
      setMessage('Şifre başarıyla güncellendi.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setStatus('error');
      setMessage('Ağ hatası.');
    }
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-700">
            <KeyRound size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Yönetici Şifresini Değiştir</h2>
            <p className="text-xs text-slate-500 mt-0.5">Yeni şifre en az 6 karakter olmalıdır.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="cur">Mevcut Şifre *</label>
            <div className="relative">
              <input
                id="cur"
                type={show ? 'text' : 'password'}
                className="input pr-10"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" tabIndex={-1}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="new">Yeni Şifre *</label>
              <input id="new" type={show ? 'text' : 'password'} className="input" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <label className="label" htmlFor="confirm">Yeni Şifre (Tekrar) *</label>
              <input id="confirm" type={show ? 'text' : 'password'} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
          </div>

          {status === 'success' && message && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} className="mt-0.5" /> {message}
            </div>
          )}
          {status === 'error' && message && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <AlertCircle size={18} className="mt-0.5" /> {message}
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={status === 'submitting'} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
              {status === 'submitting' ? (<><Loader2 size={16} className="animate-spin"/>Güncelleniyor...</>) : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
