'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Car, Loader2 } from 'lucide-react';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
}

export default function AddVehicleModal({
  isOpen,
  onClose,
  onSuccess,
  customerId,
}: AddVehicleModalProps) {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vehicleType, setVehicleType] = useState('Otomobil');
  const [chassisNumber, setChassisNumber] = useState('');
  const [licenseSerial, setLicenseSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('vehicles').insert([
        {
          customer_id: customerId,
          plate: plate.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          year: year ? parseInt(year) : null,
          vehicle_type: vehicleType,
          chassis_number: chassisNumber.trim() || null,
          license_serial: licenseSerial.trim() || null,
        },
      ]);

      if (insertError) throw insertError;

      setPlate('');
      setBrand('');
      setModel('');
      setYear('');
      setVehicleType('Otomobil');
      setChassisNumber('');
      setLicenseSerial('');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Araç eklenirken hata:', err);
      setError(err.message || 'Araç kaydedilemedi.');
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
            <Car className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">Yeni Araç Kaydı</h3>
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
                Plaka *
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="34ABC123"
                className={`${inputClass} uppercase font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Araç Türü
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className={inputClass}
              >
                <option value="Otomobil">Otomobil</option>
                <option value="Kamyonet">Kamyonet</option>
                <option value="Motosiklet">Motosiklet</option>
                <option value="Minibüs">Minibüs</option>
                <option value="Kamyon">Kamyon</option>
                <option value="Traktör">Traktör</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Marka *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Örn: Renault"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Model *
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Örn: Clio"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Model Yılı
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2022"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Şasi No
              </label>
              <input
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                placeholder="17 haneli şasi no"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ruhsat Seri No
              </label>
              <input
                type="text"
                value={licenseSerial}
                onChange={(e) => setLicenseSerial(e.target.value)}
                placeholder="Örn: AA 123456"
                className={inputClass}
              />
            </div>
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
              {loading ? 'Kaydediliyor...' : 'Aracı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}