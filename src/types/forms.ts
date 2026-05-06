/**
 * Form data types used by React Hook Form across the application,
 * and helper union/literal types for constrained fields.
 */

// ============================================================
// Helper types (constrained string unions)
// ============================================================

export type ProjectStatus =
  | 'planned'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned';

export type ProjectDifficulty =
  | 'beginner'
  | 'easy'
  | 'intermediate'
  | 'advanced'
  | 'expert';

export type PatternType = 'written' | 'uploaded';

export type NoteCategory =
  | 'general'
  | 'remember_next_time'
  | 'pattern_alteration';

export type YarnWeightCategory =
  | 'lace'
  | 'fingering'
  | 'sport'
  | 'dk'
  | 'worsted'
  | 'aran'
  | 'bulky'
  | 'super_bulky';

// ============================================================
// Form data types (used with React Hook Form)
// ============================================================

export interface ProjectFormData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  difficulty?: ProjectDifficulty;
  customer_name?: string;
  date_started?: string;
  date_completed?: string;
  hourly_rate_override?: number;
  pattern_id?: string;
}

export interface TimeSessionFormData {
  project_id: string;
  start_time: string;
  end_time?: string;
  note?: string;
}

export interface CounterFormData {
  name: string;
  target_value?: number;
  sort_order?: number;
}

export interface YarnFormData {
  name: string;
  brand?: string;
  colour?: string;
  shade_code?: string;
  dye_lot?: string;
  weight_category?: YarnWeightCategory;
  thickness?: string;
  fibre_content?: string;
  washing_instructions?: string;
  recommended_hook_size?: string;
  quantity_owned?: number;
  cost_per_unit?: number;
}

export interface HookFormData {
  size: string;
  type?: string;
  brand?: string;
  material?: string;
}

export interface PatternFormData {
  title: string;
  type: PatternType;
  introduction?: string;
  materials_list?: string;
  hook_size?: string;
  yarn_info?: string;
  gauge?: string;
  abbreviations?: string;
  instructions?: string;
  notes?: string;
  file_path?: string;
  file_name?: string;
}

export interface NoteFormData {
  content: string;
  category?: NoteCategory;
}

export interface PricingExtrasFormData {
  description: string;
  amount: number;
}

// ============================================================
// Response / computed types
// ============================================================

export interface PricingBreakdown {
  material_cost: number;
  time_cost: number;
  hourly_rate: number;
  total_hours: number;
  extras: Array<{ description: string; amount: number }>;
  extras_total: number;
  subtotal: number;
  profit_margin_percent: number | null;
  profit_margin_fixed: number | null;
  profit_margin_amount: number;
  total: number;
}

export interface PricingOverrides {
  hourly_rate?: number;
  profit_margin_percent?: number;
  profit_margin_fixed?: number;
}
