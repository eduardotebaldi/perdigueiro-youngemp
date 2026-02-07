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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          created_at: string
          data: string
          descricao: string
          gleba_id: string | null
          id: string
          responsavel_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          gleba_id?: string | null
          id?: string
          responsavel_id: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          gleba_id?: string | null
          id?: string
          responsavel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_gleba_id_fkey"
            columns: ["gleba_id"]
            isOneToOne: false
            referencedRelation: "glebas"
            referencedColumns: ["id"]
          },
        ]
      }
      cidades: {
        Row: {
          codigo_ibge: number | null
          created_at: string
          id: string
          nome: string
          planos_diretores: string[] | null
          populacao: number | null
          updated_at: string
        }
        Insert: {
          codigo_ibge?: number | null
          created_at?: string
          id?: string
          nome: string
          planos_diretores?: string[] | null
          populacao?: number | null
          updated_at?: string
        }
        Update: {
          codigo_ibge?: number | null
          created_at?: string
          id?: string
          nome?: string
          planos_diretores?: string[] | null
          populacao?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      glebas: {
        Row: {
          aceita_permuta: Database["public"]["Enums"]["permuta_status"] | null
          apelido: string
          arquivo_contrato: string | null
          arquivo_kmz: string | null
          arquivo_protocolo: string | null
          cidade_id: string | null
          comentarios: string | null
          created_at: string
          data_visita: string | null
          descricao_descarte: string | null
          google_drive_file_id: string | null
          id: string
          imobiliaria_id: string | null
          kml_id: string | null
          last_sync_at: string | null
          motivo_descarte_id: string | null
          numero: number | null
          percentual_permuta: number | null
          poligono_geojson: Json | null
          preco: number | null
          prioridade: boolean
          proprietario_nome: string | null
          responsavel_analise: string | null
          standby_inicio: string | null
          standby_motivo: string | null
          status: Database["public"]["Enums"]["gleba_status"]
          tamanho_lote_minimo: number | null
          tamanho_m2: number | null
          updated_at: string
          zona_plano_diretor: string | null
        }
        Insert: {
          aceita_permuta?: Database["public"]["Enums"]["permuta_status"] | null
          apelido: string
          arquivo_contrato?: string | null
          arquivo_kmz?: string | null
          arquivo_protocolo?: string | null
          cidade_id?: string | null
          comentarios?: string | null
          created_at?: string
          data_visita?: string | null
          descricao_descarte?: string | null
          google_drive_file_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          kml_id?: string | null
          last_sync_at?: string | null
          motivo_descarte_id?: string | null
          numero?: number | null
          percentual_permuta?: number | null
          poligono_geojson?: Json | null
          preco?: number | null
          prioridade?: boolean
          proprietario_nome?: string | null
          responsavel_analise?: string | null
          standby_inicio?: string | null
          standby_motivo?: string | null
          status?: Database["public"]["Enums"]["gleba_status"]
          tamanho_lote_minimo?: number | null
          tamanho_m2?: number | null
          updated_at?: string
          zona_plano_diretor?: string | null
        }
        Update: {
          aceita_permuta?: Database["public"]["Enums"]["permuta_status"] | null
          apelido?: string
          arquivo_contrato?: string | null
          arquivo_kmz?: string | null
          arquivo_protocolo?: string | null
          cidade_id?: string | null
          comentarios?: string | null
          created_at?: string
          data_visita?: string | null
          descricao_descarte?: string | null
          google_drive_file_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          kml_id?: string | null
          last_sync_at?: string | null
          motivo_descarte_id?: string | null
          numero?: number | null
          percentual_permuta?: number | null
          poligono_geojson?: Json | null
          preco?: number | null
          prioridade?: boolean
          proprietario_nome?: string | null
          responsavel_analise?: string | null
          standby_inicio?: string | null
          standby_motivo?: string | null
          status?: Database["public"]["Enums"]["gleba_status"]
          tamanho_lote_minimo?: number | null
          tamanho_m2?: number | null
          updated_at?: string
          zona_plano_diretor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glebas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glebas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glebas_motivo_descarte_id_fkey"
            columns: ["motivo_descarte_id"]
            isOneToOne: false
            referencedRelation: "motivos_descarte"
            referencedColumns: ["id"]
          },
        ]
      }
      imobiliarias: {
        Row: {
          contato_nome: string | null
          created_at: string
          id: string
          link_social: string | null
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          contato_nome?: string | null
          created_at?: string
          id?: string
          link_social?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          contato_nome?: string | null
          created_at?: string
          id?: string
          link_social?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      motivos_descarte: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          arquivo_carta: string | null
          created_at: string
          created_by: string | null
          data_proposta: string
          descricao: string | null
          gleba_id: string
          id: string
          percentual_proposto: number | null
          preco_ha: number | null
          tipo: Database["public"]["Enums"]["tipo_proposta"]
          updated_at: string
        }
        Insert: {
          arquivo_carta?: string | null
          created_at?: string
          created_by?: string | null
          data_proposta?: string
          descricao?: string | null
          gleba_id: string
          id?: string
          percentual_proposto?: number | null
          preco_ha?: number | null
          tipo?: Database["public"]["Enums"]["tipo_proposta"]
          updated_at?: string
        }
        Update: {
          arquivo_carta?: string | null
          created_at?: string
          created_by?: string | null
          data_proposta?: string
          descricao?: string | null
          gleba_id?: string
          id?: string
          percentual_proposto?: number | null
          preco_ha?: number | null
          tipo?: Database["public"]["Enums"]["tipo_proposta"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propostas_gleba_id_fkey"
            columns: ["gleba_id"]
            isOneToOne: false
            referencedRelation: "glebas"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      gleba_status:
        | "identificada"
        | "informacoes_recebidas"
        | "visita_realizada"
        | "proposta_enviada"
        | "protocolo_assinado"
        | "descartada"
        | "proposta_recusada"
        | "negocio_fechado"
        | "standby"
      permuta_status: "incerto" | "nao" | "sim"
      tipo_proposta: "compra" | "parceria" | "mista"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      gleba_status: [
        "identificada",
        "informacoes_recebidas",
        "visita_realizada",
        "proposta_enviada",
        "protocolo_assinado",
        "descartada",
        "proposta_recusada",
        "negocio_fechado",
        "standby",
      ],
      permuta_status: ["incerto", "nao", "sim"],
      tipo_proposta: ["compra", "parceria", "mista"],
    },
  },
} as const
