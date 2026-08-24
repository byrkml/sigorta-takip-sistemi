'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, Policy, InsuranceCompany } from '@/types/database';
import { getPolicyStatus, PolicyStatusInfo } from '@/lib/policyUtils';
import { exportToCSV } from '@/lib/exportUtils';
import { 
  FileText, 
  Search, 
  ArrowRight, 
  Calendar, 
  Building2, 
  RefreshCw,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface EnrichedPolicy extends Policy {
  customers: Customer;
  vehicles: Vehicle;
  insurance_companies: InsuranceCompany;
  statusInfo: PolicyStatusInfo;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<EnrichedPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'upcoming' | 'expired'>('all');

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*, customers(*), vehicles(*), insurance_companies(*)')
        .order('end_date', { ascending: true });

      if (error) throw error;

      const enrichedList: EnrichedPolicy[] = (data || []).map((pol: any) => ({
        ...pol,
        statusInfo: getPolicyStatus(pol.end_date),
      }));

      setPolicies(enrichedList);
    } catch (err) {
      console.error('Poliçeler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const filteredPolicies = policies.filter((pol) => {
    const query = searchTerm.toLowerCase();
    const customerName = `${pol.customers?.first_name || ''} ${pol.customers?.last_name || ''}`.toLowerCase();
    const plate = (pol.vehicles?.plate || '').toLowerCase();
    const policyNum = pol.policy_number.toLowerCase();
    const company = (pol.insurance_companies?.name || '').toLowerCase();

    const matchesSearch =
      customerName.includes(query) ||
      plate.includes(query) ||
      policyNum.includes(query) ||
      company.includes(query);

    const matchesType = selectedType === 'all' || pol.policy_type === selectedType;

    let matchesStatus = true;
    if (statusFilter === 'urgent') {
      matchesStatus = pol.statusInfo.daysRemaining >= 0 && pol.statusInfo.daysRemaining <= 10;
    } else if (statusFilter === 'upcoming') {
      matchesStatus = pol.statusInfo.daysRemaining > 10 && pol.statusInfo.daysRemaining <= 30;
    } else if (statusFilter === 'expired') {
      matchesStatus = pol.statusInfo.daysRemaining < 0;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportCSV = () => {
    const exportData = filteredPolicies.map((p) => ({
      'Müşteri Ad Soyad': `${p.customers?.first_name || ''} ${p.customers?.last_name || ''}`,
      'Telefon': p.customers?.phone || '',
      'T.C. Kimlik': p.customers?.tc_number || '',
      'Plaka': p.vehicles?.plate || 'Araçsız',
      'Araç Modeli': `${p.vehicles?.brand || ''} ${p.vehicles?.model || ''}`,
      'Poliçe Türü': p.policy_type,
      'Sigorta Şirketi': p.insurance_companies?.name || '',
      'Poliçe Numarası': p.policy_number,
      'Başlangıç Tarihi': new Date(p.start_date).toLocaleDateString('tr-TR'),
      'Bitiş Tarihi': new Date(p.end_date).toLocaleDateString('tr-TR'),
      'Prim Tutarı': `${p.premium_amount} ${p.currency}`,
      'Kalan Gün': p.statusInfo.daysRemaining,
      'Durum': p.statusInfo.label,
    }));

    exportToCSV(exportData, 'Policeler_Listesi');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Başlık & Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tüm Poliçeler</h1>
          <p className="text-slate-500 text-sm">
            Sistemde kayıtlı tüm poliçeleri filtreleyin, arayın ve Excel olarak indirin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Excel / CSV İndir
          </button>
          <button
            onClick={fetchPolicies}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      {/* Kontrol Paneli */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Müşteri, plaka, poliçe no, şirket ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tüm Poliçe Türleri</option>
              <option value="Trafik">Trafik Sigortası</option>
              <option value="Kasko">Kasko</option>
              <option value="DASK">DASK</option>
              <option value="Konut">Konut Sigortası</option>
              <option value="Sağlık">Sağlık Sigortası</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                statusFilter === 'urgent'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-red-600'
              }`}
            >
              10 Gün (Acil)
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                statusFilter === 'upcoming'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              11-30 Gün
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                statusFilter === 'expired'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Geçmiş
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Poliçeler yükleniyor...</div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-medium">Kriterlere uygun poliçe bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Müşteri</th>
                  <th className="px-6 py-3.5">Araç / Plaka</th>
                  <th className="px-6 py-3.5">Tür</th>
                  <th className="px-6 py-3.5">Şirket / Poliçe No</th>
                  <th className="px-6 py-3.5">Bitiş Tarihi</th>
                  <th className="px-6 py-3.5">Prim</th>
                  <th className="px-6 py-3.5">Durum</th>
                  <th className="px-6 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPolicies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {pol.customers ? `${pol.customers.first_name} ${pol.customers.last_name}` : '-'}
                      <span className="block text-xs font-normal text-slate-400 font-mono">
                        {pol.customers?.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {pol.vehicles ? (
                        <div>
                          <span className="bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-xs">
                            {pol.vehicles.plate}
                          </span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">
                            {pol.vehicles.brand} {pol.vehicles.model}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Araçsız</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {pol.policy_type}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {pol.insurance_companies?.name || '-'}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {pol.policy_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(pol.end_date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 text-xs">
                      {pol.premium_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      {pol.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${pol.statusInfo.badgeClass}`}>
                        {pol.statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/customers/${pol.customer_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all"
                      >
                        Detay
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}