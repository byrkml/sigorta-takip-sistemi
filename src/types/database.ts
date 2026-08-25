export type PolicyType = 'Trafik' | 'Kasko' | 'DASK' | 'Konut' | 'Sağlık' | 'Diğer';

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  tc_number: string;
  phone: string;
  birth_date?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate: string;
  license_serial?: string | null;
  brand: string;
  model: string;
  year?: number | null;
  chassis_number?: string | null;
  motor_number?: string | null;
  vehicle_type: string;
  notes?: string | null;
  created_at?: string;
}

export interface InsuranceCompany {
  id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
}

export interface Policy {
  id: string;
  vehicle_id?: string | null;
  customer_id: string;
  company_id: string;
  policy_type: PolicyType;
  policy_number: string;
  start_date: string;
  end_date: string;
  premium_amount: number;
  currency: string;
  parent_policy_id?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Notification {
  id: string;
  policy_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}