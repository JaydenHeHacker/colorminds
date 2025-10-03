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
  "price_1SEAptPtWzrgBXKbpdl2S4pC": 100,  // $4.99
  "price_1SEApzPtWzrgBXKbzeqvik80": 300,  // $12.99
  "price_1SEAq0PtWzrgBXKbu45Aoc30": 1000, // $39.99
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret || ""
    );

    console.log("Webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed: mode=${session.mode}, user_id=${session.metadata?.user_id}`);
        
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
            const { data: userCredit } = await supabaseAdmin
              .from("user_credits")
              .select("*")
              .eq("user_id", userId)
              .single();

            if (userCredit) {
              await supabaseAdmin
                .from("user_credits")
                .update({ 
                  balance: userCredit.balance + credits,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", userId);
            } else {
              await supabaseAdmin
                .from("user_credits")
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
                balance_after: (userCredit?.balance || 0) + credits,
                description: `Purchased ${credits} credits`,
                stripe_payment_id: session.payment_intent as string,
              });

            console.log(`Added ${credits} credits to user ${userId}`);
          }
        } else if (session.mode === "subscription") {
          // Handle subscription checkout completion
          const userId = session.metadata?.user_id;
          if (!userId) {
            console.error("No user_id in session metadata");
            break;
          }

          // Get subscription details
          const subscriptionId = session.subscription as string;
          if (!subscriptionId) {
            console.error("No subscription ID in session");
            break;
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = session.customer as string;

          const tier = subscription.status === "active" ? "premium" : "free";
          const monthlyQuota = tier === "premium" ? 100 : 5;
          
          // Safely handle date conversion
          let subscriptionEndDate = null;
          if (subscription.status === "active" && subscription.current_period_end) {
            try {
              subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
            } catch (error) {
              console.error("Error converting subscription end date:", error);
            }
          }

          await supabaseAdmin
            .from("user_subscriptions")
            .upsert({
              user_id: userId,
              tier,
              monthly_quota: monthlyQuota,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_end_date: subscriptionEndDate,
              updated_at: new Date().toISOString(),
            });

          console.log(`Subscription created for user ${userId}, tier: ${tier}`);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe_subscription_id in database
        const { data: userSub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (!userSub) {
          console.error(`No user found for subscription: ${subscription.id}`);
          break;
        }

        const tier = subscription.status === "active" ? "premium" : "free";
        const monthlyQuota = tier === "premium" ? 100 : 5;
        
        // Safely handle date conversion
        let subscriptionEndDate = null;
        if (subscription.status === "active" && subscription.current_period_end) {
          try {
            subscriptionEndDate = new Date(subscription.current_period_end * 1000).toISOString();
          } catch (error) {
            console.error("Error converting subscription end date:", error);
          }
        }

        await supabaseAdmin
          .from("user_subscriptions")
          .update({
            tier,
            monthly_quota: monthlyQuota,
            subscription_end_date: subscriptionEndDate,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userSub.user_id);

        console.log(`Updated subscription for user ${userSub.user_id} to ${tier}`);
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
