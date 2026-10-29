export type UserRole = 'admin' | 'employee';

export interface Profile {
  id: string;
  role: UserRole;
  employee_code: string;
  full_name: string;
  phone: string;
  email?: string;
  pin_hash: string;
  avatar_url?: string;
  shift_start_time?: string; // e.g. "09:00:00"
  shift_end_time?: string;   // e.g. "18:00:00"
  is_flexible_shift: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  emergency_contact?: string;
  address?: string;
  preferred_measurement_day: string; // "Saturday", "Monday", etc.
  package_type: string;
  package_start_date: string;
  package_end_date: string;
  default_trainer_id?: string;
  default_trainer?: Profile;
  fitness_goals?: string;
  medical_history?: string;
  status: 'active' | 'paused' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface ClientMeasurement {
  id: string;
  client_id: string;
  client?: Client;
  taken_by_employee_id?: string;
  taken_by_employee?: Profile;
  measurement_date: string;
  weight_kg: number;
  body_fat_percentage?: number;
  chest_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  arms_cm?: number;
  thighs_cm?: number;
  calves_cm?: number;
  shoulders_cm?: number;
  photo_front_url?: string;
  photo_side_url?: string;
  photo_back_url?: string;
  trainer_notes?: string;
  created_at: string;
}

export type ClassStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
export type TravelMode = 'rapido' | 'uber' | 'dropped' | 'self' | 'other';

export interface ClassSession {
  id: string;
  client_id: string;
  client?: Client;
  employee_id: string;
  employee?: Profile;
  class_date: string;
  start_time: string;
  end_time: string;
  scheduled_start_timestamp: string;
  scheduled_end_timestamp: string;
  status: ClassStatus;
  actual_started_at?: string;
  actual_ended_at?: string;
  is_half_day_penalty: boolean;
  penalty_reason?: string;
  start_photo_url?: string;
  travel_mode?: TravelMode;
  travel_dropped_by_name?: string;
  travel_receipt_url?: string;
  session_notes?: string;
  created_at: string;
  updated_at: string;
}

export type AttendanceStatus = 'present' | 'half_day' | 'late' | 'absent';

export interface EmployeeAttendance {
  id: string;
  employee_id: string;
  employee?: Profile;
  attendance_date: string;
  punch_in_time?: string;
  punch_in_latitude?: number;
  punch_in_longitude?: number;
  punch_in_location_name?: string;
  punch_out_time?: string;
  punch_out_latitude?: number;
  punch_out_longitude?: number;
  is_verified_by_pin: boolean;
  total_hours?: number;
  status: AttendanceStatus;
  late_minutes?: number;
  created_at: string;
  updated_at: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'sick' | 'casual' | 'emergency' | 'vacation' | 'unpaid';

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee?: Profile;
  from_date: string;
  to_date: string;
  leave_type: LeaveType;
  description: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewer?: Profile;
  rejection_reason?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';
export type IssueStatus = 'open' | 'in_review' | 'resolved';

export interface IssueEscalation {
  id: string;
  raised_by_employee_id: string;
  employee?: Profile;
  client_id?: string;
  client?: Client;
  category: string;
  title: string;
  description: string;
  photo_url?: string;
  priority: IssuePriority;
  status: IssueStatus;
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

