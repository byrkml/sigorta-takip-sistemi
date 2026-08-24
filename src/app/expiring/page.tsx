'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, Policy, InsuranceCompany } from '@/types/database';
import { getPolicyStatus, PolicyStatusInfo } from '@/lib/policyUtils';
import { Clock, ArrowRight, Calendar, Building2, Car } from 'lucide-react';
import Link from 'next/link';

interface EnrichedPolicy extends Policy {
  customers: Customer;
  vehicles: Vehicle;
  insurance_companies: InsuranceCompany;
  statusInfo: PolicyStatusInfo;
}

export default function ExpiringPoliciesPage() {
  const [policies, setPolicies] = useState<EnrichedPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExpiring() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('policies')
          .select('*, customers(*), vehicles(*), insurance_companies(*)')
          .order('end_date', { ascending: true });

        if (error) throw error;

        // Sadece 30 gün ve daha az kalanları filtrele
        const filtered = (data || [])
          .map((pol: any) => ({
            ...pol,
            statusInfo: getPolicyStatus(pol.end_date),
          }))
          .filter((p) => p.statusInfo.daysRemaining >= 0 && p.statusInfo.daysRemaining <= 30);

        setPolicies(filtered);
      } catch (err) {
        console.error('Yaklaşan poliçeler alınamadı:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExpiring();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" />
          Yaklaşan Poliçeler (30 Gün İçi)
        </h1>
        <p className="text-slate-500 text-sm">
          Önümüzdeki 30 gün içinde süresi dolacak ve yenilenmesi gereken tüm poliçeler.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Yükleniyor...</div>
        ) : policies.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">Önümüzdeki 30 gün içinde bitecek poliçe yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Müşteri</th>
                  <th className="px-6 py-3.5">Plaka</th>
                  <th className="px-6 py-3.5">Poliçe Türü</th>
                  <th className="px-6 py-3.5">Bitiş Tarihi</th>
                  <th className="px-6 py-3.5">Kalan Gün</th>
                  <th className="px-6 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {pol.customers?.first_name} {pol.customers?.last_name}
                      <span className="block text-xs font-normal text-slate-400 font-mono">
                        {pol.customers?.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-xs">
                        {pol.vehicles?.plate || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{pol.policy_type}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {new Date(pol.end_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${pol.statusInfo.badgeClass}`}>
                        {pol.statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/customers/${pol.customer_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md"
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