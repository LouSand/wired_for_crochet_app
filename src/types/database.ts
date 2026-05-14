/**
 * TypeScript types generated from the Supabase database schema.
 * Mirrors the structure of the SQL migration in supabase/migrations/20240101000001_create_tables.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          default_hourly_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      patterns: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: string;
          category: string | null;
          introduction: string | null;
          materials_list: string | null;
          hook_size: string | null;
          yarn_info: string | null;
          gauge: string | null;
          abbreviations: string | null;
          instructions: string | null;
          notes: string | null;
          file_path: string | null;
          file_name: string | null;
          is_published: boolean;
          price: number | null;
          currency: string;
          slug: string | null;
          preview_description: string | null;
          tags: string[];
          view_count: number;
          purchase_count: number;
          average_completion_seconds: number | null;
          completion_count: number;
          terminology: 'uk' | 'us' | 'universal';
          difficulty: string | null;
          stitches_used: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type: string;
          category?: string | null;
          introduction?: string | null;
          materials_list?: string | null;
          hook_size?: string | null;
          yarn_info?: string | null;
          gauge?: string | null;
          abbreviations?: string | null;
          instructions?: string | null;
          notes?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          is_published?: boolean;
          price?: number | null;
          currency?: string;
          slug?: string | null;
          preview_description?: string | null;
          tags?: string[];
          view_count?: number;
          purchase_count?: number;
          average_completion_seconds?: number | null;
          completion_count?: number;
          terminology?: 'uk' | 'us' | 'universal';
          stitches_used?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: string;
          category?: string | null;
          introduction?: string | null;
          materials_list?: string | null;
          hook_size?: string | null;
          yarn_info?: string | null;
          gauge?: string | null;
          abbreviations?: string | null;
          instructions?: string | null;
          notes?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          is_published?: boolean;
          price?: number | null;
          currency?: string;
          slug?: string | null;
          preview_description?: string | null;
          tags?: string[];
          view_count?: number;
          purchase_count?: number;
          average_completion_seconds?: number | null;
          completion_count?: number;
          terminology?: 'uk' | 'us' | 'universal';
          stitches_used?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: string;
          difficulty: string | null;
          customer_name: string | null;
          date_started: string | null;
          date_completed: string | null;
          estimated_completion_date: string | null;
          priority: number | null;
          hourly_rate_override: number | null;
          pattern_id: string | null;
          manual_progress: number | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: string;
          difficulty?: string | null;
          customer_name?: string | null;
          date_started?: string | null;
          date_completed?: string | null;
          estimated_completion_date?: string | null;
          priority?: number | null;
          hourly_rate_override?: number | null;
          pattern_id?: string | null;
          manual_progress?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          difficulty?: string | null;
          customer_name?: string | null;
          date_started?: string | null;
          date_completed?: string | null;
          estimated_completion_date?: string | null;
          priority?: number | null;
          hourly_rate_override?: number | null;
          pattern_id?: string | null;
          manual_progress?: number | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      time_sessions: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          start_time: string;
          end_time?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          note?: string | null;
          created_at?: string;
        };
      };
      counters: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          current_value: number;
          target_value: number | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          name: string;
          current_value?: number;
          target_value?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          name?: string;
          current_value?: number;
          target_value?: number | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      yarn_entries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          colour: string | null;
          shade_code: string | null;
          dye_lot: string | null;
          weight_category: string | null;
          thickness: string | null;
          fibre_content: string | null;
          washing_instructions: string | null;
          recommended_hook_size: string | null;
          quantity_owned: number;
          cost_per_unit: number | null;
          photo_path: string | null;
          label_photo_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          colour?: string | null;
          shade_code?: string | null;
          dye_lot?: string | null;
          weight_category?: string | null;
          thickness?: string | null;
          fibre_content?: string | null;
          washing_instructions?: string | null;
          recommended_hook_size?: string | null;
          quantity_owned?: number;
          cost_per_unit?: number | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string | null;
          colour?: string | null;
          shade_code?: string | null;
          dye_lot?: string | null;
          weight_category?: string | null;
          thickness?: string | null;
          fibre_content?: string | null;
          washing_instructions?: string | null;
          recommended_hook_size?: string | null;
          quantity_owned?: number;
          cost_per_unit?: number | null;
          photo_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      yarn_usages: {
        Row: {
          id: string;
          yarn_entry_id: string;
          project_id: string;
          user_id: string;
          quantity_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          yarn_entry_id: string;
          project_id: string;
          user_id: string;
          quantity_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          yarn_entry_id?: string;
          project_id?: string;
          user_id?: string;
          quantity_used?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      hook_entries: {
        Row: {
          id: string;
          user_id: string;
          size: string;
          type: string | null;
          brand: string | null;
          material: string | null;
          yarn_types: string[] | null;
          pattern_types: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          size: string;
          type?: string | null;
          brand?: string | null;
          material?: string | null;
          yarn_types?: string[] | null;
          pattern_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          size?: string;
          type?: string | null;
          brand?: string | null;
          material?: string | null;
          yarn_types?: string[] | null;
          pattern_types?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      hook_usages: {
        Row: {
          id: string;
          hook_entry_id: string;
          project_id: string;
          user_id: string;
          note: string | null;
          section: string | null;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hook_entry_id: string;
          project_id: string;
          user_id: string;
          note?: string | null;
          section?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hook_entry_id?: string;
          project_id?: string;
          user_id?: string;
          note?: string | null;
          section?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      pattern_versions: {
        Row: {
          id: string;
          pattern_id: string;
          user_id: string;
          instructions: string;
          version_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          pattern_id: string;
          user_id: string;
          instructions: string;
          version_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          pattern_id?: string;
          user_id?: string;
          instructions?: string;
          version_number?: number;
          created_at?: string;
        };
      };
      progress_photos: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          caption: string | null;
          is_final: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          caption?: string | null;
          is_final?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          caption?: string | null;
          is_final?: boolean;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          content: string;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          content: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          content?: string;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pricing_extras: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          description: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          description: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          created_at?: string;
        };
      };
    };
  };
}

// ============================================================
// Convenience type aliases for table rows
// ============================================================

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type Pattern = Database['public']['Tables']['patterns']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type TimeSession = Database['public']['Tables']['time_sessions']['Row'];
export type Counter = Database['public']['Tables']['counters']['Row'];
export type YarnEntry = Database['public']['Tables']['yarn_entries']['Row'];
export type YarnUsage = Database['public']['Tables']['yarn_usages']['Row'];
export type HookEntry = Database['public']['Tables']['hook_entries']['Row'];
export type HookUsage = Database['public']['Tables']['hook_usages']['Row'];
export type PatternVersion = Database['public']['Tables']['pattern_versions']['Row'];
export type ProgressPhoto = Database['public']['Tables']['progress_photos']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type PricingExtra = Database['public']['Tables']['pricing_extras']['Row'];

// Pattern annotations (not in generated types yet — manual definition)
export type PatternAnnotation = {
  id: string;
  project_id: string;
  pattern_id: string;
  user_id: string;
  page_number: number;
  annotation_data: AnnotationStroke[];
  created_at: string;
  updated_at: string;
};

export type AnnotationStroke = {
  id: string;
  type: 'freehand' | 'highlight' | 'text';
  color: string;
  width: number;
  opacity: number;
  points?: Array<{ x: number; y: number }>;
  rect?: { x: number; y: number; w: number; h: number };
  text?: string;
  fontSize?: number;
};

// ============================================================
// Insert type aliases
// ============================================================

export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type PatternInsert = Database['public']['Tables']['patterns']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type TimeSessionInsert = Database['public']['Tables']['time_sessions']['Insert'];
export type CounterInsert = Database['public']['Tables']['counters']['Insert'];
export type YarnEntryInsert = Database['public']['Tables']['yarn_entries']['Insert'];
export type YarnUsageInsert = Database['public']['Tables']['yarn_usages']['Insert'];
export type HookEntryInsert = Database['public']['Tables']['hook_entries']['Insert'];
export type HookUsageInsert = Database['public']['Tables']['hook_usages']['Insert'];
export type PatternVersionInsert = Database['public']['Tables']['pattern_versions']['Insert'];
export type ProgressPhotoInsert = Database['public']['Tables']['progress_photos']['Insert'];
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];
export type PricingExtraInsert = Database['public']['Tables']['pricing_extras']['Insert'];

// ============================================================
// Update type aliases
// ============================================================

export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];
export type PatternUpdate = Database['public']['Tables']['patterns']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type TimeSessionUpdate = Database['public']['Tables']['time_sessions']['Update'];
export type CounterUpdate = Database['public']['Tables']['counters']['Update'];
export type YarnEntryUpdate = Database['public']['Tables']['yarn_entries']['Update'];
export type YarnUsageUpdate = Database['public']['Tables']['yarn_usages']['Update'];
export type HookEntryUpdate = Database['public']['Tables']['hook_entries']['Update'];
export type HookUsageUpdate = Database['public']['Tables']['hook_usages']['Update'];
export type PatternVersionUpdate = Database['public']['Tables']['pattern_versions']['Update'];
export type ProgressPhotoUpdate = Database['public']['Tables']['progress_photos']['Update'];
export type NoteUpdate = Database['public']['Tables']['notes']['Update'];
export type PricingExtraUpdate = Database['public']['Tables']['pricing_extras']['Update'];
