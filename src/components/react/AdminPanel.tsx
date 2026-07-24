import { useState } from 'react';
import { Users, GraduationCap, KeyRound } from 'lucide-react';
import AdminTable from './AdminTable';
import TeacherAdminTable from './TeacherAdminTable';
import ChangePasswordCard from './ChangePasswordCard';

type Tab = 'students' | 'teachers' | 'settings';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'students', label: 'Öğrenci Başvuruları', icon: Users },
  { id: 'teachers', label: 'Öğretmen Başvuruları', icon: GraduationCap },
  { id: 'settings', label: 'Şifre Değiştir', icon: KeyRound },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('students');

  return (
    <div>
      <div className="mb-6 overflow-x-auto -mx-2 px-2">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                tab === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'students' && (
        <>
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">Öğrenci Başvuruları</h1>
            <p className="mt-1 text-sm text-slate-600">Veli ve öğrenci başvurularını görüntüleyin, durum güncelleyin ve not ekleyin.</p>
          </div>
          <AdminTable />
        </>
      )}
      {tab === 'teachers' && (
        <>
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">Öğretmen Başvuruları</h1>
            <p className="mt-1 text-sm text-slate-600">Eğitmen başvurularını değerlendirin ve durumlarını güncelleyin.</p>
          </div>
          <TeacherAdminTable />
        </>
      )}
      {tab === 'settings' && (
        <>
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">Yönetim Ayarları</h1>
            <p className="mt-1 text-sm text-slate-600">Yönetici giriş şifrenizi güvenli şekilde güncelleyin.</p>
          </div>
          <ChangePasswordCard />
        </>
      )}
    </div>
  );
}
