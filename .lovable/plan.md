

## Plano de Implementação

Este plano cobre todas as modificações solicitadas, organizadas em 5 blocos independentes.

---

### 1. Renomear "Comentários" → "Informações da Gleba"

Trocar apenas os labels de exibição (campo no banco permanece `comentarios`):

- `CreateGlebaDialog.tsx` — FormLabel (linha 178) e placeholder
- `EditGlebaDialog.tsx` — FormLabel (linha 395)
- `GlebaDetailsDialog.tsx` — título da seção (linha 469) e ícone
- `serve-kml-network-link/index.ts` — label "Comentários" no balão KML (linha 174)

---

### 2. Tipos de Atividade

**Migration SQL:**
```sql
CREATE TABLE public.tipos_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tipos_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read" ON public.tipos_atividade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage" ON public.tipos_atividade FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tipos_atividade (nome) VALUES
  ('Reunião presencial'), ('Reunião por vídeo'), ('Visita na gleba'), ('Ligação telefônica');

ALTER TABLE public.atividades ADD COLUMN tipo_atividade_id uuid REFERENCES public.tipos_atividade(id);
```

**Frontend:**
- **`useAtividades.ts`** — incluir `tipo_atividade:tipos_atividade(nome)` no select; criar hook `useTiposAtividade` para listar tipos
- **`CreateAtividadeDialog.tsx`** — adicionar campo Select opcional para tipo de atividade
- **`GlebaAtividades.tsx`** — adicionar Select opcional de tipo ao criar atividade; exibir badge do tipo na listagem
- **`AtividadeCard.tsx`** — exibir badge com o nome do tipo
- **`AtividadesList.tsx`** — adicionar filtro multi-select com busca por digitação (usando Command/Popover), permitindo selecionar múltiplos tipos simultaneamente

---

### 3. Transparência dos polígonos no KML

Em `serve-kml-network-link/index.ts`, trocar o alpha `80` por `60` nos valores de fill dos `STATUS_STYLES` (linhas 35-43). Isso reduz a opacidade de ~50% para ~37%.

---

### 4. Pesquisa de Mercado

**Migration SQL — duas tabelas:**

`pesquisas_mercado` (sessão de pesquisa):
- id, nome (ex: "Pesquisa-AlegreteRS-250326"), cidade_id (FK), data_pesquisa, observacoes, kmz_file (path storage), created_by, created_at

`pesquisa_mercado_terrenos` (cada terreno):
- id, pesquisa_id (FK), nome, preco, tamanho_m2, preco_por_m2 (generated), condicoes_pagamento, tipo_terreno, observacoes, url_anuncio, latitude, longitude, placemark_name (para vincular ao KMZ)

RLS: leitura para authenticated, escrita para authenticated.

**Fluxo:**
1. Usuário cria pesquisa (nome, cidade, data)
2. Cadastra terrenos com dados (preço, tamanho, condições)
3. Faz upload de KMZ com pins — o sistema parseia placemarks e o usuário vincula cada placemark a um terreno pelo `placemark_name`
4. Alternativa: cadastrar lat/lng manualmente sem KMZ

**KML Edge Function:**
- Adicionar query param `layer=glebas|pesquisa|all`
- Gerar PINs com ícone azul diferenciado para terrenos de pesquisa, com balão contendo preço, tamanho, preço/m², condições
- Organizar em pastas KML separadas: "Glebas" e "Pesquisa de Mercado"

**Frontend:**
- Nova página/seção para CRUD de pesquisas e terrenos
- Rota no menu lateral
- Upload de KMZ com parsing de placemarks
- Toggle no `GlebaMap3D` para alternar camada

---

### 5. Upload → Google Drive + Tipos de Arquivo Dinâmicos

**5a. Tipos de Arquivo Configuráveis**

Migration SQL:
```sql
CREATE TABLE public.tipos_arquivo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
-- RLS: leitura authenticated, CRUD admin
INSERT INTO public.tipos_arquivo (nome) VALUES
  ('Pesquisa de Mercado'), ('Planilha de Viabilidade'), ('Matrícula do Imóvel');

ALTER TABLE public.gleba_anexos ADD COLUMN tipo_arquivo_id uuid REFERENCES public.tipos_arquivo(id);
-- Migrar dados existentes do enum para o novo campo
```

- **`Configuracoes.tsx`** — nova seção "Tipos de Arquivo" com CRUD (criar, renomear, excluir com proteção se em uso)
- **`useGlebaAnexos.ts`** — remover enum `TipoAnexo`, `TIPO_ANEXO_LABELS`, `TIPO_ANEXO_ACCEPT`; adicionar mutation para atualizar `tipo_arquivo_id`
- **`GlebaAnexosSection.tsx`** — refatorar: lista única de anexos, cada um com Select opcional para atribuir tipo; upload aceita qualquer tipo de arquivo
- Novo hook **`useTiposArquivo.ts`** para CRUD de tipos

**5b. Upload → Google Drive**

Nova edge function **`upload-to-drive`**:
- Recebe arquivo + dados da gleba (apelido, cidade, UF)
- Usa `GOOGLE_SERVICE_ACCOUNT_JSON` (já configurado), atualizando scope de `drive.readonly` para `drive`
- Cria/navega estrutura: `Projetos futuros/{UF}/{Cidade}/{Gleba}`
- Faz upload e retorna link do Drive
- Salva link na tabela `gleba_anexos`

Nova edge function **`list-drive-files`**:
- Lista TODOS os arquivos na pasta do Drive da gleba (não só os uploadados pelo Perdigueiro)
- Retorna nome, link, tipo, data de modificação

Migration: adicionar `google_drive_folder_id` na tabela `glebas`.

**Frontend (`GlebaAnexosSection`):**
- Upload envia para Drive via edge function
- Exibir todos os arquivos do Drive (incluindo os não enviados pelo Perdigueiro)
- Permitir atribuir tipo de arquivo a qualquer anexo

---

### Resumo de arquivos

| Bloco | Arquivos afetados |
|-------|-------------------|
| 1. Label | `CreateGlebaDialog`, `EditGlebaDialog`, `GlebaDetailsDialog`, `serve-kml-network-link` |
| 2. Tipos atividade | Migration, `useAtividades`, `GlebaAtividades`, `CreateAtividadeDialog`, `AtividadeCard`, `AtividadesList` |
| 3. Transparência | `serve-kml-network-link/index.ts` |
| 4. Pesquisa mercado | 2 migrations, `serve-kml-network-link`, novos componentes CRUD, rota, menu |
| 5. Drive + tipos arquivo | 2 migrations, 2 edge functions, `GlebaAnexosSection`, `useGlebaAnexos`, `Configuracoes`, novo hook |

