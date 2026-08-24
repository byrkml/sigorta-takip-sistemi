'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/database';
import AddCustomerModal from '@/components/AddCustomerModal';
import { UserPlus, Search, Phone, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Müşteriler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.toLowerCase();
    const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase();
    return (
      fullName.includes(query) ||
      customer.tc_number.includes(query) ||
      customer.phone.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Müşteriler</h1>
          <p className="text-slate-500 text-sm">
            Sistemde kayıtlı tüm müşterileri görüntüleyin ve yönetin.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Yeni Müşteri Ekle
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ad, soyad, TC veya telefon ile filtrele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Müşteri listesi yükleniyor...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-600 font-medium">Kayıtlı müşteri bulunamadı.</p>
            <p className="text-slate-400 text-xs mt-1">Yeni bir müşteri ekleyerek başlayabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Müşteri</th>
                  <th className="px-6 py-3.5">T.C. Kimlik No</th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">E-posta</th>
                  <th className="px-6 py-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {cust.first_name} {cust.last_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {cust.tc_number.substring(0, 3)}*****{cust.tc_number.substring(8)}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {cust.phone}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {cust.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/customers/${cust.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md hover:bg-blue-100 transition-all"
                      >
                        Detay & Araçlar
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

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}