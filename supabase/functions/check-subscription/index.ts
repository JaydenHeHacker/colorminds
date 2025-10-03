import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // Update user_subscriptions to free tier
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          tier: "free",
          monthly_quota: 5,
          updated_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: "free",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Safely handle date conversion
      if (subscription.current_period_end) {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (error) {
          console.error("Error converting subscription end date:", error);
          subscriptionEnd = null;
        }
      }
      
      productId = subscription.items.data[0].price.product as string;

      // Update user_subscriptions to premium tier
      const { error: updateError } = await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          tier: "premium",
          monthly_quota: 100,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_end_date: subscriptionEnd,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (updateError) {
        console.error("Error updating subscription:", updateError);
      } else {
        console.log("Successfully updated subscription to premium");
      }
    } else {
      // Update to free tier if subscription ended
      const { error: updateError } = await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          tier: "free",
          monthly_quota: 5,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
      
      if (updateError) {
        console.error("Error updating subscription to free:", updateError);
      } else {
        console.log("Updated subscription to free");
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      tier: hasActiveSub ? "premium" : "free",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in check-subscription:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
