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
      annotation_tag_entity: {
        Row: {
          createdAt: string
          id: string
          name: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          updatedAt?: string
        }
        Relationships: []
      }
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
      auth_identity: {
        Row: {
          createdAt: string
          providerId: string
          providerType: string
          updatedAt: string
          userId: string | null
        }
        Insert: {
          createdAt?: string
          providerId: string
          providerType: string
          updatedAt?: string
          userId?: string | null
        }
        Update: {
          createdAt?: string
          providerId?: string
          providerType?: string
          updatedAt?: string
          userId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_identity_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_provider_sync_history: {
        Row: {
          created: number
          disabled: number
          endedAt: string
          error: string | null
          id: number
          providerType: string
          runMode: string
          scanned: number
          startedAt: string
          status: string
          updated: number
        }
        Insert: {
          created: number
          disabled: number
          endedAt?: string
          error?: string | null
          id?: number
          providerType: string
          runMode: string
          scanned: number
          startedAt?: string
          status: string
          updated: number
        }
        Update: {
          created?: number
          disabled?: number
          endedAt?: string
          error?: string | null
          id?: number
          providerType?: string
          runMode?: string
          scanned?: number
          startedAt?: string
          status?: string
          updated?: number
        }
        Relationships: []
      }
      binary_data: {
        Row: {
          createdAt: string
          data: string
          fileId: string
          fileName: string | null
          fileSize: number
          mimeType: string | null
          sourceId: string
          sourceType: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          data: string
          fileId: string
          fileName?: string | null
          fileSize: number
          mimeType?: string | null
          sourceId: string
          sourceType: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          data?: string
          fileId?: string
          fileName?: string | null
          fileSize?: number
          mimeType?: string | null
          sourceId?: string
          sourceType?: string
          updatedAt?: string
        }
        Relationships: []
      }
      chat_hub_agents: {
        Row: {
          createdAt: string
          credentialId: string | null
          description: string | null
          icon: Json | null
          id: string
          model: string
          name: string
          ownerId: string
          provider: string
          systemPrompt: string
          tools: Json
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          credentialId?: string | null
          description?: string | null
          icon?: Json | null
          id: string
          model: string
          name: string
          ownerId: string
          provider: string
          systemPrompt: string
          tools?: Json
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          credentialId?: string | null
          description?: string | null
          icon?: Json | null
          id?: string
          model?: string
          name?: string
          ownerId?: string
          provider?: string
          systemPrompt?: string
          tools?: Json
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_441ba2caba11e077ce3fbfa2cd8"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_9c61ad497dcbae499c96a6a78ba"
            columns: ["credentialId"]
            isOneToOne: false
            referencedRelation: "credentials_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_hub_messages: {
        Row: {
          agentId: string | null
          attachments: Json | null
          content: string
          createdAt: string
          executionId: number | null
          id: string
          model: string | null
          name: string
          previousMessageId: string | null
          provider: string | null
          retryOfMessageId: string | null
          revisionOfMessageId: string | null
          sessionId: string
          status: string
          type: string
          updatedAt: string
          workflowId: string | null
        }
        Insert: {
          agentId?: string | null
          attachments?: Json | null
          content: string
          createdAt?: string
          executionId?: number | null
          id: string
          model?: string | null
          name: string
          previousMessageId?: string | null
          provider?: string | null
          retryOfMessageId?: string | null
          revisionOfMessageId?: string | null
          sessionId: string
          status?: string
          type: string
          updatedAt?: string
          workflowId?: string | null
        }
        Update: {
          agentId?: string | null
          attachments?: Json | null
          content?: string
          createdAt?: string
          executionId?: number | null
          id?: string
          model?: string | null
          name?: string
          previousMessageId?: string | null
          provider?: string | null
          retryOfMessageId?: string | null
          revisionOfMessageId?: string | null
          sessionId?: string
          status?: string
          type?: string
          updatedAt?: string
          workflowId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_1f4998c8a7dec9e00a9ab15550e"
            columns: ["revisionOfMessageId"]
            isOneToOne: false
            referencedRelation: "chat_hub_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_25c9736e7f769f3a005eef4b372"
            columns: ["retryOfMessageId"]
            isOneToOne: false
            referencedRelation: "chat_hub_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_acf8926098f063cdbbad8497fd1"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_chat_hub_messages_agentId"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "chat_hub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_e22538eb50a71a17954cd7e076c"
            columns: ["sessionId"]
            isOneToOne: false
            referencedRelation: "chat_hub_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_e5d1fa722c5a8d38ac204746662"
            columns: ["previousMessageId"]
            isOneToOne: false
            referencedRelation: "chat_hub_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_hub_sessions: {
        Row: {
          agentId: string | null
          agentName: string | null
          createdAt: string
          credentialId: string | null
          id: string
          lastMessageAt: string
          model: string | null
          ownerId: string
          provider: string | null
          title: string
          tools: Json
          updatedAt: string
          workflowId: string | null
        }
        Insert: {
          agentId?: string | null
          agentName?: string | null
          createdAt?: string
          credentialId?: string | null
          id: string
          lastMessageAt: string
          model?: string | null
          ownerId: string
          provider?: string | null
          title: string
          tools?: Json
          updatedAt?: string
          workflowId?: string | null
        }
        Update: {
          agentId?: string | null
          agentName?: string | null
          createdAt?: string
          credentialId?: string | null
          id?: string
          lastMessageAt?: string
          model?: string | null
          ownerId?: string
          provider?: string | null
          title?: string
          tools?: Json
          updatedAt?: string
          workflowId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_7bc13b4c7e6afbfaf9be326c189"
            columns: ["credentialId"]
            isOneToOne: false
            referencedRelation: "credentials_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_9f9293d9f552496c40e0d1a8f80"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_chat_hub_sessions_agentId"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "chat_hub_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_e9ecf8ede7d989fcd18790fe36a"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "user"
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
      comercial_tabela_precos: {
        Row: {
          created_at: string | null
          data_preco: string | null
          empreendimento: string | null
          id: number
          juros: number | null
          num_lote: string | null
          preco_av: number | null
        }
        Insert: {
          created_at?: string | null
          data_preco?: string | null
          empreendimento?: string | null
          id: number
          juros?: number | null
          num_lote?: string | null
          preco_av?: number | null
        }
        Update: {
          created_at?: string | null
          data_preco?: string | null
          empreendimento?: string | null
          id?: number
          juros?: number | null
          num_lote?: string | null
          preco_av?: number | null
        }
        Relationships: []
      }
      credentials_entity: {
        Row: {
          createdAt: string
          data: string
          id: string
          isGlobal: boolean
          isManaged: boolean
          isResolvable: boolean
          name: string
          resolvableAllowFallback: boolean
          resolverId: string | null
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          data: string
          id: string
          isGlobal?: boolean
          isManaged?: boolean
          isResolvable?: boolean
          name: string
          resolvableAllowFallback?: boolean
          resolverId?: string | null
          type: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          data?: string
          id?: string
          isGlobal?: boolean
          isManaged?: boolean
          isResolvable?: boolean
          name?: string
          resolvableAllowFallback?: boolean
          resolverId?: string | null
          type?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_entity_resolverId_foreign"
            columns: ["resolverId"]
            isOneToOne: false
            referencedRelation: "dynamic_credential_resolver"
            referencedColumns: ["id"]
          },
        ]
      }
      data_table: {
        Row: {
          createdAt: string
          id: string
          name: string
          projectId: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id: string
          name: string
          projectId: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: string
          name?: string
          projectId?: string
          updatedAt?: string
        }
        Relationships: []
      }
      data_table_column: {
        Row: {
          createdAt: string
          dataTableId: string
          id: string
          index: number
          name: string
          type: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          dataTableId: string
          id: string
          index: number
          name: string
          type: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          dataTableId?: string
          id?: string
          index?: number
          name?: string
          type?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_930b6e8faaf88294cef23484160"
            columns: ["dataTableId"]
            isOneToOne: false
            referencedRelation: "data_table"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_credential_entry: {
        Row: {
          createdAt: string
          credential_id: string
          data: string
          resolver_id: string
          subject_id: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          credential_id: string
          data: string
          resolver_id: string
          subject_id: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          credential_id?: string
          data?: string
          resolver_id?: string
          subject_id?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_a6d1dd080958304a47a02952aab"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "credentials_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_d61a12235d268a49af6a3c09c13"
            columns: ["resolver_id"]
            isOneToOne: false
            referencedRelation: "dynamic_credential_resolver"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_credential_resolver: {
        Row: {
          config: string
          createdAt: string
          id: string
          name: string
          type: string
          updatedAt: string
        }
        Insert: {
          config: string
          createdAt?: string
          id: string
          name: string
          type: string
          updatedAt?: string
        }
        Update: {
          config?: string
          createdAt?: string
          id?: string
          name?: string
          type?: string
          updatedAt?: string
        }
        Relationships: []
      }
      dynamic_credential_user_entry: {
        Row: {
          createdAt: string
          credentialId: string
          data: string
          resolverId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          credentialId: string
          data: string
          resolverId: string
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          credentialId?: string
          data?: string
          resolverId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_6edec973a6450990977bb854c38"
            columns: ["resolverId"]
            isOneToOne: false
            referencedRelation: "dynamic_credential_resolver"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_945ba70b342a066d1306b12ccd2"
            columns: ["credentialId"]
            isOneToOne: false
            referencedRelation: "credentials_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_a36dc616fabc3f736bb82410a22"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      esquadro_comentarios: {
        Row: {
          conteudo: string
          created_at: string
          demanda_id: string
          id: string
          user_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string
          demanda_id: string
          id?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          demanda_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esquadro_comentarios_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "esquadro_demandas"
            referencedColumns: ["id"]
          },
        ]
      }
      esquadro_custo_hora_historico: {
        Row: {
          created_at: string
          custo_hora: number
          id: string
          user_id: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          created_at?: string
          custo_hora: number
          id?: string
          user_id: string
          vigencia_fim?: string | null
          vigencia_inicio: string
        }
        Update: {
          created_at?: string
          custo_hora?: number
          id?: string
          user_id?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      esquadro_demandas: {
        Row: {
          arquiteta_id: string | null
          created_at: string
          data_solicitacao: string
          empreendimento_id: string
          horas_estimadas: number | null
          id: string
          instrucoes: string | null
          ordem_kanban: number
          prazo_estimado: string | null
          prioridade: number
          status_id: string
          tipo_projeto_id: string
          updated_at: string
        }
        Insert: {
          arquiteta_id?: string | null
          created_at?: string
          data_solicitacao?: string
          empreendimento_id: string
          horas_estimadas?: number | null
          id?: string
          instrucoes?: string | null
          ordem_kanban?: number
          prazo_estimado?: string | null
          prioridade?: number
          status_id: string
          tipo_projeto_id: string
          updated_at?: string
        }
        Update: {
          arquiteta_id?: string | null
          created_at?: string
          data_solicitacao?: string
          empreendimento_id?: string
          horas_estimadas?: number | null
          id?: string
          instrucoes?: string | null
          ordem_kanban?: number
          prazo_estimado?: string | null
          prioridade?: number
          status_id?: string
          tipo_projeto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esquadro_demandas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "esquadro_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esquadro_demandas_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "esquadro_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esquadro_demandas_tipo_projeto_id_fkey"
            columns: ["tipo_projeto_id"]
            isOneToOne: false
            referencedRelation: "esquadro_tipos_projeto"
            referencedColumns: ["id"]
          },
        ]
      }
      esquadro_empreendimentos: {
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
      esquadro_motivos_nao_trabalho: {
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
      esquadro_profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      esquadro_registro_horas: {
        Row: {
          created_at: string
          data: string
          demanda_id: string | null
          horas: number
          id: string
          motivo_nao_trabalho_id: string | null
          observacao: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          demanda_id?: string | null
          horas?: number
          id?: string
          motivo_nao_trabalho_id?: string | null
          observacao?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          demanda_id?: string | null
          horas?: number
          id?: string
          motivo_nao_trabalho_id?: string | null
          observacao?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "esquadro_registro_horas_demanda_id_fkey"
            columns: ["demanda_id"]
            isOneToOne: false
            referencedRelation: "esquadro_demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esquadro_registro_horas_motivo_nao_trabalho_id_fkey"
            columns: ["motivo_nao_trabalho_id"]
            isOneToOne: false
            referencedRelation: "esquadro_motivos_nao_trabalho"
            referencedColumns: ["id"]
          },
        ]
      }
      esquadro_status: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      esquadro_tipos_projeto: {
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
      esquadro_user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["esquadro_app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["esquadro_app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["esquadro_app_role"]
          user_id?: string
        }
        Relationships: []
      }
      event_destinations: {
        Row: {
          createdAt: string
          destination: Json
          id: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          destination: Json
          id: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          destination?: Json
          id?: string
          updatedAt?: string
        }
        Relationships: []
      }
      execution_annotations: {
        Row: {
          createdAt: string
          executionId: number
          id: number
          note: string | null
          updatedAt: string
          vote: string | null
        }
        Insert: {
          createdAt?: string
          executionId: number
          id?: number
          note?: string | null
          updatedAt?: string
          vote?: string | null
        }
        Update: {
          createdAt?: string
          executionId?: number
          id?: number
          note?: string | null
          updatedAt?: string
          vote?: string | null
        }
        Relationships: []
      }
      execution_data: {
        Row: {
          data: string
          executionId: number
          workflowData: Json
          workflowVersionId: string | null
        }
        Insert: {
          data: string
          executionId: number
          workflowData: Json
          workflowVersionId?: string | null
        }
        Update: {
          data?: string
          executionId?: number
          workflowData?: Json
          workflowVersionId?: string | null
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
      test_case_execution: {
        Row: {
          completedAt: string | null
          createdAt: string
          errorCode: string | null
          errorDetails: Json | null
          executionId: number | null
          id: string
          inputs: Json | null
          metrics: Json | null
          outputs: Json | null
          runAt: string | null
          status: string
          testRunId: string
          updatedAt: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          executionId?: number | null
          id: string
          inputs?: Json | null
          metrics?: Json | null
          outputs?: Json | null
          runAt?: string | null
          status: string
          testRunId: string
          updatedAt?: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          executionId?: number | null
          id?: string
          inputs?: Json | null
          metrics?: Json | null
          outputs?: Json | null
          runAt?: string | null
          status?: string
          testRunId?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_8e4b4774db42f1e6dda3452b2af"
            columns: ["testRunId"]
            isOneToOne: false
            referencedRelation: "test_run"
            referencedColumns: ["id"]
          },
        ]
      }
      test_run: {
        Row: {
          completedAt: string | null
          createdAt: string
          errorCode: string | null
          errorDetails: Json | null
          id: string
          metrics: Json | null
          runAt: string | null
          status: string
          updatedAt: string
          workflowId: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          id: string
          metrics?: Json | null
          runAt?: string | null
          status: string
          updatedAt?: string
          workflowId: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          errorCode?: string | null
          errorDetails?: Json | null
          id?: string
          metrics?: Json | null
          runAt?: string | null
          status?: string
          updatedAt?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_d6870d3b6e4c185d33926f423c8"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          createdAt: string
          disabled: boolean
          email: string | null
          firstName: string | null
          id: string
          lastActiveAt: string | null
          lastName: string | null
          mfaEnabled: boolean
          mfaRecoveryCodes: string | null
          mfaSecret: string | null
          password: string | null
          personalizationAnswers: Json | null
          roleSlug: string
          settings: Json | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          disabled?: boolean
          email?: string | null
          firstName?: string | null
          id?: string
          lastActiveAt?: string | null
          lastName?: string | null
          mfaEnabled?: boolean
          mfaRecoveryCodes?: string | null
          mfaSecret?: string | null
          password?: string | null
          personalizationAnswers?: Json | null
          roleSlug?: string
          settings?: Json | null
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          disabled?: boolean
          email?: string | null
          firstName?: string | null
          id?: string
          lastActiveAt?: string | null
          lastName?: string | null
          mfaEnabled?: boolean
          mfaRecoveryCodes?: string | null
          mfaSecret?: string | null
          password?: string | null
          personalizationAnswers?: Json | null
          roleSlug?: string
          settings?: Json | null
          updatedAt?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          apiKey: string
          audience: string
          createdAt: string
          id: string
          label: string
          scopes: Json | null
          updatedAt: string
          userId: string
        }
        Insert: {
          apiKey: string
          audience?: string
          createdAt?: string
          id: string
          label: string
          scopes?: Json | null
          updatedAt?: string
          userId: string
        }
        Update: {
          apiKey?: string
          audience?: string
          createdAt?: string
          id?: string
          label?: string
          scopes?: Json | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_e131705cbbc8fb589889b02d457"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
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
      webhook_entity: {
        Row: {
          method: string
          node: string
          pathLength: number | null
          webhookId: string | null
          webhookPath: string
          workflowId: string
        }
        Insert: {
          method: string
          node: string
          pathLength?: number | null
          webhookId?: string | null
          webhookPath: string
          workflowId: string
        }
        Update: {
          method?: string
          node?: string
          pathLength?: number | null
          webhookId?: string | null
          webhookPath?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_webhook_entity_workflow_id"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_dependency: {
        Row: {
          createdAt: string
          dependencyInfo: Json | null
          dependencyKey: string
          dependencyType: string
          id: number
          indexVersionId: number
          publishedVersionId: string | null
          workflowId: string
          workflowVersionId: number
        }
        Insert: {
          createdAt?: string
          dependencyInfo?: Json | null
          dependencyKey: string
          dependencyType: string
          id?: number
          indexVersionId?: number
          publishedVersionId?: string | null
          workflowId: string
          workflowVersionId: number
        }
        Update: {
          createdAt?: string
          dependencyInfo?: Json | null
          dependencyKey?: string
          dependencyType?: string
          id?: number
          indexVersionId?: number
          publishedVersionId?: string | null
          workflowId?: string
          workflowVersionId?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_a4ff2d9b9628ea988fa9e7d0bf8"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_entity: {
        Row: {
          active: boolean
          activeVersionId: string | null
          connections: Json
          createdAt: string
          description: string | null
          id: string
          isArchived: boolean
          meta: Json | null
          name: string
          nodes: Json
          parentFolderId: string | null
          pinData: Json | null
          settings: Json | null
          staticData: Json | null
          triggerCount: number
          updatedAt: string
          versionCounter: number
          versionId: string
        }
        Insert: {
          active: boolean
          activeVersionId?: string | null
          connections: Json
          createdAt?: string
          description?: string | null
          id: string
          isArchived?: boolean
          meta?: Json | null
          name: string
          nodes: Json
          parentFolderId?: string | null
          pinData?: Json | null
          settings?: Json | null
          staticData?: Json | null
          triggerCount?: number
          updatedAt?: string
          versionCounter?: number
          versionId: string
        }
        Update: {
          active?: boolean
          activeVersionId?: string | null
          connections?: Json
          createdAt?: string
          description?: string | null
          id?: string
          isArchived?: boolean
          meta?: Json | null
          name?: string
          nodes?: Json
          parentFolderId?: string | null
          pinData?: Json | null
          settings?: Json | null
          staticData?: Json | null
          triggerCount?: number
          updatedAt?: string
          versionCounter?: number
          versionId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_08d6c67b7f722b0039d9d5ed620"
            columns: ["activeVersionId"]
            isOneToOne: false
            referencedRelation: "workflow_history"
            referencedColumns: ["versionId"]
          },
        ]
      }
      workflow_history: {
        Row: {
          authors: string
          autosaved: boolean
          connections: Json
          createdAt: string
          description: string | null
          name: string | null
          nodes: Json
          updatedAt: string
          versionId: string
          workflowId: string
        }
        Insert: {
          authors: string
          autosaved?: boolean
          connections: Json
          createdAt?: string
          description?: string | null
          name?: string | null
          nodes: Json
          updatedAt?: string
          versionId: string
          workflowId: string
        }
        Update: {
          authors?: string
          autosaved?: boolean
          connections?: Json
          createdAt?: string
          description?: string | null
          name?: string | null
          nodes?: Json
          updatedAt?: string
          versionId?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_1e31657f5fe46816c34be7c1b4b"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_publish_history: {
        Row: {
          createdAt: string
          event: string
          id: number
          userId: string | null
          versionId: string
          workflowId: string
        }
        Insert: {
          createdAt?: string
          event: string
          id?: number
          userId?: string | null
          versionId: string
          workflowId: string
        }
        Update: {
          createdAt?: string
          event?: string
          id?: number
          userId?: string | null
          versionId?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_6eab5bd9eedabe9c54bd879fc40"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_b4cfbc7556d07f36ca177f5e473"
            columns: ["versionId"]
            isOneToOne: false
            referencedRelation: "workflow_history"
            referencedColumns: ["versionId"]
          },
          {
            foreignKeyName: "FK_c01316f8c2d7101ec4fa9809267"
            columns: ["workflowId"]
            isOneToOne: false
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_published_version: {
        Row: {
          createdAt: string
          publishedVersionId: string
          updatedAt: string
          workflowId: string
        }
        Insert: {
          createdAt?: string
          publishedVersionId: string
          updatedAt?: string
          workflowId: string
        }
        Update: {
          createdAt?: string
          publishedVersionId?: string
          updatedAt?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "FK_5c76fb7ee939fe2530374d3f75a"
            columns: ["workflowId"]
            isOneToOne: true
            referencedRelation: "workflow_entity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_df3428a541b802d6a63ac56e330"
            columns: ["publishedVersionId"]
            isOneToOne: false
            referencedRelation: "workflow_history"
            referencedColumns: ["versionId"]
          },
        ]
      }
      workflow_statistics: {
        Row: {
          count: number | null
          id: number
          latestEvent: string | null
          name: string
          rootCount: number | null
          workflowId: string
          workflowName: string | null
        }
        Insert: {
          count?: number | null
          id?: number
          latestEvent?: string | null
          name: string
          rootCount?: number | null
          workflowId: string
          workflowName?: string | null
        }
        Update: {
          count?: number | null
          id?: number
          latestEvent?: string | null
          name?: string
          rootCount?: number | null
          workflowId?: string
          workflowName?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      esquadro_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["esquadro_app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      get_all_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          id: string
          nome: string
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
      esquadro_app_role: "admin" | "arquiteta"
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
      esquadro_app_role: ["admin", "arquiteta"],
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
