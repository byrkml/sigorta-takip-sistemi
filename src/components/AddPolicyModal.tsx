'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle, InsuranceCompany } from '@/types/database';
import { X, FilePlus, Loader2 } from 'lucide-react';

interface AddPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
}

export default function AddPolicyModal({
  isOpen,
  onClose,
  onSuccess,
  customerId,
}: AddPolicyModalProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  
  const [vehicleId, setVehicleId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [policyType, setPolicyType] = useState('Trafik');
  const [policyNumber, setPolicyNumber] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0]
  );
  const [premiumAmount, setPremiumAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [{ data: vehData }, { data: compData }] = await Promise.all([
          supabase.from('vehicles').select('*').eq('customer_id', customerId),
          supabase.from('insurance_companies').select('*').order('name'),
        ]);

        setVehicles(vehData || []);
        setCompanies(compData || []);
        if (compData && compData.length > 0) {
          setCompanyId(compData[0].id);
        }
      } catch (err) {
        console.error('Modal verileri yüklenemedi:', err);
      }
    }

    loadData();
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('policies').insert([
        {
          customer_id: customerId,
          vehicle_id: vehicleId || null,
          company_id: companyId || null,
          policy_type: policyType,
          policy_number: policyNumber.trim(),
          start_date: startDate,
          end_date: endDate,
          premium_amount: parseFloat(premiumAmount) || 0,
          currency: currency,
          notes: notes.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      setPolicyNumber('');
      setPremiumAmount('');
      setNotes('');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Poliçe kaydedilemedi:', err);
      setError(err.message || 'Poliçe kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <FilePlus className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">Yeni Poliçe Ekle</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Poliçe Türü *
              </label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className={inputClass}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İlişkili Araç (Opsiyonel)
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className={inputClass}
              >
                <option value="">Araç Seçiniz (Araçsız)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} ({v.brand} {v.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

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
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Poliçe Numarası *
              </label>
              <input
                type="text"
                required
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="Örn: POL-2026-9812"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Başlangıç Tarihi *
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
                Bitiş Tarihi *
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
                Prim Tutarı *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(e.target.value)}
                placeholder="Örn: 8500.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Para Birimi
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                <option value="TRY">₺ (TRY)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notlar
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Poliçeyle ilgili ek bilgiler..."
              className={`${inputClass} resize-none`}
            />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Kaydediliyor...' : 'Poliçeyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}