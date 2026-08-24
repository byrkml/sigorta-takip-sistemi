'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer, Vehicle, Policy, InsuranceCompany } from '@/types/database';
import { getPolicyStatus, PolicyStatusInfo } from '@/lib/policyUtils';
import { cleanPhoneNumber, generateRenewalMessage } from '@/lib/whatsappUtils';
import { 
  Users, 
  Car, 
  FileText, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Building2,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

interface EnrichedPolicy extends Policy {
  customers: Customer;
  vehicles: Vehicle;
  insurance_companies: InsuranceCompany;
  statusInfo: PolicyStatusInfo;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVehicles: 0,
    activePolicies: 0,
    urgentPoliciesCount: 0,
    thirtyDaysPoliciesCount: 0,
    expiredPoliciesCount: 0,
  });

  const [urgentPolicies, setUrgentPolicies] = useState<EnrichedPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [{ count: custCount }, { count: vehCount }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      ]);

      const { data: policiesData, error } = await supabase
        .from('policies')
        .select('*, customers(*), vehicles(*), insurance_companies(*)')
        .order('end_date', { ascending: true });

      if (error) throw error;

      let active = 0;
      let urgent = 0;
      let thirtyDays = 0;
      let expired = 0;
      const urgentList: EnrichedPolicy[] = [];

      (policiesData || []).forEach((pol: any) => {
        const statusInfo = getPolicyStatus(pol.end_date);
        const enriched: EnrichedPolicy = { ...pol, statusInfo };

        if (statusInfo.daysRemaining < 0) {
          expired++;
        } else {
          active++;
          if (statusInfo.daysRemaining <= 10) {
            urgent++;
            urgentList.push(enriched);
          } else if (statusInfo.daysRemaining <= 30) {
            thirtyDays++;
          }
        }
      });

      setStats({
        totalCustomers: custCount || 0,
        totalVehicles: vehCount || 0,
        activePolicies: active,
        urgentPoliciesCount: urgent,
        thirtyDaysPoliciesCount: thirtyDays,
        expiredPoliciesCount: expired,
      });

      setUrgentPolicies(urgentList);
    } catch (err) {
      console.error('Dashboard verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 font-medium text-sm">Dashboard verileri hazırlanıyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Acente Genel Bakış</h1>
        <p className="text-sm text-slate-500 mt-1">
          Portföy durumu ve süresi yaklaşan poliçelerin anlık takibi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Müşteri</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCustomers}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Araç</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalVehicles}</h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktif Poliçeler</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.activePolicies}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
          stats.urgentPoliciesCount > 0 
            ? 'bg-red-50/80 border-red-200 text-red-900' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">10 Gün İçi Bitiş</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.urgentPoliciesCount}</h3>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-red-200/80 shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-red-50 to-white border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-base font-bold text-slate-900">
              🔴 10 Gün İçinde Bitecek Poliçeler ({urgentPolicies.length})
            </h2>
          </div>
          <span className="text-xs text-red-600 font-medium">
            Öncelikli Yenileme Listesi
          </span>
        </div>

        {urgentPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-slate-800 font-semibold text-sm">Harika! 10 gün içinde bitecek acil poliçe bulunmuyor.</p>
            <p className="text-slate-400 text-xs mt-1">Portföyünüzdeki tüm poliçeler güncel ve güvende.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Müşteri</th>
                  <th className="px-6 py-3.5">Plaka</th>
                  <th className="px-6 py-3.5">Poliçe Türü</th>
                  <th className="px-6 py-3.5">Şirket</th>
                  <th className="px-6 py-3.5">Bitiş Tarihi</th>
                  <th className="px-6 py-3.5">Kalan Gün</th>
                  <th className="px-6 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentPolicies.map((pol) => {
                  const phoneFormatted = pol.customers?.phone ? cleanPhoneNumber(pol.customers.phone) : '';
                  const msgEncoded = generateRenewalMessage(
                    `${pol.customers?.first_name} ${pol.customers?.last_name}`,
                    pol.vehicles?.plate || '',
                    pol.policy_type,
                    pol.end_date,
                    pol.insurance_companies?.name
                  );

                  return (
                    <tr key={pol.id} className="hover:bg-red-50/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {pol.customers ? `${pol.customers.first_name} ${pol.customers.last_name}` : 'Bilinmiyor'}
                        <span className="block text-xs font-normal text-slate-400 font-mono">
                          {pol.customers?.phone}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded text-xs">
                          {pol.vehicles?.plate || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {pol.policy_type}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {pol.insurance_companies?.name || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {new Date(pol.end_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${pol.statusInfo.badgeClass}`}>
                          {pol.statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pol.customers?.phone && (
                            <a
                              href={`https://wa.me/${phoneFormatted}?text=${msgEncoded}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-md transition-all"
                              title="WhatsApp ile Hatırlatma Gönder"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          )}
                          <Link
                            href={`/customers/${pol.customer_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-all"
                          >
                            İncele
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">11 - 30 Gün Arası Yaklaşanlar</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Önümüzdeki bir ay içerisinde yenilenmesi gereken <strong>{stats.thirtyDaysPoliciesCount}</strong> adet poliçe bulunuyor.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Süresi Geçmiş / Pasif Poliçeler</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Yenilenmemiş veya süresi dolmuş <strong>{stats.expiredPoliciesCount}</strong> adet poliçe kaydı mevcut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}