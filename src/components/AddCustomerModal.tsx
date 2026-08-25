'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, Loader2 } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tcNumber, setTcNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const upperFirstName = firstName.trim().toLocaleUpperCase('tr-TR');
      const upperLastName = lastName.trim().toLocaleUpperCase('tr-TR');
      const upperAddress = address.trim() ? address.trim().toLocaleUpperCase('tr-TR') : null;
      const upperNotes = notes.trim() ? notes.trim().toLocaleUpperCase('tr-TR') : null;

      const { error: insertError } = await supabase.from('customers').insert([
        {
          first_name: upperFirstName,
          last_name: upperLastName,
          tc_number: tcNumber.trim(),
          phone: phone.trim(),
          birth_date: birthDate ? birthDate : null,
          address: upperAddress,
          notes: upperNotes,
        },
      ]);

      if (insertError) throw insertError;

      // Formu sıfırla
      setFirstName('');
      setLastName('');
      setTcNumber('');
      setPhone('');
      setBirthDate('');
      setAddress('');
      setNotes('');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Müşteri eklenirken hata:', err);
      setError(err.message || 'Müşteri kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">Yeni Müşteri Kaydı</h3>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ad *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ÖRN: AHMET"
                className={`${inputClass} uppercase`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Soyad *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ÖRN: YILMAZ"
                className={`${inputClass} uppercase`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                T.C. Kimlik No *
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={tcNumber}
                onChange={(e) => setTcNumber(e.target.value)}
                placeholder="11 haneli T.C."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Telefon *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Doğum Tarihi *
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Adres
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="AÇIK ADRES BİLGİSİ..."
              className={`${inputClass} uppercase resize-y leading-relaxed break-words whitespace-pre-wrap`}
            />
          </div>

          {/* Çok Satırlı Özel Notlar Alanı */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Özel Notlar
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="MÜŞTERİYLE İLGİLİ HATIRLATICI NOTLAR, ÖZEL TALEPLER..."
              className={`${inputClass} uppercase resize-y leading-relaxed break-words whitespace-pre-wrap`}
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
              {loading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}