'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InsuranceCompany, PolicyType } from '@/types/database';
import { X, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  customerId: string;
  vehicleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPolicyModal({
  isOpen,
  customerId,
  vehicleId,
  onClose,
  onSuccess,
}: Props) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    company_id: '',
    policy_type: 'Trafik' as PolicyType,
    policy_number: '',
    start_date: todayStr,
    end_date: nextYearStr,
    premium_amount: '',
    currency: 'TRY',
    notes: '',
  });

  useEffect(() => {
    async function loadCompanies() {
      const { data } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setCompanies(data);
        setFormData((prev) => ({ ...prev, company_id: data[0].id }));
      }
    }
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('policies').insert([
        {
          customer_id: customerId,
          vehicle_id: vehicleId,
          company_id: formData.company_id,
          policy_type: formData.policy_type,
          policy_number: formData.policy_number.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          premium_amount: parseFloat(formData.premium_amount) || 0,
          currency: formData.currency,
          notes: formData.notes.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Poliçe kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Yeni Poliçe Kaydı</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Poliçe Türü *</label>
              <select
                value={formData.policy_type}
                onChange={(e) => setFormData({ ...formData, policy_type: e.target.value as PolicyType })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="Trafik">Trafik Sigortası</option>
                <option value="Kasko">Kasko</option>
                <option value="DASK">DASK</option>
                <option value="Konut">Konut Sigortası</option>
                <option value="Sağlık">Sağlık Sigortası</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sigorta Şirketi *</label>
              <select
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Poliçe Numarası *</label>
            <input
              required
              type="text"
              placeholder="Örn: POL-2026-987654"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Başlangıç Tarihi *</label>
              <input
                required
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bitiş Tarihi *</label>
              <input
                required
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prim / Tutar *</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.premium_amount}
                onChange={(e) => setFormData({ ...formData, premium_amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Para Birimi</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Poliçe Notu</label>
            <input
              type="text"
              placeholder="Örn: Taksitli çekildi / %20 hasarsızlık indirimi"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Poliçeyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}