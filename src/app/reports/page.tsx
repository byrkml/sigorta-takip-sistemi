'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  PieChart, 
  Building2, 
  CircleDollarSign,
  FileCheck2
} from 'lucide-react';

interface ReportData {
  totalPremium: number;
  totalPolicies: number;
  typeDistribution: { [key: string]: number };
  companyDistribution: { [key: string]: { count: number; totalAmount: number } };
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData>({
    totalPremium: 0,
    totalPolicies: 0,
    typeDistribution: {},
    companyDistribution: {},
  });
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*, insurance_companies(name)');

      if (error) throw error;

      const policies = data || [];
      let total = 0;
      const typeDist: { [key: string]: number } = {};
      const compDist: { [key: string]: { count: number; totalAmount: number } } = {};

      policies.forEach((pol: any) => {
        const amount = Number(pol.premium_amount) || 0;
        total += amount;

        // Tür dağılımı
        typeDist[pol.policy_type] = (typeDist[pol.policy_type] || 0) + 1;

        // Şirket dağılımı
        const compName = pol.insurance_companies?.name || 'Belirtilmemiş';
        if (!compDist[compName]) {
          compDist[compName] = { count: 0, totalAmount: 0 };
        }
        compDist[compName].count += 1;
        compDist[compName].totalAmount += amount;
      });

      setReport({
        totalPremium: total,
        totalPolicies: policies.length,
        typeDistribution: typeDist,
        companyDistribution: compDist,
      });
    } catch (err) {
      console.error('Rapor verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Raporlar hazırlanıyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Acente Portföy Raporları
        </h1>
        <p className="text-slate-500 text-sm">
          Toplam poliçe üretimi, prim hacmi ve şirket bazlı ciro dağılımları.
        </p>
      </div>

      {/* Sade Finansal Sayaçlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Prim Üretimi</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {report.totalPremium.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Poliçe Adedi</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{report.totalPolicies} Adet</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Poliçe Türü Dağılım Kartı */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">Poliçe Türü Dağılımı</h2>
          </div>

          <div className="space-y-4 pt-2">
            {Object.keys(report.typeDistribution).length === 0 ? (
              <p className="text-xs text-slate-400">Veri bulunamadı.</p>
            ) : (
              Object.entries(report.typeDistribution).map(([type, count]) => {
                const percentage = ((count / (report.totalPolicies || 1)) * 100).toFixed(1);
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{type} Sigortası</span>
                      <span className="text-slate-500">{count} Adet (%{percentage})</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sigorta Şirketleri Dağılım Tablosu */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">Şirket Bazlı Ciro Dağılımı</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2.5 rounded-l-lg">Şirket</th>
                  <th className="px-3 py-2.5">Poliçe Adedi</th>
                  <th className="px-3 py-2.5 text-right rounded-r-lg">Toplam Tutar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(report.companyDistribution).map(([compName, data]) => (
                  <tr key={compName} className="hover:bg-slate-50/70">
                    <td className="px-3 py-3 font-semibold text-slate-800">{compName}</td>
                    <td className="px-3 py-3 font-medium text-slate-600">{data.count}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 font-mono">
                      {data.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}