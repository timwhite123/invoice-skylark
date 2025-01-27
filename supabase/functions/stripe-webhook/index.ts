import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;

        if (!email) {
          throw new Error('No email found for customer');
        }

        // Get user id from profiles table
        const { data: profiles, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError || !profiles) {
          throw new Error('No user found for email');
        }

        // Update customer_subscriptions table
        const { error: subscriptionError } = await supabaseClient
          .from('customer_subscriptions')
          .upsert({
            user_id: profiles.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, {
            onConflict: 'stripe_customer_id',
          });

        if (subscriptionError) {
          throw new Error(`Error updating subscription: ${subscriptionError.message}`);
        }

        // Update user's subscription tier in profiles
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_tier: subscription.status === 'active' ? 
              (subscription.items.data[0].price.unit_amount === 1997 ? 'pro' : 'enterprise') : 
              'free'
          })
          .eq('id', profiles.id);

        if (profileUpdateError) {
          throw new Error(`Error updating profile: ${profileUpdateError.message}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        const email = customer.email;

        if (!email) {
          throw new Error('No email found for customer');
        }

        // Get user id from profiles table
        const { data: profiles, error: profileError } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError || !profiles) {
          throw new Error('No user found for email');
        }

        // Update subscription status
        const { error: subscriptionError } = await supabaseClient
          .from('customer_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (subscriptionError) {
          throw new Error(`Error updating subscription: ${subscriptionError.message}`);
        }

        // Update user's subscription tier in profiles
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_tier: 'free'
          })
          .eq('id', profiles.id);

        if (profileUpdateError) {
          throw new Error(`Error updating profile: ${profileUpdateError.message}`);
        }

        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});