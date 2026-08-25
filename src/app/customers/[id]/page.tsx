'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, Policy, InsuranceCompany } from '@/types/database';
import { getPolicyStatus, PolicyStatusInfo } from '@/lib/policyUtils';
import AddVehicleModal from '@/components/AddVehicleModal';
import AddPolicyModal from '@/components/AddPolicyModal';
import RenewPolicyModal from '@/components/RenewPolicyModal';
import { 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  FileText, 
  Car, 
  Plus, 
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  X,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface EnrichedPolicy extends Policy {
  insurance_companies?: InsuranceCompany;
  vehicles?: Vehicle;
  statusInfo: PolicyStatusInfo;
}

// GG.AA.YYYY formatlayıcı
const formatDateTR = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
  }
  return new Date(dateStr).toLocaleDateString('tr-TR');
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [policies, setPolicies] = useState<EnrichedPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Modallar
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedVehicleForPolicy, setSelectedVehicleForPolicy] = useState<string>('');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedPolicyForRenew, setSelectedPolicyForRenew] = useState<Policy | null>(null);

  // Not Görüntüleme Modalı State
  const [viewingNotePolicy, setViewingNotePolicy] = useState<EnrichedPolicy | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    setLoading(true);
    setNotFound(false);

    try {
      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (custError) throw custError;

      if (!custData) {
        setNotFound(true);
        setCustomer(null);
        return;
      }

      setCustomer(custData);

      const [{ data: vehData }, { data: polData }] = await Promise.all([
        supabase.from('vehicles').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
        supabase
          .from('policies')
          .select('*, insurance_companies(*), vehicles(*)')
          .eq('customer_id', customerId)
          .order('end_date', { ascending: false }),
      ]);

      setVehicles(vehData || []);

      const enrichedPolicies: EnrichedPolicy[] = (polData || []).map((p: any) => ({
        ...p,
        statusInfo: getPolicyStatus(p.end_date),
      }));

      setPolicies(enrichedPolicies);
    } catch (err) {
      console.error('Detaylar getirilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const handleOpenRenewModal = (policy: Policy) => {
    setSelectedPolicyForRenew(policy);
    setIsRenewModalOpen(true);
  };

  const handleOpenNewPolicyModal = (vehicleId: string = '') => {
    setSelectedVehicleForPolicy(vehicleId);
    setIsPolicyModalOpen(true);
  };

  const handleCopyNote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium text-sm">Müşteri detayları yükleniyor...</div>
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Müşteri Bulunamadı</h2>
        <p className="text-xs text-slate-500 mt-1">
          Bu müşteri kaydı silinmiş olabilir veya böyle bir kayıt mevcut değil.
        </p>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Müşteriler Listesine Dön
        </Link>
      </div>
    );
  }

  const unassignedPolicies = policies.filter((p) => !p.vehicle_id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Üst Butonlar */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Müşterilere Dön
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Car className="w-4 h-4 text-blue-600" />
            Araç Ekle
          </button>
          <button
            onClick={() => handleOpenNewPolicyModal('')}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Yeni Poliçe
          </button>
        </div>
      </div>

      {/* Müşteri Profil Kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 uppercase">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-xs font-mono font-bold text-slate-500 mt-0.5 tracking-wider">
              T.C. {customer.tc_number}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Telefon</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{customer.phone}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Doğum Tarihi</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 tracking-wide">
                {formatDateTR(customer.birth_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 md:col-span-1">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-400">Adres</p>
              <p className="text-xs font-bold text-slate-800 uppercase mt-0.5 break-words whitespace-normal leading-relaxed">
                {customer.address || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kayıtlı Araçlar ve Poliçe Takibi */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          Kayıtlı Araçlar ve Poliçe Takibi ({vehicles.length})
        </h2>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">Müşteriye ait kayıtlı araç bulunmuyor.</p>
            <p className="text-slate-400 text-xs mt-1 mb-4">Yukarıdaki &quot;Araç Ekle&quot; butonunu kullanarak yeni araç kaydedebilirsiniz.</p>
          </div>
        ) : (
          vehicles.map((v) => {
            const vehiclePolicies = policies.filter((p) => p.vehicle_id === v.id);

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm bg-slate-900 text-white px-3 py-1 rounded-lg">
                      {v.plate}
                    </span>
                    <div className="text-sm">
                      <span className="font-bold text-slate-900 uppercase">
                        {v.brand} {v.model} {v.year ? `(${v.year})` : ''}
                      </span>
                      <span className="text-xs text-slate-500 ml-2 font-medium">
                        {v.vehicle_type} {v.license_serial ? `• Ruhsat: ${v.license_serial}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenNewPolicyModal(v.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Yeni Poliçe Ekle
                  </button>
                </div>

                {vehiclePolicies.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium">
                    Bu araca ait kayıtlı poliçe bulunmuyor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3">TÜR</th>
                          <th className="px-5 py-3">ŞİRKET</th>
                          <th className="px-5 py-3">POLİÇE NO</th>
                          <th className="px-5 py-3">DÖNEM</th>
                          <th className="px-5 py-3">PRİM</th>
                          <th className="px-5 py-3">DURUM</th>
                          <th className="px-5 py-3 text-right">İŞLEM</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {vehiclePolicies.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {p.policy_type}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-800 uppercase">
                              {p.insurance_companies?.name || '-'}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                              <div>{p.policy_number}</div>
                              {/* Teklif Notu Varsa Buton Göster */}
                              {p.notes && (
                                <button
                                  onClick={() => setViewingNotePolicy(p)}
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium"
                                >
                                  <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                                  Teklif Notu
                                </button>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatDateTR(p.start_date)} - {formatDateTR(p.end_date)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              {p.premium_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.statusInfo.badgeClass}`}>
                                {p.statusInfo.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleOpenRenewModal(p)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all text-xs border border-emerald-200"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Yenile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Diğer Poliçeler (DASK, Konut, Sağlık) */}
        {unassignedPolicies.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Diğer Poliçeler (DASK, Konut, Sağlık)
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">TÜR</th>
                    <th className="px-5 py-3">ŞİRKET</th>
                    <th className="px-5 py-3">POLİÇE NO</th>
                    <th className="px-5 py-3">DÖNEM</th>
                    <th className="px-5 py-3">PRİM</th>
                    <th className="px-5 py-3">DURUM</th>
                    <th className="px-5 py-3 text-right">İŞLEM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {unassignedPolicies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.policy_type}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 uppercase">
                        {p.insurance_companies?.name || '-'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700 font-bold">
                        <div>{p.policy_number}</div>
                        {p.notes && (
                          <button
                            onClick={() => setViewingNotePolicy(p)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                            Teklif Notu
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDateTR(p.start_date)} - {formatDateTR(p.end_date)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {p.premium_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.statusInfo.badgeClass}`}>
                          {p.statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenRenewModal(p)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all text-xs border border-emerald-200"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Yenile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Teklif Karşılaştırması / Poliçe Notu Görüntüleme Penceresi (Modal) */}
      {viewingNotePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 text-blue-600">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Teklif Karşılaştırması & Yenileme Notu
                </h3>
              </div>
              <button
                onClick={() => setViewingNotePolicy(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-500 flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Poliçe: <strong className="text-slate-800">{viewingNotePolicy.policy_number}</strong> ({viewingNotePolicy.policy_type})</span>
                <span>Şirket: <strong className="text-slate-800">{viewingNotePolicy.insurance_companies?.name}</strong></span>
              </div>

              {/* Not / Fiyat Teklifleri Listesi */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto select-all">
                {viewingNotePolicy.notes}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyNote(viewingNotePolicy.notes || '')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Kopyalandı!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      Teklifleri Kopyala
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingNotePolicy(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diğer Modallar */}
      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onSuccess={fetchCustomerDetails}
        customerId={customer.id}
      />

      <AddPolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onSuccess={fetchCustomerDetails}
        customerId={customer.id}
        vehicleId={selectedVehicleForPolicy}
      />

      <RenewPolicyModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setSelectedPolicyForRenew(null);
        }}
        onSuccess={fetchCustomerDetails}
        policy={selectedPolicyForRenew}
      />
    </div>
  );
}