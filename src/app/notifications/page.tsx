'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/database';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Bildirimler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  // Veritabanındaki otomatik tarama fonksiyonunu tetikle
  const runNotificationScan = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const { data, error } = await supabase.rpc('generate_policy_notifications');
      
      if (error) {
        throw error;
      }

      setStatusMessage('Tarama tamamlandı. Bildirimler güncellendi.');
      await fetchNotifications();
    } catch (err: any) {
      console.error('Tarama hatası:', err);
      setStatusMessage(`Hata: ${err.message || 'Tarama çalıştırılamadı'}`);
    } finally {
      setSyncing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Okundu işaretlenemedi:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Tümü okundu yapılamadı:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Bildirim silinemedi:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Bildirim Merkezi
          </h1>
          <p className="text-slate-500 text-sm">
            Yaklaşan poliçe uyarıları ve sistem bildirimleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runNotificationScan}
            disabled={syncing}
            className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Taranıyor...' : 'Poliçeleri Şimdi Tara'}
          </button>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tümünü Okundu Say
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs font-medium ${
          statusMessage.startsWith('Hata') 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {statusMessage}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Bildirimler yükleniyor...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 font-semibold text-sm">Henüz bildirim bulunmuyor.</p>
            <p className="text-slate-400 text-xs mt-1">
              "Poliçeleri Şimdi Tara" butonuna tıklayarak acil durumları listeye aktarabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  notif.is_read ? 'bg-white opacity-70' : 'bg-blue-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    notif.title.includes('Bugün') 
                      ? 'bg-rose-100 text-rose-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notif.title}
                      </h3>
                      {!notif.is_read && (
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium pt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-all text-xs"
                      title="Okundu İşaretle"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}