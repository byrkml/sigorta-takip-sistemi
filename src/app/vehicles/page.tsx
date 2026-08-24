'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle, Customer } from '@/types/database';
import { Car, Search, ArrowRight, User, Phone, X } from 'lucide-react';
import Link from 'next/link';

interface VehicleWithCustomer extends Vehicle {
  customers?: Customer;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*, customers(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Araçlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Kapsamlı ve duyarlı arama filtresi
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;

    const plate = (v.plate || '').toLowerCase();
    const brand = (v.brand || '').toLowerCase();
    const model = (v.model || '').toLowerCase();
    const vehicleType = (v.vehicle_type || '').toLowerCase();
    const year = v.year ? v.year.toString() : '';
    const chassis = (v.chassis_number || '').toLowerCase();
    const licenseSerial = (v.license_serial || '').toLowerCase();
    const customerFullName = `${v.customers?.first_name || ''} ${v.customers?.last_name || ''}`.toLowerCase();
    const customerPhone = (v.customers?.phone || '').toLowerCase();
    const customerTc = (v.customers?.tc_number || '').toLowerCase();

    return (
      plate.includes(q) ||
      brand.includes(q) ||
      model.includes(q) ||
      vehicleType.includes(q) ||
      year.includes(q) ||
      chassis.includes(q) ||
      licenseSerial.includes(q) ||
      customerFullName.includes(q) ||
      customerPhone.includes(q) ||
      customerTc.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kayıtlı Araçlar</h1>
          <p className="text-slate-500 text-sm">
            Sistemdeki tüm araçları, plakaları ve sahiplerini anlık olarak arayın.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
          Toplam: <span className="text-blue-600 font-bold">{filteredVehicles.length}</span> / {vehicles.length} Araç
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Arama Barı */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Plaka (örn: 34ABC), marka, model, şasi, müşteri adı veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Aramayı Temizle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Araçlar yükleniyor...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">Aramanıza uygun araç bulunamadı.</p>
            <p className="text-slate-400 text-xs mt-1">Farklı bir plaka veya müşteri adı deneyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Plaka</th>
                  <th className="px-6 py-3.5">Araç Detayı</th>
                  <th className="px-6 py-3.5">Ruhsat Sahibi (Müşteri)</th>
                  <th className="px-6 py-3.5">Şasi / Ruhsat Seri</th>
                  <th className="px-6 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded text-xs tracking-wider">
                        {veh.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm">
                        {veh.brand} {veh.model}
                      </div>
                      <span className="text-xs text-slate-500">
                        {veh.year ? `${veh.year} Modeli • ` : ''}{veh.vehicle_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900 text-xs">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {veh.customers ? `${veh.customers.first_name} ${veh.customers.last_name}` : 'Tanımsız'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {veh.customers?.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-mono text-slate-700">
                        <span className="text-slate-400 text-[10px] block">Şasi No:</span>
                        {veh.chassis_number || '-'}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Ruhsat: {veh.license_serial || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {veh.customer_id && (
                        <Link
                          href={`/customers/${veh.customer_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-all"
                        >
                          Müşteri Detayı
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
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