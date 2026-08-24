'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  FileText, 
  Clock, 
  Bell, 
  Building2, 
  ShieldCheck,
  BarChart3
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Müşteriler', href: '/customers', icon: Users },
  { name: 'Araçlar', href: '/vehicles', icon: Car },
  { name: 'Poliçeler', href: '/policies', icon: FileText },
  { name: 'Yaklaşan Poliçeler', href: '/expiring', icon: Clock },
  { name: 'Bildirimler', href: '/notifications', icon: Bell },
  { name: 'Sigorta Şirketleri', href: '/companies', icon: Building2 },
  { name: 'Raporlar', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">SigortaTakip</h1>
          <span className="text-xs text-slate-400">Acente Yönetim Paneli</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

    <div className="p-4 border-t border-slate-800">
    <div className="text-xs text-slate-500 text-center space-y-1">
        <div>v1.0.0 • Güvenli Acente Portalı</div>
        <div>© 2026 Kemal Bayır. Tüm hakları saklıdır.</div>
    </div>
    </div>
    </aside>
  );
}