'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InsuranceCompany, Policy } from '@/types/database';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { addYears, format, parseISO } from 'date-fns';

interface Props {
  isOpen: boolean;
  policy: Policy | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RenewPolicyModal({ isOpen, policy, onClose, onSuccess }: Props) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_id: '',
    policy_number: '',
    start_date: '',
    end_date: '',
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
      if (data) setCompanies(data);
    }
    if (isOpen) loadCompanies();
  }, [isOpen]);

  useEffect(() => {
    if (policy) {
      // Yeni başlangıç tarihi: Eski bitiş tarihi
      const newStartDate = policy.end_date;
      // Yeni bitiş tarihi: Başlangıçtan 1 yıl sonrası
      const calculatedEnd = format(addYears(parseISO(newStartDate), 1), 'yyyy-MM-dd');

      setFormData({
        company_id: policy.company_id,
        policy_number: '',
        start_date: newStartDate,
        end_date: calculatedEnd,
        premium_amount: policy.premium_amount ? policy.premium_amount.toString() : '',
        currency: policy.currency || 'TRY',
        notes: `Önceki Poliçe No: ${policy.policy_number} üzerinden yenilendi.`,
      });
    }
  }, [policy]);

  if (!isOpen || !policy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Yeni poliçeyi ekle (parent_policy_id eski poliçeyi gösterecek)
      const { error: insertError } = await supabase.from('policies').insert([
        {
          customer_id: policy.customer_id,
          vehicle_id: policy.vehicle_id,
          company_id: formData.company_id,
          policy_type: policy.policy_type,
          policy_number: formData.policy_number.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          premium_amount: parseFloat(formData.premium_amount) || 0,
          currency: formData.currency,
          parent_policy_id: policy.id, // Geçmiş zinciri
          notes: formData.notes.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Poliçe yenilenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <span>Poliçe Yenileme ({policy.policy_type})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Eski Poliçe No:</strong> {policy.policy_number} <br />
            Eski poliçe geçmiş olarak arşivlenecek ve yeni poliçe 1 yıllık dönem için aktifleşecektir.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Yeni Poliçe No *</label>
              <input
                required
                type="text"
                placeholder="Yeni poliçe no"
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Yeni Başlangıç *</label>
              <input
                required
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Yeni Bitiş *</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Yeni Prim Tutarı *</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Birim</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Yenileme Notu</label>
            <input
              type="text"
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
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Yenileniyor...' : 'Poliçeyi Yenile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}