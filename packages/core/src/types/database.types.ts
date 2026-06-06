// Tipos do banco AnestheQuest.
// Escrito à mão para a Fase 0; REGENERE com:  npm run gen:types
// (supabase gen types typescript --local --schema public)

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
      profiles: {
        Row: {
          user_id: string;
          nome: string | null;
          crm: string | null;
          especialidade_alvo: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          nome?: string | null;
          crm?: string | null;
          especialidade_alvo?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      exams: {
        Row: { id: string; nome: string; descricao: string | null; created_at: string };
        Insert: { id?: string; nome: string; descricao?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
        Relationships: [];
      };
      taxonomy: {
        Row: {
          id: string;
          parent_id: string | null;
          tipo: Database['public']['Enums']['taxonomy_kind'];
          nome: string;
          slug: string | null;
          ordem: number;
          is_placeholder: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          tipo: Database['public']['Enums']['taxonomy_kind'];
          nome: string;
          slug?: string | null;
          ordem?: number;
          is_placeholder?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['taxonomy']['Insert']>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          enunciado: string;
          tipo: Database['public']['Enums']['question_format'];
          dificuldade: Database['public']['Enums']['question_difficulty'];
          status: Database['public']['Enums']['question_status'];
          versao: number;
          autor_id: string | null;
          revisor_id: string | null;
          enunciado_tsv: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          enunciado: string;
          tipo?: Database['public']['Enums']['question_format'];
          dificuldade?: Database['public']['Enums']['question_difficulty'];
          status?: Database['public']['Enums']['question_status'];
          versao?: number;
          autor_id?: string | null;
          revisor_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
        Relationships: [];
      };
      question_taxonomy: {
        Row: { question_id: string; taxonomy_id: string };
        Insert: { question_id: string; taxonomy_id: string };
        Update: Partial<Database['public']['Tables']['question_taxonomy']['Insert']>;
        Relationships: [];
      };
      choices: {
        // Atenção: is_correct NÃO é selecionável pelo cliente (column privilege).
        Row: {
          id: string;
          question_id: string;
          texto: string;
          is_correct: boolean;
          ordem: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          texto: string;
          is_correct?: boolean;
          ordem?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['choices']['Insert']>;
        Relationships: [];
      };
      explanations: {
        Row: {
          id: string;
          question_id: string;
          texto_geral: string;
          objetivo_educacional: string | null;
          referencias: string | null;
          texto_tsv: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          texto_geral: string;
          objetivo_educacional?: string | null;
          referencias?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['explanations']['Insert']>;
        Relationships: [];
      };
      choice_explanations: {
        Row: { id: string; choice_id: string; texto: string; created_at: string };
        Insert: { id?: string; choice_id: string; texto: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['choice_explanations']['Insert']>;
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          owner_type: Database['public']['Enums']['media_owner'];
          owner_id: string;
          tipo: Database['public']['Enums']['media_kind'];
          url: string;
          storage_path: string | null;
          alt_text: string | null;
          ordem: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_type: Database['public']['Enums']['media_owner'];
          owner_id: string;
          tipo?: Database['public']['Enums']['media_kind'];
          url: string;
          storage_path?: string | null;
          alt_text?: string | null;
          ordem?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['media']['Insert']>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          modo: Database['public']['Enums']['session_mode'];
          filtros_json: Json;
          total_questions: number | null;
          created_at: string;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          modo: Database['public']['Enums']['session_mode'];
          filtros_json?: Json;
          total_questions?: number | null;
          created_at?: string;
          finished_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          question_id: string;
          choice_id_escolhida: string | null;
          correto: boolean;
          tempo_seg: number | null;
          flagged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          question_id: string;
          choice_id_escolhida?: string | null;
          correto: boolean;
          tempo_seg?: number | null;
          flagged?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['attempts']['Insert']>;
        Relationships: [];
      };
      flashcards: {
        Row: {
          id: string;
          user_id: string;
          frente: string;
          verso: string;
          origem_question_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          frente: string;
          verso: string;
          origem_question_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['flashcards']['Insert']>;
        Relationships: [];
      };
      srs_state: {
        Row: {
          id: string;
          flashcard_id: string;
          difficulty: number | null;
          stability: number | null;
          due_date: string | null;
          last_review: string | null;
          reps: number;
          lapses: number;
          state: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          flashcard_id: string;
          difficulty?: number | null;
          stability?: number | null;
          due_date?: string | null;
          last_review?: string | null;
          reps?: number;
          lapses?: number;
          state?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['srs_state']['Insert']>;
        Relationships: [];
      };
      notebook_notes: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          conteudo: string | null;
          taxonomy_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          conteudo?: string | null;
          taxonomy_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notebook_notes']['Insert']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plano: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          provider: Database['public']['Enums']['subscription_provider'];
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plano: Database['public']['Enums']['subscription_plan'];
          status: Database['public']['Enums']['subscription_status'];
          provider: Database['public']['Enums']['subscription_provider'];
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [];
      };
      analytics_aggregates: {
        Row: {
          user_id: string;
          taxonomy_id: string;
          n_correct: number;
          n_total: number;
          avg_time: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          taxonomy_id: string;
          n_correct?: number;
          n_total?: number;
          avg_time?: number | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['analytics_aggregates']['Insert']>;
        Relationships: [];
      };
      question_feedback: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          tipo: Database['public']['Enums']['feedback_kind'];
          texto: string | null;
          resolvido: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          tipo?: Database['public']['Enums']['feedback_kind'];
          texto?: string | null;
          resolvido?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['question_feedback']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_active_subscriber: {
        Args: { uid?: string };
        Returns: boolean;
      };
      grade_attempt: {
        Args: {
          p_session_id: string;
          p_question_id: string;
          p_choice_id: string | null;
          p_tempo_seg?: number | null;
          p_flagged?: boolean;
        };
        Returns: Json;
      };
      set_attempt_flag: {
        Args: { p_attempt_id: string; p_flagged: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      taxonomy_kind: 'subject' | 'system' | 'topic';
      question_format: 'unica_escolha' | 'multipla_escolha';
      question_difficulty: 'facil' | 'media' | 'dificil';
      question_status: 'rascunho' | 'em_revisao' | 'publicada';
      session_mode: 'tutor' | 'timed' | 'timed_tutor' | 'untimed';
      media_owner: 'question' | 'explanation';
      media_kind: 'imagem' | 'video' | 'audio';
      subscription_plan: 'anual' | 'residente';
      subscription_provider: 'stripe' | 'revenuecat';
      subscription_status:
        | 'active'
        | 'trialing'
        | 'past_due'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'unpaid'
        | 'paused';
      feedback_kind:
        | 'erro_conteudo'
        | 'erro_digitacao'
        | 'alternativa_incorreta'
        | 'referencia_incorreta'
        | 'duplicada'
        | 'outro';
    };
    CompositeTypes: Record<string, never>;
  };
}

// Atalhos úteis
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
