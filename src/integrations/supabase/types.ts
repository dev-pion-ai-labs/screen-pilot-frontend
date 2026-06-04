export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignment_enrollments: {
        Row: {
          assigned_at: string
          assignment_id: string
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_id: string
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_enrollments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          ai_generated_content: string | null
          created_at: string
          description: string
          difficulty: string | null
          due_date: string
          estimated_time: number | null
          id: string
          is_sem_end: boolean
          semester: number | null
          status: string | null
          subject: string | null
          teacher_id: string
          title: string
          topic: string | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          ai_generated_content?: string | null
          created_at?: string
          description: string
          difficulty?: string | null
          due_date: string
          estimated_time?: number | null
          id?: string
          is_sem_end?: boolean
          semester?: number | null
          status?: string | null
          subject?: string | null
          teacher_id: string
          title: string
          topic?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          ai_generated_content?: string | null
          created_at?: string
          description?: string
          difficulty?: string | null
          due_date?: string
          estimated_time?: number | null
          id?: string
          is_sem_end?: boolean
          semester?: number | null
          status?: string | null
          subject?: string | null
          teacher_id?: string
          title?: string
          topic?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          id: string
          message: string
          role: string
          timestamp: string
          user_id: string
        }
        Insert: {
          id?: string
          message: string
          role: string
          timestamp?: string
          user_id: string
        }
        Update: {
          id?: string
          message?: string
          role?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          id: string
          name: string
          semester: number
          program: string | null
          specialization: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          semester: number
          program?: string | null
          specialization?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          semester?: number
          program?: string | null
          specialization?: string | null
          created_at?: string
        }
        Relationships: []
      }
      class_teachers: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teacher_subjects: {
        Row: {
          id: string
          class_id: string
          teacher_id: string
          subject_id: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          teacher_id: string
          subject_id: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          teacher_id?: string
          subject_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teacher_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          id: string
          class_id: string
          student_id: string
          created_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id: string
          created_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_users: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          program: string | null
          role: string
          semester: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          program?: string | null
          role: string
          semester?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          program?: string | null
          role?: string
          semester?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          message_type: string | null
          quiz_data: Json | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          quiz_data?: Json | null
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          quiz_data?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "quiz_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_chats: {
        Row: {
          completed_questions: number | null
          created_at: string
          id: string
          score: number | null
          status: string | null
          title: string
          topic: string | null
          total_questions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_questions?: number | null
          created_at?: string
          id?: string
          score?: number | null
          status?: string | null
          title?: string
          topic?: string | null
          total_questions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_questions?: number | null
          created_at?: string
          id?: string
          score?: number | null
          status?: string | null
          title?: string
          topic?: string | null
          total_questions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      script_analyses: {
        Row: {
          analysis_result: Json | null
          chat_messages: Json | null
          created_at: string
          id: string
          script_content: string | null
          script_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          chat_messages?: Json | null
          created_at?: string
          id?: string
          script_content?: string | null
          script_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          chat_messages?: Json | null
          created_at?: string
          id?: string
          script_content?: string | null
          script_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          ai_evaluation: Json | null
          ai_feedback: Json | null
          assignment_id: string
          attachments: Json
          created_at: string
          file_name: string | null
          file_path: string | null
          grade: number | null
          id: string
          script_url: string | null
          status: string | null
          student_id: string
          submission_date: string | null
          teacher_feedback: string | null
          teacher_grade: number | null
          updated_at: string
        }
        Insert: {
          ai_evaluation?: Json | null
          ai_feedback?: Json | null
          assignment_id: string
          attachments?: Json
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          grade?: number | null
          id?: string
          script_url?: string | null
          status?: string | null
          student_id: string
          submission_date?: string | null
          teacher_feedback?: string | null
          teacher_grade?: number | null
          updated_at?: string
        }
        Update: {
          ai_evaluation?: Json | null
          ai_feedback?: Json | null
          assignment_id?: string
          attachments?: Json
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          grade?: number | null
          id?: string
          script_url?: string | null
          status?: string | null
          student_id?: string
          submission_date?: string | null
          teacher_feedback?: string | null
          teacher_grade?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_bank: {
        Row: {
          id: string
          semester: number
          subject_id: string
          grade: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          semester: number
          subject_id: string
          grade: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          semester?: number
          subject_id?: string
          grade?: string
          body?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_bank_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_grades: {
        Row: {
          id: string
          student_id: string
          semester: number
          subject_id: string
          grade: string
          comment_id: string
          teacher_id: string | null
          locked: boolean
          locked_at: string | null
          locked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          semester: number
          subject_id: string
          grade: string
          comment_id: string
          teacher_id?: string | null
          locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          semester?: number
          subject_id?: string
          grade?: string
          comment_id?: string
          teacher_id?: string | null
          locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comment_bank"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_report_card: {
        Row: {
          id: string
          student_id: string
          portfolio_url: string | null
          creative_comment: string | null
          technical_comment: string | null
          professional_comment: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          portfolio_url?: string | null
          creative_comment?: string | null
          technical_comment?: string | null
          professional_comment?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          portfolio_url?: string | null
          creative_comment?: string | null
          technical_comment?: string | null
          professional_comment?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_report_card_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_report_card_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          id: string
          code: string
          name: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_quiz_chats: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          title: string
          created_at: string
          updated_at: string
          status: string
          topic: string
          total_questions: number
          completed_questions: number
          score: number
          message_count: number
        }[]
      }
    }
    Enums: {
      quiz_status: "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      quiz_status: ["in_progress", "completed"],
    },
  },
} as const
