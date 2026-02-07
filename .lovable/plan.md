

## Plano de Implementação - Sistema de Mapeamento de Glebas
### Young Empreendimentos

---

### 🎯 Visão Geral

Sistema web para mapear e gerenciar terrenos (glebas) potenciais para empreendimentos imobiliários, com visualização Kanban, controle de propostas, integração com mapas e sincronização automática com Google Earth.

---

### 👥 Controle de Acesso

**Admin**
- Acesso total ao sistema
- Pode excluir glebas e exportar dados
- Gerencia configurações (motivos de descarte, usuários)

**Usuário Comum**
- Pode visualizar, criar e editar registros
- **NÃO pode** excluir glebas
- **NÃO pode** exportar dados em massa

---

### 📋 Módulos do Sistema

#### 1. **Cadastro de Glebas** (Tela Principal)

**Visualização Kanban** com 9 colunas de status e regras de transição:

| Status | Requisitos para Mover |
|--------|----------------------|
| Identificada | (inicial) |
| Informações Recebidas | - |
| Visita Realizada | Data da visita obrigatória |
| Proposta Enviada | Proposta associada obrigatória |
| Protocolo Assinado | Upload do protocolo obrigatório |
| Descartada | Motivo (dropdown) + descrição |
| Proposta Recusada | - |
| Negócio Fechado | Upload do contrato obrigatório |
| Standby | Motivo + tempo (máx 90 dias) → **retorno automático** |

**Campos da Gleba**:
- Cidade, apelido interno, tamanho (m²)
- Nome do proprietário, imobiliária
- Preço, % permuta, aceita permuta (sim/não)
- Zona do plano diretor
- Tamanho lote mínimo, responsável pela análise
- Data atualização (automática)
- Comentários, prioridade (destaque visual)
- Polígono no mapa integrado

---

#### 2. **Mapa Integrado**

- Desenhar polígonos diretamente no sistema
- Visualizar todas as glebas coloridas por status
- Upload/download de arquivo KMZ por gleba
- Filtros por cidade, status, prioridade

---

#### 3. **Integração Google Earth (Network Link)**

Edge Function que gera KML dinâmico para sincronização:
- URL configurável no Google Earth Pro
- Atualização automática (ex: a cada 5 min)
- Polígonos coloridos por status
- Popup com informações básicas da gleba

---

#### 4. **Controle de Propostas**

- Data da proposta
- Arquivo da carta-proposta (upload)
- Descrição da proposta
- Gleba associada
- Histórico de propostas por gleba

---

#### 5. **Cadastro de Cidades**

- Nome da cidade
- Arquivos de plano diretor (múltiplos uploads)
- Lista de glebas associadas

---

#### 6. **Cadastro de Imobiliárias**

- Nome da imobiliária
- Nome do contato
- Telefone
- Link rede social / website
- Contador de glebas trazidas

---

#### 7. **Registro de Atividades**

- Data e descrição da atividade
- Gleba(s) associada(s)
- Responsável (usuário logado)
- Timeline de histórico por gleba

---

#### 8. **Configurações (Admin)**

- Gerenciar motivos de descarte (criar/editar/excluir)
- Gerenciar usuários e permissões
- Configurações gerais do sistema

---

#### 9. **Dashboard**

**Métricas visuais**:
- Propostas enviadas por mês (gráfico de linha)
- Atividades por dia/semana/mês
- Distribuição de glebas por status (gráfico de pizza)
- Total de glebas mapeadas (KPI principal)
- Filtros por período

---

### 🎨 Identidade Visual

- **Cores**: Laranja Jovem (#FE5009), Azul Corporativo (#061B39), Cinzas (#323232, #0D0D0D, #F2F2F2)
- **Tipografia**: Space Grotesk
- **Estilo**: Moderno, tecnológico e minimalista
- **Tema**: Suporte a dark mode

---

### 🔧 Tecnologia

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Lovable Cloud)
- **Mapas**: Leaflet com suporte a KMZ
- **Armazenamento**: Supabase Storage (arquivos)
- **Autenticação**: Supabase Auth com roles

---

### 📱 Telas Principais

1. **Login** - Autenticação segura
2. **Dashboard** - Visão geral com métricas
3. **Glebas (Kanban)** - Tela principal com drag-and-drop
4. **Mapa** - Visualização geográfica
5. **Propostas** - Listagem e cadastro
6. **Cidades** - Cadastro com planos diretores
7. **Imobiliárias** - Cadastro de parceiros
8. **Atividades** - Registro diário
9. **Configurações** - Área admin

