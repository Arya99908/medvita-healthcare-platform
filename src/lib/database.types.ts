export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          id: string
          user_id: string | null
          requested_at: string
          reauthenticated_at: string
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          review_note: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          requested_at?: string
          reauthenticated_at: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          requested_at?: string
          reauthenticated_at?: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_note?: string | null
        }
        Relationships: []
      }
      access_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          patient_id: string
          permission: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by: string
          id?: string
          patient_id: string
          permission: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          patient_id?: string
          permission?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_permissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_sources: {
        Row: {
          created_at: string
          id: string
          patient_id: string
          report_id: string
          source_date: string | null
          source_label: string
          source_record_id: string | null
          source_type: string
          visibility: string
        }
        Insert: {
          created_at?: string
          id?: string
          patient_id: string
          report_id: string
          source_date?: string | null
          source_label: string
          source_record_id?: string | null
          source_type: string
          visibility?: string
        }
        Update: {
          created_at?: string
          id?: string
          patient_id?: string
          report_id?: string
          source_date?: string | null
          source_label?: string
          source_record_id?: string | null
          source_type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_sources_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_sources_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          generated_by: string | null
          id: string
          model_name: string | null
          patient_id: string
          provider: string | null
          report_json: Json
          report_type: string
          review_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by?: string | null
          id?: string
          model_name?: string | null
          patient_id: string
          provider?: string | null
          report_json: Json
          report_type: string
          review_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          generated_by?: string | null
          id?: string
          model_name?: string | null
          patient_id?: string
          provider?: string | null
          report_json?: Json
          report_type?: string
          review_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_report_reviews: {
        Row: {
          created_at: string
          doctor_user_id: string
          id: string
          patient_id: string
          report_id: string
          review_note: string
          review_outcome: string
        }
        Insert: {
          created_at?: string
          doctor_user_id: string
          id?: string
          patient_id: string
          report_id: string
          review_note: string
          review_outcome: string
        }
        Update: {
          created_at?: string
          doctor_user_id?: string
          id?: string
          patient_id?: string
          report_id?: string
          review_note?: string
          review_outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_report_reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_report_reviews_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ai_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_report_reviews_patient_report_fk"
            columns: ["patient_id", "report_id"]
            isOneToOne: false
            referencedRelation: "ai_reports"
            referencedColumns: ["patient_id", "id"]
          },
        ]
      }
      allergies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          reaction: string | null
          severity: string | null
          substance: string
          updated_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          reaction?: string | null
          severity?: string | null
          substance: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          reaction?: string | null
          severity?: string | null
          substance?: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string | null
          ends_at: string | null
          event_type: string
          id: string
          location: string | null
          notes: string | null
          patient_id: string
          source: string
          starts_at: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          patient_id: string
          source?: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          ends_at?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          patient_id?: string
          source?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          patient_id: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          patient_id?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          patient_id?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bowel_movement_records: {
        Row: {
          color: string | null
          consistency: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          visibility: string
        }
        Insert: {
          color?: string | null
          consistency?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          visibility?: string
        }
        Update: {
          color?: string | null
          consistency?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "bowel_movement_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_handover_records: {
        Row: {
          created_at: string
          from_user_id: string | null
          handover_text: string
          id: string
          patient_id: string
          to_user_id: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          handover_text: string
          id?: string
          patient_id: string
          to_user_id?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          handover_text?: string
          id?: string
          patient_id?: string
          to_user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_handover_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_availability: {
        Row: {
          availability_status: string
          display_name: string
          id: string
          note: string | null
          patient_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_status: string
          display_name: string
          id?: string
          note?: string | null
          patient_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_status?: string
          display_name?: string
          id?: string
          note?: string | null
          patient_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_availability_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          notes: string | null
          patient_id: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          amends_note_id: string | null
          body: string
          created_at: string
          doctor_user_id: string
          follow_up_on: string | null
          id: string
          note_kind: string
          patient_id: string
          title: string
        }
        Insert: {
          amends_note_id?: string | null
          body: string
          created_at?: string
          doctor_user_id: string
          follow_up_on?: string | null
          id?: string
          note_kind: string
          patient_id: string
          title: string
        }
        Update: {
          amends_note_id?: string | null
          body?: string
          created_at?: string
          doctor_user_id?: string
          follow_up_on?: string | null
          id?: string
          note_kind?: string
          patient_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_amends_note_id_fkey"
            columns: ["amends_note_id"]
            isOneToOne: false
            referencedRelation: "clinical_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string
          granted_to: string | null
          id: string
          patient_id: string
          purpose: string
          revoked_at: string | null
          scope: string
          starts_at: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by: string
          granted_to?: string | null
          id?: string
          patient_id: string
          purpose: string
          revoked_at?: string | null
          scope: string
          starts_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          granted_to?: string | null
          id?: string
          patient_id?: string
          purpose?: string
          revoked_at?: string | null
          scope?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      developmental_milestones: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string
          follow_up_on: string | null
          id: string
          milestone_name: string
          notes: string | null
          patient_id: string
          reminder_enabled: boolean
          reminder_timezone: string
          recorded_on: string
          source: string
          status: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain: string
          follow_up_on?: string | null
          id?: string
          milestone_name: string
          notes?: string | null
          patient_id: string
          reminder_enabled?: boolean
          reminder_timezone?: string
          recorded_on?: string
          source?: string
          status: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string
          follow_up_on?: string | null
          id?: string
          milestone_name?: string
          notes?: string | null
          patient_id?: string
          reminder_enabled?: boolean
          reminder_timezone?: string
          recorded_on?: string
          source?: string
          status?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "developmental_milestones_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          created_at: string
          display_name: string
          id: string
          organisation: string | null
          specialty: string | null
          updated_at: string
          user_id: string | null
          verification_status: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          organisation?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          organisation?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      doctor_verification_submissions: {
        Row: {
          doctor_id: string
          issuing_jurisdiction: string
          registration_number: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          doctor_id: string
          issuing_jurisdiction: string
          registration_number: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          doctor_id?: string
          issuing_jurisdiction?: string
          registration_number?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_verification_submissions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: true
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_alerts: {
        Row: {
          alert_type: string
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          patient_id: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          patient_id: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          patient_id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          patient_id: string
          phone: string
          priority: number
          relationship: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          patient_id: string
          phone: string
          priority?: number
          relationship?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          patient_id?: string
          phone?: string
          priority?: number
          relationship?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_document_data: {
        Row: {
          created_at: string
          document_id: string
          extracted_fields: Json
          id: string
          patient_id: string
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          document_id: string
          extracted_fields?: Json
          id?: string
          patient_id: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          extracted_fields?: Json
          id?: string
          patient_id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_document_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_document_data_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_records: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number | null
          feeding_type: string
          id: string
          notes: string | null
          patient_id: string
          quantity_ml: number | null
          recorded_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          feeding_type: string
          id?: string
          notes?: string | null
          patient_id: string
          quantity_ml?: number | null
          recorded_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number | null
          feeding_type?: string
          id?: string
          notes?: string | null
          patient_id?: string
          quantity_ml?: number | null
          recorded_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_records: {
        Row: {
          created_at: string
          created_by: string | null
          head_circumference_cm: number | null
          height_cm: number | null
          id: string
          measured_at: string
          patient_id: string
          source: string
          visibility: string
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_at?: string
          patient_id: string
          source?: string
          visibility?: string
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          head_circumference_cm?: number | null
          height_cm?: number | null
          id?: string
          measured_at?: string
          patient_id?: string
          source?: string
          visibility?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guardianships: {
        Row: {
          consent_status: string
          created_at: string
          evidence_reference: string | null
          guardian_user_id: string
          id: string
          patient_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          consent_status?: string
          created_at?: string
          evidence_reference?: string | null
          guardian_user_id: string
          id?: string
          patient_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          consent_status?: string
          created_at?: string
          evidence_reference?: string | null
          guardian_user_id?: string
          id?: string
          patient_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardianships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          occurred_at: string
          patient_id: string
          source: string
          title: string
          updated_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          patient_id: string
          source?: string
          title: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          patient_id?: string
          source?: string
          title?: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_admissions: {
        Row: {
          admitted_at: string
          created_at: string
          created_by: string | null
          discharge_document_id: string | null
          discharged_at: string | null
          hospital_id: string | null
          id: string
          patient_id: string
          summary: string | null
          visibility: string
        }
        Insert: {
          admitted_at: string
          created_at?: string
          created_by?: string | null
          discharge_document_id?: string | null
          discharged_at?: string | null
          hospital_id?: string | null
          id?: string
          patient_id: string
          summary?: string | null
          visibility?: string
        }
        Update: {
          admitted_at?: string
          created_at?: string
          created_by?: string | null
          discharge_document_id?: string | null
          discharged_at?: string | null
          hospital_id?: string | null
          id?: string
          patient_id?: string
          summary?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospital_admissions_discharge_document_id_fkey"
            columns: ["discharge_document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_admissions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_admissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_visits: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string | null
          hospital_id: string | null
          id: string
          notes: string | null
          patient_id: string
          visibility: string
          visit_date: string
          visit_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          visibility?: string
          visit_date: string
          visit_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          hospital_id?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          visibility?: string
          visit_date?: string
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hospital_visits_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_visits_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      laboratory_results: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string | null
          id: string
          patient_id: string
          reference_range: string | null
          result_date: string | null
          test_name: string
          unit: string | null
          value_text: string | null
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          patient_id: string
          reference_range?: string | null
          result_date?: string | null
          test_name: string
          unit?: string | null
          value_text?: string | null
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          id?: string
          patient_id?: string
          reference_range?: string | null
          result_date?: string | null
          test_name?: string
          unit?: string | null
          value_text?: string | null
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laboratory_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_conditions: {
        Row: {
          created_at: string
          created_by: string | null
          diagnosed_on: string | null
          id: string
          name: string
          notes: string | null
          patient_id: string
          reported_by: string
          status: string
          updated_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          diagnosed_on?: string | null
          id?: string
          name: string
          notes?: string | null
          patient_id: string
          reported_by?: string
          status?: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          diagnosed_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          patient_id?: string
          reported_by?: string
          status?: string
          updated_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          display_name: string
          document_date: string | null
          document_type: string
          id: string
          patient_id: string
          storage_path: string
          updated_at: string
          upload_status: string
          uploaded_by: string | null
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_name: string
          document_date?: string | null
          document_type: string
          id?: string
          patient_id: string
          storage_path: string
          updated_at?: string
          upload_status?: string
          uploaded_by?: string | null
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string
          document_date?: string | null
          document_type?: string
          id?: string
          patient_id?: string
          storage_path?: string
          updated_at?: string
          upload_status?: string
          uploaded_by?: string | null
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_administration_logs: {
        Row: {
          administered_at: string
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          patient_id: string
          recorded_by: string | null
          schedule_id: string | null
          status: string
          visibility: string
        }
        Insert: {
          administered_at?: string
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          patient_id: string
          recorded_by?: string | null
          schedule_id?: string | null
          status: string
          visibility?: string
        }
        Update: {
          administered_at?: string
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          patient_id?: string
          recorded_by?: string | null
          schedule_id?: string | null
          status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administration_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medication_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_administration_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_administration_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "medication_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_records: {
        Row: {
          created_at: string
          created_by: string | null
          generic_name: string | null
          id: string
          instructions: string | null
          medicine_name: string
          patient_id: string
          prescribed_by: string | null
          prescription_document_id: string | null
          route: string | null
          status: string
          strength: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          medicine_name: string
          patient_id: string
          prescribed_by?: string | null
          prescription_document_id?: string | null
          route?: string | null
          status?: string
          strength?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          medicine_name?: string
          patient_id?: string
          prescribed_by?: string | null
          prescription_document_id?: string | null
          route?: string | null
          status?: string
          strength?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_schedules: {
        Row: {
          administration_times: Json
          created_at: string
          created_by: string | null
          ends_on: string | null
          frequency: string
          id: string
          medication_id: string
          patient_id: string
          reminder_enabled: boolean
          reminder_days: number[]
          reminder_timezone: string
          starts_on: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          administration_times?: Json
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          frequency: string
          id?: string
          medication_id: string
          patient_id: string
          reminder_enabled?: boolean
          reminder_days?: number[]
          reminder_timezone?: string
          starts_on?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          administration_times?: Json
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          frequency?: string
          id?: string
          medication_id?: string
          patient_id?: string
          reminder_enabled?: boolean
          reminder_days?: number[]
          reminder_timezone?: string
          starts_on?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_schedules_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medication_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_schedules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menstrual_records: {
        Row: {
          created_at: string
          created_by: string | null
          flow_note: string | null
          id: string
          patient_id: string
          period_end: string | null
          period_start: string | null
          symptom_note: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          flow_note?: string | null
          id?: string
          patient_id: string
          period_end?: string | null
          period_start?: string | null
          symptom_note?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          flow_note?: string | null
          id?: string
          patient_id?: string
          period_end?: string | null
          period_start?: string | null
          symptom_note?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "menstrual_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          channel: string
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          channel: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          channel?: string
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          dedupe_key: string | null
          delivery_status: string
          id: string
          message: string
          patient_id: string | null
          read_at: string | null
          scheduled_at: string | null
          sent_at: string | null
          title: string
          user_id: string
          visibility: string
        }
        Insert: {
          category: string
          created_at?: string
          dedupe_key?: string | null
          delivery_status?: string
          id?: string
          message: string
          patient_id?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          title: string
          user_id: string
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          dedupe_key?: string | null
          delivery_status?: string
          id?: string
          message?: string
          patient_id?: string | null
          read_at?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invitations: {
        Row: {
          accepted_at: string | null
          can_write: boolean
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          patient_id: string
          relationship_role: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          can_write?: boolean
          created_at?: string
          expires_at: string
          id?: string
          invited_by: string
          invited_email: string
          patient_id: string
          relationship_role: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          can_write?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          patient_id?: string
          relationship_role?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_invitations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_profiles: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          date_of_birth: string | null
          display_name: string
          id: string
          is_demo: boolean
          life_stage: string
          preferred_language: string
          sex_at_birth: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          date_of_birth?: string | null
          display_name: string
          id?: string
          is_demo?: boolean
          life_stage: string
          preferred_language?: string
          sex_at_birth?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          date_of_birth?: string | null
          display_name?: string
          id?: string
          is_demo?: boolean
          life_stage?: string
          preferred_language?: string
          sex_at_birth?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_activity_events: {
        Row: {
          action: string
          actor_user_id: string | null
          id: string
          occurred_at: string
          patient_id: string
          resource_id: string | null
          resource_type: string
          visibility: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          id?: string
          occurred_at?: string
          patient_id: string
          resource_id?: string | null
          resource_type: string
          visibility?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          id?: string
          occurred_at?: string
          patient_id?: string
          resource_id?: string | null
          resource_type?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_activity_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_relationships: {
        Row: {
          can_read: boolean
          can_write: boolean
          created_at: string
          created_by: string
          id: string
          patient_id: string
          relationship_role: string
          revoked_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          created_by: string
          id?: string
          patient_id: string
          relationship_role: string
          revoked_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          created_by?: string
          id?: string
          patient_id?: string
          relationship_role?: string
          revoked_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_relationships_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_sharing_sessions: {
        Row: {
          access_scope: string[]
          created_at: string
          created_by: string
          expires_at: string
          id: string
          patient_id: string
          revoked_at: string | null
          token_hash: string
          visibility: string
        }
        Insert: {
          access_scope?: string[]
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          patient_id: string
          revoked_at?: string | null
          token_hash: string
          visibility?: string
        }
        Update: {
          access_scope?: string[]
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          patient_id?: string
          revoked_at?: string | null
          token_hash?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_sharing_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      sleep_records: {
        Row: {
          created_at: string
          created_by: string | null
          ended_at: string
          id: string
          notes: string | null
          patient_id: string
          sleep_type: string
          source: string
          started_at: string
          verification_status: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ended_at: string
          id?: string
          notes?: string | null
          patient_id: string
          sleep_type: string
          source?: string
          started_at: string
          verification_status?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ended_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          sleep_type?: string
          source?: string
          started_at?: string
          verification_status?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      symptom_observations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          observed_at: string
          patient_id: string
          severity: number | null
          symptom: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          observed_at?: string
          patient_id: string
          severity?: number | null
          symptom: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          observed_at?: string
          patient_id?: string
          severity?: number | null
          symptom?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      urination_records: {
        Row: {
          count: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          recorded_at: string
          source: string
          urination_type: string
          verification_status: string
          visibility: string
          volume_ml: number | null
        }
        Insert: {
          count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          recorded_at?: string
          source?: string
          urination_type: string
          verification_status?: string
          visibility?: string
          volume_ml?: number | null
        }
        Update: {
          count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          source?: string
          urination_type?: string
          verification_status?: string
          visibility?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "urination_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          administered_on: string | null
          created_at: string
          created_by: string | null
          document_id: string | null
          dose_label: string | null
          due_on: string | null
          id: string
          notes: string | null
          patient_id: string
          reminder_enabled: boolean
          reminder_timezone: string
          source: string
          status: string
          vaccine_name: string
          verification_status: string
        }
        Insert: {
          administered_on?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          dose_label?: string | null
          due_on?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reminder_enabled?: boolean
          reminder_timezone?: string
          source?: string
          status?: string
          vaccine_name: string
          verification_status?: string
        }
        Update: {
          administered_on?: string | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          dose_label?: string | null
          due_on?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_enabled?: boolean
          reminder_timezone?: string
          source?: string
          status?: string
          vaccine_name?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_document_patient_fk"
            columns: ["document_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id", "patient_id"]
          },
          {
            foreignKeyName: "vaccination_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          measured_at: string
          patient_id: string
          source: string
          unit: string
          value: number
          verification_status: string
          visibility: string
          vital_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string
          patient_id: string
          source?: string
          unit: string
          value: number
          verification_status?: string
          visibility?: string
          vital_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          measured_at?: string
          patient_id?: string
          source?: string
          unit?: string
          value?: number
          verification_status?: string
          visibility?: string
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vomiting_records: {
        Row: {
          associated_notes: string | null
          count: number
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          recorded_at: string
          visibility: string
        }
        Insert: {
          associated_notes?: string | null
          count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          recorded_at?: string
          visibility?: string
        }
        Update: {
          associated_notes?: string | null
          count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          recorded_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "vomiting_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_plans: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          patient_id: string
          source: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id: string
          source?: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          patient_id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_records: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          plan_id: string | null
          record_type: string
          recorded_at: string
          value: Json
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          plan_id?: string | null
          record_type: string
          recorded_at?: string
          value?: Json
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          plan_id?: string | null
          record_type?: string
          recorded_at?: string
          value?: Json
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wellness_records_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "wellness_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_patient_invitation: {
        Args: { p_invitation_token: string }
        Returns: string
      }
      create_patient_invitation: {
        Args: { p_can_write?: boolean; p_invited_email: string; p_patient_id: string; p_relationship_role: string }
        Returns: { invitation_expires_at: string; invitation_id: string; invitation_token: string }[]
      }
      create_patient_profile: {
        Args: {
          p_date_of_birth?: string
          p_display_name: string
          p_guardian_attested?: boolean
          p_life_stage: string
          p_preferred_language?: string
        }
        Returns: string
      }
      export_my_data: { Args: never; Returns: Json }
      review_doctor_application: {
        Args: { p_decision: string; p_doctor_id: string; p_reason?: string | null }
        Returns: boolean
      }
      review_account_deletion_request: {
        Args: { p_decision: string; p_note: string; p_request_id: string }
        Returns: undefined
      }
      revoke_patient_invitation: {
        Args: { p_invitation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
