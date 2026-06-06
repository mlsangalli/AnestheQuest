// Gera embeddings das explicações publicadas e grava em explanation_embeddings.
// Executar sob demanda/cron (service role). Requer OPENAI_API_KEY.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const EMBED_MODEL = Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-small';

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI: ${await res.text()}`);
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { data: explanations } = await admin
      .from('explanations')
      .select('id, texto_geral, objetivo_educacional');
    const { data: existing } = await admin.from('explanation_embeddings').select('explanation_id');
    const have = new Set((existing ?? []).map((e) => e.explanation_id));
    const todo = (explanations ?? []).filter((e) => !have.has(e.id));

    let processed = 0;
    for (let i = 0; i < todo.length; i += 50) {
      const batch = todo.slice(i, i + 50);
      const inputs = batch.map((e) =>
        [e.texto_geral, e.objetivo_educacional].filter(Boolean).join('\n'),
      );
      const vectors = await embed(inputs);
      const rows = batch.map((e, j) => ({
        explanation_id: e.id,
        embedding: JSON.stringify(vectors[j]),
        updated_at: new Date().toISOString(),
      }));
      const { error } = await admin.from('explanation_embeddings').upsert(rows);
      if (error) throw error;
      processed += rows.length;
    }

    return json({ processed, skipped: have.size });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro' }, 500);
  }
});
