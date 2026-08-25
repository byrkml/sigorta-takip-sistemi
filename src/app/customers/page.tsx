'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/database';
import AddCustomerModal from '@/components/AddCustomerModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  ArrowRight, 
  Phone, 
  Calendar,
  RefreshCw 
} from 'lucide-react';
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
      console.error('Müşteriler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const query = searchTerm.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const tc = c.tc_number?.toLowerCase() || '';
    const phone = c.phone?.toLowerCase() || '';
    return fullName.includes(query) || tc.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Üst Başlık & Ekle Butonu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Müşteriler</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistemde kayıtlı tüm müşterileri görüntüleyin ve yönetin.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Yeni Müşteri Ekle
        </button>
      </div>

      {/* Arama & Liste Kartı */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ad, soyad, TC veya telefon ile filtrele..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            onClick={fetchCustomers}
            title="Listeyi Yenile"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm font-medium">
            Müşteriler yükleniyor...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">Müşteri bulunamadı</p>
            <p className="text-slate-400 text-xs mt-1">Arama kriterini değiştirebilir veya yeni müşteri ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Müşteri</th>
                  <th className="px-6 py-4">T.C. Kimlik No</th>
                  <th className="px-6 py-4">Telefon</th>
                  <th className="px-6 py-4">Doğum Tarihi</th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 uppercase">
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-900 font-bold tracking-wide">
                      {customer.tc_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {customer.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                      {customer.birth_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(customer.birth_date).toLocaleDateString('tr-TR')}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
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

      {/* Müşteri Ekle Modal */}
      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}