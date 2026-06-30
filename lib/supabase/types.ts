// Tipos generados desde el schema de Supabase (Slice 3a)
// Formato compatible con @supabase/supabase-js gen types

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          age: number | null;
          weight_kg: number | null;
          height_cm: number | null;
          experience_level: 'beginner' | 'intermediate' | 'advanced';
          primary_goal:
            | 'lose_weight'
            | 'build_muscle'
            | 'improve_endurance'
            | 'master_skills'
            | 'general_fitness';
          available_days_per_week: number | null;
          available_equipment: string[];
          locale: 'es' | 'en';
          par_q_cleared: boolean;
          par_q_answered_at: string | null;
          assessment_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          experience_level?: 'beginner' | 'intermediate' | 'advanced';
          primary_goal?:
            | 'lose_weight'
            | 'build_muscle'
            | 'improve_endurance'
            | 'master_skills'
            | 'general_fitness';
          available_days_per_week?: number | null;
          available_equipment?: string[];
          locale?: 'es' | 'en';
          par_q_cleared?: boolean;
          par_q_answered_at?: string | null;
          assessment_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          age?: number | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          experience_level?: 'beginner' | 'intermediate' | 'advanced';
          primary_goal?:
            | 'lose_weight'
            | 'build_muscle'
            | 'improve_endurance'
            | 'master_skills'
            | 'general_fitness';
          available_days_per_week?: number | null;
          available_equipment?: string[];
          locale?: 'es' | 'en';
          par_q_cleared?: boolean;
          par_q_answered_at?: string | null;
          assessment_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          slug: string;
          name_es: string;
          name_en: string;
          description_es: string | null;
          description_en: string | null;
          instructions_es: string[];
          instructions_en: string[];
          muscle_groups: string[];
          secondary_muscles: string[];
          equipment_required: string[];
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          category: 'push' | 'pull' | 'core' | 'legs' | 'cardio' | 'mobility' | 'skill';
          image_url: string | null;
          gif_url: string | null;
          video_url: string | null;
          progression_ids: string[];
          regression_ids: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_es: string;
          name_en: string;
          description_es?: string | null;
          description_en?: string | null;
          instructions_es?: string[];
          instructions_en?: string[];
          muscle_groups?: string[];
          secondary_muscles?: string[];
          equipment_required?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          category: 'push' | 'pull' | 'core' | 'legs' | 'cardio' | 'mobility' | 'skill';
          image_url?: string | null;
          gif_url?: string | null;
          video_url?: string | null;
          progression_ids?: string[];
          regression_ids?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_es?: string;
          name_en?: string;
          description_es?: string | null;
          description_en?: string | null;
          instructions_es?: string[];
          instructions_en?: string[];
          muscle_groups?: string[];
          secondary_muscles?: string[];
          equipment_required?: string[];
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          category?: 'push' | 'pull' | 'core' | 'legs' | 'cardio' | 'mobility' | 'skill';
          image_url?: string | null;
          gif_url?: string | null;
          video_url?: string | null;
          progression_ids?: string[];
          regression_ids?: string[];
          is_active?: boolean;
          created_at?: string;
        };
      };
      assessment_results: {
        Row: {
          id: string;
          user_id: string;
          max_pushups: number | null;
          max_pullups: number | null;
          max_squats: number | null;
          max_dips: number | null;
          plank_seconds: number | null;
          notes: string | null;
          assessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          max_pushups?: number | null;
          max_pullups?: number | null;
          max_squats?: number | null;
          max_dips?: number | null;
          plank_seconds?: number | null;
          notes?: string | null;
          assessed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          max_pushups?: number | null;
          max_pullups?: number | null;
          max_squats?: number | null;
          max_dips?: number | null;
          plank_seconds?: number | null;
          notes?: string | null;
          assessed_at?: string;
        };
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          title_es: string | null;
          title_en: string | null;
          generated_by_ai: boolean;
          plan_data: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title_es?: string | null;
          title_en?: string | null;
          generated_by_ai?: boolean;
          plan_data?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title_es?: string | null;
          title_en?: string | null;
          generated_by_ai?: boolean;
          plan_data?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          scheduled_date: string | null;
          completed_at: string | null;
          session_data: Json;
          log_data: Json | null;
          rpe: number | null;
          days_since_last: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          scheduled_date?: string | null;
          completed_at?: string | null;
          session_data?: Json;
          log_data?: Json | null;
          rpe?: number | null;
          days_since_last?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string | null;
          scheduled_date?: string | null;
          completed_at?: string | null;
          session_data?: Json;
          log_data?: Json | null;
          rpe?: number | null;
          days_since_last?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      skill_progress: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          status: 'locked' | 'in_progress' | 'unlocked';
          unlocked_at: string | null;
          personal_best: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          status?: 'locked' | 'in_progress' | 'unlocked';
          unlocked_at?: string | null;
          personal_best?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          status?: 'locked' | 'in_progress' | 'unlocked';
          unlocked_at?: string | null;
          personal_best?: Json | null;
        };
      };
    };
    Enums: {
      experience_level: 'beginner' | 'intermediate' | 'advanced';
      primary_goal:
        | 'lose_weight'
        | 'build_muscle'
        | 'improve_endurance'
        | 'master_skills'
        | 'general_fitness';
      equipment_type: 'bodyweight' | 'bar' | 'ground' | 'wall' | 'dumbbell';
      exercise_category: 'push' | 'pull' | 'core' | 'legs' | 'cardio' | 'mobility' | 'skill';
      exercise_difficulty: 'beginner' | 'intermediate' | 'advanced';
      skill_status: 'locked' | 'in_progress' | 'unlocked';
    };
  };
}
