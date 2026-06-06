# Guia de autoria de conteúdo — AnestheQuest

Este guia é para a equipe de conteúdo (anestesiologistas autores/revisores).
O conteúdo é o diferencial do produto: **explicação como produto**.

## Regras inegociáveis

- **Conteúdo 100% autoral.** Não copie enunciados de prova, explicações,
  ilustrações ou tabelas de terceiros. Toda explicação e imagem é original.
- **Revisão clínica obrigatória.** Nada vai ao ar sem revisão por
  anestesiologista. Isso é refletido no campo `status`.
- **Cada alternativa tem justificativa.** Por que a correta está certa e por
  que **cada** errada está errada — esse é o padrão de qualidade.

## Fluxo de status

```
rascunho  →  em_revisao  →  publicada
(autor)      (revisor)       (visível para assinantes)
```

Só questões `publicada` aparecem no app, e apenas para **assinantes ativos**
(garantido por Row-Level Security). Questões em `rascunho`/`em_revisao` ficam
invisíveis para os usuários finais — seguras para trabalho em andamento.

## Anatomia de uma questão

| Tabela | Papel |
|---|---|
| `questions` | enunciado, exam_id, dificuldade, status, autor_id, revisor_id |
| `choices` | alternativas; marque exatamente uma `is_correct = true` (única escolha) |
| `explanations` | explicação geral + objetivo educacional + referências (1 por questão) |
| `choice_explanations` | justificativa de **cada** alternativa (1 por choice) |
| `question_taxonomy` | liga a questão a 1+ nós da taxonomia (tema) |
| `media` | imagens autorais (bucket `question-media`), com `alt_text` |

> `is_correct` nunca é exposto ao cliente (privilégio de coluna). A correção é
> feita no servidor pela função `grade_attempt`.

## Como adicionar uma questão

### Opção A — Supabase Studio (recomendado para não-devs)
1. `exams`: garanta que existe o exame (ex.: `TEA`).
2. `taxonomy`: crie/escolha o tema (hierárquico — `parent_id`).
3. `questions`: insira o enunciado com `status = 'rascunho'`.
4. `choices`: insira as alternativas; marque a correta.
5. `explanations` + `choice_explanations`: escreva as justificativas.
6. `question_taxonomy`: vincule a questão ao(s) tema(s).
7. Após revisão clínica, mude `status` para `publicada`.

### Opção B — SQL (lotes)
Use o helper do seed como modelo: `supabase/seed.sql` tem
`pg_temp.seed_question(...)`, que cria questão + alternativas + explicações +
vínculo de taxonomia em uma chamada. Copie o padrão (sem o prefixo
`[PLACEHOLDER]`!) para inserir conteúdo real.

## Taxonomia (matriz da SBA)

A tabela `taxonomy` é hierárquica e flexível (`subject` → `system` → `topic`).
A matriz oficial da SBA será definida fora do código. Ao montar um teste,
selecionar um nó inclui automaticamente os **descendentes**
(`taxonomy_with_descendants`). Remova as linhas `is_placeholder = true` do seed
quando a taxonomia real entrar.

## Imagens

Suba para o bucket `question-media` (privado; leitura só de assinantes). Crie a
linha em `media` com `owner_type`, `owner_id`, `url`/`storage_path` e `alt_text`
(acessibilidade). Use somente ilustrações autorais.

## Busca

`questions.enunciado` e `explanations.texto_geral` têm `tsvector` em português
(`pt_unaccent`, insensível a acento) + índice trigram. A busca funciona sem
configuração extra após publicar.

## Depois de mudar o schema

Regenere os tipos do TypeScript para manter app/web em sincronia:

```bash
npm run gen:types
```

## IA (RAG)

O assistente responde **somente** com base nas explicações publicadas. Após
publicar/editar explicações, rode a edge function `embed-explanations` para
gerar/atualizar os embeddings usados na busca semântica.
