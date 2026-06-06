// Cria uma sessão de Checkout do Stripe para um plano (web).
// Requer: STRIPE_SECRET_KEY, STRIPE_PRICE_ANUAL, STRIPE_PRICE_RESIDENTE, SITE_URL.
import Stripe from 'npm:stripe@^17';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-01-27.acacia' });

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  anual: Deno.env.get('STRIPE_PRICE_ANUAL'),
  residente: Deno.env.get('STRIPE_PRICE_RESIDENTE'),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { plan } = await req.json();
    const price = PRICE_BY_PLAN[plan];
    if (!price) return json({ error: 'Plano inválido' }, 400);

    // Identifica o usuário autenticado a partir do JWT.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Não autenticado' }, 401);

    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      allow_promotion_codes: true,
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erro' }, 500);
  }
});
