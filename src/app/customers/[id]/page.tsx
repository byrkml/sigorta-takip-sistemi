'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, Policy, InsuranceCompany } from '@/types/database';
import AddVehicleModal from '@/components/AddVehicleModal';
import AddPolicyModal from '@/components/AddPolicyModal';
import RenewPolicyModal from '@/components/RenewPolicyModal';
import { getPolicyStatus } from '@/lib/policyUtils';
import { 
  ArrowLeft, 
  Car, 
  Phone, 
  Mail, 
  MapPin, 
  PlusCircle, 
  Calendar,
  FilePlus2,
  RefreshCw,
  History
} from 'lucide-react';
import Link from 'next/link';

interface PolicyWithCompany extends Policy {
  insurance_companies?: InsuranceCompany;
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [policies, setPolicies] = useState<PolicyWithCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicleForPolicy, setSelectedVehicleForPolicy] = useState<string | null>(null);
  const [policyToRenew, setPolicyToRenew] = useState<Policy | null>(null);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (custError) throw custError;
      setCustomer(custData);

      const { data: vehData, error: vehError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (vehError) throw vehError;
      setVehicles(vehData || []);

      const { data: polData, error: polError } = await supabase
        .from('policies')
        .select('*, insurance_companies(*)')
        .eq('customer_id', customerId)
        .order('end_date', { ascending: false });

      if (polError) throw polError;
      setPolicies(polData || []);
    } catch (err) {
      console.error('Detaylar getirilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Müşteri detayları yükleniyor...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-semibold">Müşteri bulunamadı.</p>
        <Link href="/customers" className="text-blue-600 text-sm mt-2 inline-block">
          ← Müşteri listesine dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Üst Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-xs text-slate-500">Müşteri Kimlik ID: {customer.id}</p>
          </div>
        </div>

        <button
          onClick={() => setIsVehicleModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Yeni Araç Ekle
        </button>
      </div>

      {/* Müşteri Bilgi Kartı */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kimlik Bilgisi</span>
          <p className="text-sm font-semibold font-mono text-slate-800">{customer.tc_number}</p>
          <p className="text-xs text-slate-500 mt-1">Not: {customer.notes || '-'}</p>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">İletişim</span>
          <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" /> {customer.phone}
          </p>
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" /> {customer.email || '-'}
          </p>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Adres</span>
          <p className="text-sm text-slate-600 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /> {customer.address || '-'}
          </p>
        </div>
      </div>

      {/* Araçlar ve Poliçeleri */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          Kayıtlı Araçlar ve Poliçe Takibi ({vehicles.length})
        </h2>

        {vehicles.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <Car className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 font-medium">Bu müşteriye ait araç bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {vehicles.map((veh) => {
              const vehiclePolicies = policies.filter((p) => p.vehicle_id === veh.id);

              return (
                <div
                  key={veh.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white font-mono font-bold px-3 py-1 rounded-md text-sm tracking-wider">
                        {veh.plate}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">
                          {veh.brand} {veh.model} {veh.year ? `(${veh.year})` : ''}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          {veh.vehicle_type} • Ruhsat: {veh.license_serial || '-'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedVehicleForPolicy(veh.id)}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      <FilePlus2 className="w-4 h-4" />
                      Yeni Poliçe Ekle
                    </button>
                  </div>

                  <div className="p-4">
                    {vehiclePolicies.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Bu araca ait kayıtlı poliçe bulunamadı.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-100/70 text-slate-700 font-semibold uppercase">
                            <tr>
                              <th className="px-4 py-2.5 rounded-l-lg">Tür</th>
                              <th className="px-4 py-2.5">Şirket</th>
                              <th className="px-4 py-2.5">Poliçe No</th>
                              <th className="px-4 py-2.5">Dönem</th>
                              <th className="px-4 py-2.5">Prim</th>
                              <th className="px-4 py-2.5">Durum</th>
                              <th className="px-4 py-2.5 text-right rounded-r-lg">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {vehiclePolicies.map((pol) => {
                              const status = getPolicyStatus(pol.end_date);
                              return (
                                <tr key={pol.id} className="hover:bg-slate-50/60">
                                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-1.5">
                                    {pol.parent_policy_id && (
                                      <span title="Yenilenmiş Poliçe">
                                        <History className="w-3.5 h-3.5 text-blue-500" />
                                      </span>
                                    )}
                                    {pol.policy_type}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-700">
                                    {pol.insurance_companies?.name || '-'}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-600">
                                    {pol.policy_number}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-800">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      {new Date(pol.start_date).toLocaleDateString('tr-TR')} - {new Date(pol.end_date).toLocaleDateString('tr-TR')}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    {pol.premium_amount.toLocaleString('tr-TR', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    {pol.currency}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ${status.badgeClass}`}
                                    >
                                      {status.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => setPolicyToRenew(pol)}
                                      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded text-xs font-semibold transition-all"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      Yenile
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        customerId={customerId}
        onClose={() => setIsVehicleModalOpen(false)}
        onSuccess={fetchCustomerDetails}
      />

      {selectedVehicleForPolicy && (
        <AddPolicyModal
          isOpen={true}
          customerId={customerId}
          vehicleId={selectedVehicleForPolicy}
          onClose={() => setSelectedVehicleForPolicy(null)}
          onSuccess={fetchCustomerDetails}
        />
      )}

      {policyToRenew && (
        <RenewPolicyModal
          isOpen={true}
          policy={policyToRenew}
          onClose={() => setPolicyToRenew(null)}
          onSuccess={fetchCustomerDetails}
        />
      )}
    </div>
  );
}