import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Credit pack mapping
const CREDIT_PACKS: Record<string, number> = {
  "price_1SE9HVCTw9zay88KRU0sRbpo": 100,  // $4.99
  "price_1SE9HcCTw9zay88KVIsAgAQH": 300,  // $12.99
  "price_1SE9HdCTw9zay88KTZ0hDCT0": 1000, // $39.99
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret || ""
    );

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "payment") {
          // Handle credit pack purchase
          const userId = session.metadata?.user_id;
          if (!userId) {
            console.error("No user_id in session metadata");
            break;
          }

          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data[0]?.price?.id;
          const credits = priceId ? CREDIT_PACKS[priceId] : 0;

          if (credits > 0) {
            // Add credits to user balance
            const { data: balance } = await supabaseAdmin
              .from("credit_balance")
              .select("*")
              .eq("user_id", userId)
              .single();

            if (balance) {
              await supabaseAdmin
                .from("credit_balance")
                .update({ 
                  balance: balance.balance + credits,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId);
            } else {
              await supabaseAdmin
                .from("credit_balance")
                .insert({ 
                  user_id: userId,
                  balance: credits,
                });
            }

            // Record transaction
            await supabaseAdmin
              .from("credit_transactions")
              .insert({
                user_id: userId,
                transaction_type: "purchase",
                amount: credits,
                balance_after: (balance?.balance || 0) + credits,
                description: `Purchased ${credits} credits`,
                stripe_payment_id: session.payment_intent as string,
              });

            console.log(`Added ${credits} credits to user ${userId}`);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ('email' in customer && customer.email) {
          // Find user by email
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customer.email)
            .single();
          
          if (profiles) {
            const userId = profiles.id;
            const tier = subscription.status === "active" ? "premium" : "free";
            const monthlyQuota = tier === "premium" ? 100 : 5;

            await supabaseAdmin
              .from("user_subscriptions")
              .upsert({
                user_id: userId,
                tier,
                monthly_quota: monthlyQuota,
                stripe_customer_id: customer.id,
                stripe_subscription_id: subscription.id,
                subscription_end_date: subscription.status === "active" 
                  ? new Date(subscription.current_period_end * 1000).toISOString()
                  : null,
                updated_at: new Date().toISOString(),
              });

            console.log(`Updated subscription for user ${userId} to ${tier}`);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
