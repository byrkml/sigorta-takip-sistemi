import { differenceInCalendarDays, parseISO, isPast, isToday } from 'date-fns';

export interface PolicyStatusInfo {
  label: string;
  daysRemaining: number;
  colorClass: string;
  badgeClass: string;
  isUrgent: boolean; // 10 gün ve daha az kala
}

export function getPolicyStatus(endDateStr: string): PolicyStatusInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = parseISO(endDateStr);
  endDate.setHours(0, 0, 0, 0);

  const daysRemaining = differenceInCalendarDays(endDate, today);

  if (daysRemaining < 0) {
    return {
      label: 'Süresi Doldu',
      daysRemaining,
      colorClass: 'text-slate-600',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      isUrgent: false,
    };
  }

  if (daysRemaining === 0) {
    return {
      label: 'Bugün Bitiyor!',
      daysRemaining: 0,
      colorClass: 'text-rose-600 font-bold',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      isUrgent: true,
    };
  }

  if (daysRemaining <= 10) {
    return {
      label: `${daysRemaining} Gün Kaldı (Acil)`,
      daysRemaining,
      colorClass: 'text-red-600 font-semibold',
      badgeClass: 'bg-red-50 text-red-700 border-red-300 font-semibold',
      isUrgent: true,
    };
  }

  if (daysRemaining <= 30) {
    return {
      label: `${daysRemaining} Gün Kaldı`,
      daysRemaining,
      colorClass: 'text-amber-600 font-medium',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
      isUrgent: false,
    };
  }

  return {
    label: `${daysRemaining} Gün Kaldı (Aktif)`,
    daysRemaining,
    colorClass: 'text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    isUrgent: false,
  };
}