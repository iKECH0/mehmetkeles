import { useEffect, useMemo, useState } from 'react';
import {
  Search, RefreshCcw, Download, Loader2, X, Phone, Mail, MessageSquare,
  CheckCircle2, Clock, Archive, Trash2, AlertCircle,
} from 'lucide-react';

type Status = 'new' | 'contacted' | 'converted' | 'archived';

type Application = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  level: string;
  subject: string;
  message: string | null;
  status: Status;
  notes: string | null;
};

const STATUS_LABEL: Record<Status, string> = {
  new: 'Yeni',
  contacted: 'İletişim Kuruldu',
  converted: 'Dönüştü',
  archived: 'Arşiv',
};

const STATUS_STYLE: Record<Status, string> = {
  new: 'bg-amber-50 text-amber-800 border-amber-200',
  contacted: 'bg-sky-50 text-sky-800 border-sky-200',
  converted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

function fmtDate(s: string) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(s));
  } catch { return s; }
}

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminTable() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [active, setActive] = useState<Application | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/applications', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Yükleme hatası');
      setItems(json.data || []);
    } catch (e: any) {
      setError(e?.message || 'Hata');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (!term) return true;
      return (
        it.full_name.toLowerCase().includes(term) ||
        it.phone.toLowerCase().includes(term) ||
        it.email.toLowerCase().includes(term) ||
        it.subject.toLowerCase().includes(term) ||
        it.level.toLowerCase().includes(term)
      );
    });
  }, [items, q, statusFilter]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = { new: 0, contacted: 0, converted: 0, archived: 0 };
    items.forEach((i) => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [items]);

  async function updateItem(id: string, patch: Partial<Pick<Application, 'status' | 'notes'>>) {
    const prev = items;
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    if (active?.id === id) setActive((a) => (a ? { ...a, ...patch } : a));
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error('update failed');
    } catch {
      setItems(prev);
      alert('Güncelleme başarısız oldu.');
    }
  }

  async function removeItem(id: string) {
    if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return;
    const prev = items;
    setItems((arr) => arr.filter((i) => i.id !== id));
    if (active?.id === id) setActive(null);
    try {
      const res = await fetch(`/api/admin/applications?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    } catch {
      setItems(prev);
      alert('Silme başarısız oldu.');
    }
  }

  function exportCSV() {
    const header = ['Tarih', 'Ad Soyad', 'Telefon', 'E-posta', 'Seviye', 'Ders', 'Mesaj', 'Durum', 'Not'];
    const rows = filtered.map((i) => [
      fmtDate(i.created_at), i.full_name, i.phone, i.email, i.level, i.subject,
      i.message ?? '', STATUS_LABEL[i.status], i.notes ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basvurular_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(['new', 'contacted', 'converted', 'archived'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`text-left rounded-2xl border p-4 transition ${
              statusFilter === s ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-slate-500">{STATUS_LABEL[s]}</div>
            <div className="mt-1 text-2xl font-display font-bold text-slate-900">{counts[s]}</div>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, telefon, e-posta, ders ara..."
            className="input pl-10 h-[42px] sm:h-auto"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
          className="input sm:max-w-[200px] h-[42px] sm:h-auto"
        >
          <option value="all">Tüm durumlar</option>
          <option value="new">Yeni</option>
          <option value="contacted">İletişim Kuruldu</option>
          <option value="converted">Dönüştü</option>
          <option value="archived">Arşiv</option>
        </select>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-outline flex-1 sm:flex-none justify-center h-[42px] sm:h-auto" title="Yenile">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
          <button onClick={exportCSV} className="btn-outline flex-1 sm:flex-none justify-center h-[42px] sm:h-auto" title="CSV indir">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Tarih</th>
                <th className="text-left font-semibold px-4 py-3">Ad Soyad</th>
                <th className="text-left font-semibold px-4 py-3">İletişim</th>
                <th className="text-left font-semibold px-4 py-3">Seviye / Ders</th>
                <th className="text-left font-semibold px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <Loader2 className="inline animate-spin mr-2" size={16} /> Yükleniyor...
                </td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
              )}
              {!loading && filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setActive(i)}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{fmtDate(i.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{i.full_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <a href={`tel:${i.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-slate-700 hover:text-brand-700"><Phone size={12}/>{i.phone}</a>
                      <a href={`mailto:${i.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-700 text-xs"><Mail size={12}/>{i.email}</a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{i.level}</div>
                    <div className="text-xs text-slate-500">{i.subject}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[i.status]}`}>
                      {STATUS_LABEL[i.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {i.message && <MessageSquare size={14} className="inline text-slate-400" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActive(null)} />
          <aside className="relative w-full sm:w-[480px] bg-white shadow-2xl overflow-y-auto h-full animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center justify-between p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">Başvuru Detayı</h3>
              <button onClick={() => setActive(null)} className="p-2 -mr-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 sm:p-5 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Ad Soyad</div>
                <div className="mt-0.5 text-lg font-semibold text-slate-900">{active.full_name}</div>
                <div className="mt-1 text-xs text-slate-500">{fmtDate(active.created_at)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${active.phone}`} className="rounded-xl border border-slate-200 p-3 hover:border-brand-400 transition">
                  <div className="text-xs text-slate-500">Telefon</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900 inline-flex items-center gap-1"><Phone size={12}/>{active.phone}</div>
                </a>
                <a href={`mailto:${active.email}`} className="rounded-xl border border-slate-200 p-3 hover:border-brand-400 transition">
                  <div className="text-xs text-slate-500">E-posta</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900 truncate inline-flex items-center gap-1"><Mail size={12}/>{active.email}</div>
                </a>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Seviye</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900">{active.level}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Ders</div>
                  <div className="mt-0.5 text-sm font-medium text-slate-900">{active.subject}</div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Mesaj</div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700 whitespace-pre-wrap min-h-[60px]">
                  {active.message || <span className="text-slate-400">Mesaj iletilmemiş.</span>}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Durum</div>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'contacted', 'converted', 'archived'] as Status[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateItem(active.id, { status: s })}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        active.status === s ? STATUS_STYLE[s] : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s === 'new' && <Clock size={12}/>}
                      {s === 'contacted' && <Phone size={12}/>}
                      {s === 'converted' && <CheckCircle2 size={12}/>}
                      {s === 'archived' && <Archive size={12}/>}
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Yönetici Notu</label>
                <textarea
                  rows={4}
                  className="input resize-none"
                  defaultValue={active.notes ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if ((active.notes ?? '') !== v) updateItem(active.id, { notes: v || null });
                  }}
                  placeholder="Bu başvuruyla ilgili notlarınız..."
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${active.phone.replace(/[^0-9]/g, '').replace(/^0/, '90')}`}
                  target="_blank" rel="noopener"
                  className="btn-whatsapp text-xs"
                >
                  WhatsApp Mesaj
                </a>
                <button onClick={() => removeItem(active.id)} className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                  <Trash2 size={12}/> Sil
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
