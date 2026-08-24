'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Car, 
  FileText, 
  Users, 
  X, 
  Loader2, 
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'customer' | 'vehicle' | 'policy';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export default function Header() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Arama State'leri
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Bildirim Sayısını Çek
  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Bildirim sayısı alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Canlı Arama Motoru (Debounced)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const searchPromises = [
          // 1. Müşterilerde Ara
          supabase
            .from('customers')
            .select('id, first_name, last_name, tc_number, phone')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,tc_number.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(4),

          // 2. Araçlarda Ara
          supabase
            .from('vehicles')
            .select('id, customer_id, plate, brand, model')
            .or(`plate.ilike.%${q}%,brand.ilike.%${q}%,model.ilike.%${q}%,chassis_number.ilike.%${q}%`)
            .limit(4),

          // 3. Poliçelerde Ara
          supabase
            .from('policies')
            .select('id, customer_id, policy_number, policy_type')
            .or(`policy_number.ilike.%${q}%,policy_type.ilike.%${q}%`)
            .limit(4),
        ];

        const [custRes, vehRes, polRes] = await Promise.all(searchPromises);

        const combined: SearchResult[] = [];

        // Müşteri sonuçları
        (custRes.data || []).forEach((c: any) => {
          combined.push({
            type: 'customer',
            id: c.id,
            title: `${c.first_name} ${c.last_name}`,
            subtitle: `TC: ${c.tc_number} • Tel: ${c.phone}`,
            link: `/customers/${c.id}`,
          });
        });

        // Araç sonuçları
        (vehRes.data || []).forEach((v: any) => {
          combined.push({
            type: 'vehicle',
            id: v.id,
            title: v.plate,
            subtitle: `${v.brand} ${v.model}`,
            link: `/customers/${v.customer_id}`,
          });
        });

        // Poliçe sonuçları
        (polRes.data || []).forEach((p: any) => {
          combined.push({
            type: 'policy',
            id: p.id,
            title: `Poliçe: ${p.policy_number}`,
            subtitle: `${p.policy_type} Sigortası`,
            link: `/customers/${p.customer_id}`,
          });
        });

        setResults(combined);
        setIsOpen(true);
      } catch (err) {
        console.error('Arama sırasında hata oluştu:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Dışarı tıklandığında dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (link: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(link);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Canlı Arama Alanı */}
      <div ref={searchContainerRef} className="relative w-full max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı, plaka, TC veya poliçe no ara..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : query ? (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Canlı Arama Sonuç Dropdown'ı */}
        {isOpen && query.trim().length >= 2 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-xs text-slate-500">
                "{query}" ile eşleşen müşteri, araç veya poliçe bulunamadı.
              </div>
            ) : (
              results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectResult(item.link)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.type === 'customer'
                          ? 'bg-blue-50 text-blue-600'
                          : item.type === 'vehicle'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {item.type === 'customer' && <Users className="w-4 h-4" />}
                      {item.type === 'vehicle' && <Car className="w-4 h-4" />}
                      {item.type === 'policy' && <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sağ Profil & Bildirimler */}
      <div className="flex items-center gap-4">
        <Link
          href="/notifications"
          title="Bildirimler"
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-600 text-[10px] font-bold text-white rounded-full ring-2 ring-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
              {user?.email || 'Acente Danışmanı'}
            </p>
            <p className="text-[11px] text-slate-500">Yetkili Kullanıcı</p>
          </div>
          <button
            onClick={signOut}
            title="Güvenli Çıkış Yap"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}