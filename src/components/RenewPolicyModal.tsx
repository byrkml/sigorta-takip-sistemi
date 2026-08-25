'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Policy, InsuranceCompany } from '@/types/database';
import { X, RefreshCw, Loader2, FileCheck } from 'lucide-react';

interface RenewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  policy: Policy | null;
}

export default function RenewPolicyModal({
  isOpen,
  onClose,
  onSuccess,
  policy,
}: RenewPolicyModalProps) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !policy) return;

    // Varsayılan yeni tarihler: Eski bitiş tarihi -> Yeni başlangıç olur, 1 yıl sonrası yeni bitiş
    const prevEndDate = new Date(policy.end_date);
    const newStart = policy.end_date;
    const nextYear = new Date(prevEndDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const newEnd = nextYear.toISOString().split('T')[0];

    setCompanyId(policy.company_id || '');
    setPolicyNumber('');
    setStartDate(newStart);
    setEndDate(newEnd);
    setPremiumAmount(policy.premium_amount ? policy.premium_amount.toString() : '');
    setCurrency(policy.currency || 'TRY');
    setNotes(`Önceki Poliçe No: ${policy.policy_number} üzerinden yenilendi.`);

    async function loadCompanies() {
      const { data } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('name');
      setCompanies(data || []);
    }

    loadCompanies();
  }, [isOpen, policy]);

  if (!isOpen || !policy) return null;

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Yeni Poliçe Kaydını Ekle
      const { error: insertError } = await supabase.from('policies').insert([
        {
          customer_id: policy.customer_id,
          vehicle_id: policy.vehicle_id,
          company_id: companyId || null,
          policy_type: policy.policy_type,
          policy_number: policyNumber.trim().toUpperCase(),
          start_date: startDate,
          end_date: endDate,
          premium_amount: parseFloat(premiumAmount) || 0,
          currency: currency,
          notes: notes.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Poliçe yenilenirken hata:', err);
      setError(err.message || 'Poliçe yenilenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Başlık */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">
              Poliçe Yenileme ({policy.policy_type})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRenew} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sigorta Şirketi *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Şirket Seçin</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Poliçe No *
              </label>
              <input
                type="text"
                required
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Yeni poliçe no"
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Başlangıç *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Bitiş *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Yeni Prim Tutarı *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                placeholder="Örn: 9441.51"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Birim
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          {/* Çok Satırlı Yenileme / Teklif Notu Alanı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Yenileme Notu / Teklif Karşılaştırması
            </label>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fiyat tekliflerini ve notları buraya yapıştırabilirsiniz..."
              className={`${inputClass} resize-y font-sans leading-relaxed whitespace-pre-wrap`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Farklı şirketlerden aldığınız teklif listesini doğrudan yapıştırabilirsiniz, satır düzeni korunur.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              {loading ? 'Yenileniyor...' : 'Poliçeyi Yenile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}