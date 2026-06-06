// Assistente de IA (RAG) sobre as explicações. Gateado por assinatura via a
// RPC match_explanations (com o JWT do usuário). Requer OPENAI_API_KEY.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const EMBED_MODEL = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-small';
const CHAT_MODEL = Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4o-mini';

async function openai(path: string, body: unknown) {
  const res = await fetch(`https://api.openai.com/v1/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI: ${await res.text()}`);
  return res.json();
}

const SYSTEM_PROMPT = `Você é o assistente de estudos do AnestheQuest, focado em Anestesiologia (prova TEA/SBA).
Responda em português do Brasil, de forma objetiva e didática.
Use SOMENTE o contexto fornecido (explicações autorais do banco). Se a resposta não
estiver no contexto, diga que não há material suficiente e sugira estudar o tema.
Nunca invente referências. Cite os trechos do contexto quando úteis.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { question } = await req.json();
    if (!question || typeof question !== 'string') return json({ error: 'Pergunta vazia' }, 400);

    // Client com o JWT do usuário -> match_explanations valida a assinatura.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    const emb = await openai('embeddings', { model: EMBED_MODEL, input: question });
    const queryEmbedding = emb.data[0].embedding as number[];

    const { data: matches, error } = await supabase.rpc('match_explanations', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 5,
    });
    if (error) return json({ error: error.message }, 403);

    const context = (matches ?? [])
      .map((m: { texto_geral: string }, i: number) => `[Fonte ${i + 1}] ${m.texto_geral}`)
      .join('\n\n');

    const chat = await openai('chat/completions', {
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Contexto:\n${context}\n\nPergunta: ${question}` },
      ],
    });

    return json({
      answer: chat.choices[0].message.content,
      sources: (matches ?? []).map((m: { question_id: string }) => m.question_id),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro' }, 500);
  }
});
