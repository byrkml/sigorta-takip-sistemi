'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { InsuranceCompany } from '@/types/database';
import { Building2, Plus, Trash2 } from 'lucide-react';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      console.error('Şirketler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('insurance_companies')
        .insert([{ name: newCompanyName.trim() }]);

      if (insertError) throw insertError;

      setNewCompanyName('');
      await fetchCompanies();
    } catch (err: any) {
      setError(err.message || 'Şirket eklenemedi.');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    const isConfirmed = window.confirm(`"${name}" şirketini silmek istediğinize emin misiniz?`);
    if (!isConfirmed) return;

    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error('Silme hatası:', err);
      setError(`Silinemedi: ${err.message || 'Hata oluştu'}`);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Sigorta Şirketleri
        </h1>
        <p className="text-slate-500 text-sm">
          Acentenizin çalıştığı sigorta şirketlerini ekleyin veya çıkartın.
        </p>
      </div>

      {/* Şirket Ekleme Formu */}
      <form
        onSubmit={handleAddCompany}
        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <input
          type="text"
          placeholder="Yeni Sigorta Şirketi Adı (Örn: Doğa Sigorta)..."
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {adding ? 'Ekleniyor...' : 'Şirket Ekle'}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Şirket Listesi */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="text-center text-slate-500 text-sm py-8">Yükleniyor...</div>
        ) : companies.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">Kayıtlı şirket bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {companies.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between hover:border-slate-300 transition-all"
              >
                <span className="font-semibold text-slate-800 text-sm">{c.name}</span>

                <button
                  type="button"
                  onClick={() => handleDeleteCompany(c.id, c.name)}
                  title={`${c.name} şirketini sil`}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all border border-red-200 bg-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}