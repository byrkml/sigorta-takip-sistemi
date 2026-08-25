'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Car } from 'lucide-react';

interface Props {
  isOpen: boolean;
  customerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVehicleModal({ isOpen, customerId, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    plate: '',
    license_serial: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    vehicle_type: 'Otomobil',
    chassis_number: '',
    motor_number: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Tüm metin alanlarını Türkçe kurallarına uygun BÜYÜK HARFE dönüştürme
      const upperPlate = formData.plate.replace(/\s+/g, '').toLocaleUpperCase('tr-TR');
      const upperLicense = formData.license_serial.trim() ? formData.license_serial.trim().toLocaleUpperCase('tr-TR') : null;
      const upperBrand = formData.brand.trim().toLocaleUpperCase('tr-TR');
      const upperModel = formData.model.trim().toLocaleUpperCase('tr-TR');
      const upperChassis = formData.chassis_number.trim() ? formData.chassis_number.trim().toLocaleUpperCase('tr-TR') : null;
      const upperMotor = formData.motor_number.trim() ? formData.motor_number.trim().toLocaleUpperCase('tr-TR') : null;
      const upperNotes = formData.notes.trim() ? formData.notes.trim().toLocaleUpperCase('tr-TR') : null;

      const { error: insertError } = await supabase.from('vehicles').insert([
        {
          customer_id: customerId,
          plate: upperPlate,
          license_serial: upperLicense,
          brand: upperBrand,
          model: upperModel,
          year: formData.year ? parseInt(formData.year) : null,
          vehicle_type: formData.vehicle_type,
          chassis_number: upperChassis,
          motor_number: upperMotor,
          notes: upperNotes,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setFormData({
        plate: '',
        license_serial: '',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        vehicle_type: 'Otomobil',
        chassis_number: '',
        motor_number: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Araç eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const forcedDarkTextStyle = {
    color: '#0f172a',
    backgroundColor: '#ffffff',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Car className="w-5 h-5 text-blue-600" />
            <span>Müşteriye Araç Tanımla</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Plaka *</label>
              <input
                required
                type="text"
                placeholder="34ABC123"
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold uppercase tracking-wider focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ruhsat Seri No</label>
              <input
                type="text"
                placeholder="Örn: AB 123456"
                value={formData.license_serial}
                onChange={(e) => setFormData({ ...formData, license_serial: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marka *</label>
              <input
                required
                type="text"
                placeholder="Örn: RENAULT"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
              <input
                required
                type="text"
                placeholder="Örn: MEGANE"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model Yılı</label>
              <input
                type="number"
                min="1970"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Türü</label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                <option value="Otomobil">Otomobil</option>
                <option value="Kamyonet">Kamyonet</option>
                <option value="Motosiklet">Motosiklet</option>
                <option value="Kamyon/Çekici">Kamyon/Çekici</option>
                <option value="Otobüs/Minibüs">Otobüs/Minibüs</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Şasi Numarası</label>
              <input
                type="text"
                placeholder="17 HANELİ ŞASİ NO"
                value={formData.chassis_number}
                onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                style={forcedDarkTextStyle}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Motor Numarası</label>
            <input
              type="text"
              placeholder="MOTOR NUMARASI"
              value={formData.motor_number}
              onChange={(e) => setFormData({ ...formData, motor_number: e.target.value })}
              style={forcedDarkTextStyle}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Araç Notu</label>
            <input
              type="text"
              placeholder="ÖRN: SOL ÇAMURLUK LOKAL BOYALI"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={forcedDarkTextStyle}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-all"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Aracı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}