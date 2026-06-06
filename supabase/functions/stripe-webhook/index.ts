// Webhook do Stripe -> sincroniza a tabela subscriptions (service role).
// Requer: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.
import Stripe from 'npm:stripe@^17';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-01-27.acacia' });
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Mapeia status do Stripe -> enum subscription_status do banco.
const STATUS_MAP: Record<string, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  incomplete: 'incomplete',
  incomplete_expired: 'incomplete_expired',
  paused: 'paused',
};

async function upsertFromSubscription(sub: Stripe.Subscription, userIdHint?: string) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = userIdHint ?? (sub.metadata?.user_id as string | undefined);
  // Fallback: assinatura já conhecida (updates/deletes sem metadata) -> mapeia
  // pelo customer do Stripe.
  if (!userId) {
    const { data } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('provider_customer_id', customerId)
      .maybeSingle();
    userId = data?.user_id ?? undefined;
  }
  if (!userId) {
    console.warn('subscription event without resolvable user_id:', sub.id);
    return;
  }
  const plan = (sub.metadata?.plan as string | undefined) ?? 'anual';
  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      plano: plan,
      status: STATUS_MAP[sub.status] ?? 'incomplete',
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_subscription_id: sub.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (e) {
    return new Response(`Webhook signature error: ${e instanceof Error ? e.message : ''}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          await upsertFromSubscription(sub, s.client_reference_id ?? undefined);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(`Handler error: ${e instanceof Error ? e.message : ''}`, { status: 500 });
  }
});
