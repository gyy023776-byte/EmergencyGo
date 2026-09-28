export interface HospitalCapacity {
  icu_total: number;
  icu_available: number;
  general_total: number;
  general_available: number;
  ventilators_total: number;
  ventilators_available: number;
  oxygen_supply_percent: number;
  blood_bank: {
    'A+': number;
    'A-': number;
    'B+': number;
    'B-': number;
    'O+': number;
    'O-': number;
    'AB+': number;
    'AB-': number;
  };
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  emergency_status: 'OPEN' | 'ON_DIVERSION' | 'CRITICAL_CAPACITY';
  capabilities: string[]; // e.g. ['Trauma Level 1', 'Cardiac Cath Lab', '24/7 ER', 'Pediatric ICU', 'Stroke Center', 'Burn Unit', 'Helipad', 'Organ Transplant']
  latitude: number;
  longitude: number;
  distance_km?: number;
  drive_time_mins?: number;
  capacity: HospitalCapacity;
  rating?: number;
  updated_at: string;
}

export type AmbulanceType = 'ALS' | 'BLS' | 'MICU';
export type AmbulanceStatus = 'available' | 'dispatched' | 'en_route_pickup' | 'on_scene' | 'transporting' | 'maintenance';

export interface Ambulance {
  id: string;
  call_sign: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  driver_id?: string;
  vehicle_type: AmbulanceType;
  status: AmbulanceStatus;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  bearing: number;
  oxygen_level_pct: number;
  battery_level_pct: number;
  assigned_dispatch_id?: string | null;
  target_hospital_id?: string | null;
  distance_to_patient_km?: number;
  eta_to_patient_mins?: number;
  updated_at: string;
}

export type EmergencyCategory = 
  | 'Cardiac Arrest'
  | 'Severe Trauma / Accident'
  | 'Respiratory Failure'
  | 'Acute Stroke'
  | 'Maternity / OB Emergency'
  | 'Severe Bleeding'
  | 'Pediatric Emergency';

export type EmergencyPriority = 'P1_CODE_RED' | 'P2_URGENT' | 'P3_ROUTINE';

export type DispatchStatus = 
  | 'pending'
  | 'assigned'
  | 'en_route_pickup'
  | 'patient_onboard'
  | 'en_route_hospital'
  | 'arrived_hospital'
  | 'completed'
  | 'cancelled';

export interface PatientVitals {
  heart_rate_bpm?: number;
  spo2_percent?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiratory_rate?: number;
  consciousness?: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
}

export interface Dispatch {
  id: string;
  caller_name: string;
  caller_phone: string;
  emergency_category: EmergencyCategory;
  priority: EmergencyPriority;
  patient_lat: number;
  patient_lng: number;
  patient_address: string;
  notes: string;
  assigned_ambulance_id?: string | null;
  assigned_ambulance?: Ambulance | null;
  target_hospital_id?: string | null;
  target_hospital?: Hospital | null;
  status: DispatchStatus;
  eta_minutes: number;
  route_coordinates: [number, number][]; // [lat, lng] array
  route_step: number;
  vitals: PatientVitals;
  sms_dispatched: boolean;
  hospital_alerted: boolean;
  bed_reserved: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  role: 'patient' | 'driver' | 'hospital_admin';
  name: string;
  email: string;
  phone: string;
  password?: string;
  has_password?: boolean;
  badge?: string;
  assigned_unit?: string;
  location?: { lat: number; lng: number };
}

export interface SystemConfig {
  database_type: 'postgres' | 'local_postgis' | 'cloud_sql_postgres';
  database_url: string;
  is_connected: boolean;
  connection_error?: string | null;
  postgis_enabled: boolean;
  city: string;
  center_lat: number;
  center_lng: number;
  maps_api_key?: string;
  twilio_configured: boolean;
  last_osm_sync?: string | null;
  total_hospitals: number;
  total_ambulances: number;
  active_dispatches: number;
}

export interface UserFeedback {
  id: string;
  user_name: string;
  user_phone?: string;
  user_email?: string;
  role?: string;
  category: 'ambulance_speed' | 'hospital_accuracy' | 'paramedic_care' | 'app_maps' | 'suggestion_bug' | 'general';
  rating: number; // 1 to 5
  tags: string[];
  comments: string;
  city?: string;
  created_at: string;
}

