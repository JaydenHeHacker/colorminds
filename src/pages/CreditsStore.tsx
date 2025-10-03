import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Zap, Check, ArrowLeft } from "lucide-react";

export default function CreditsStore() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);

    const [subResult, creditsResult, packagesResult] = await Promise.all([
      supabase.from("user_subscriptions").select("*").eq("user_id", user.id).single(),
      supabase.from("user_credits").select("*").eq("user_id", user.id).single(),
      supabase.from("credit_packages").select("*").eq("is_active", true).order("credits"),
    ]);

    if (subResult.data) setSubscription(subResult.data);
    if (creditsResult.data) setCredits(creditsResult.data);
    if (packagesResult.data) setPackages(packagesResult.data);
    setLoading(false);
  };

  const handlePurchasePackage = async (packageId: string, credits: number, price: number) => {
    toast({
      title: "Feature in Development",
      description: "Payment integration coming soon!",
    });
    // TODO: Integrate with Stripe
  };

  const handleUpgradePremium = () => {
    toast({
      title: "Feature in Development",
      description: "Subscription feature coming soon!",
    });
    // TODO: Integrate with Stripe for subscription
  };

  const isPremium = subscription?.tier === 'premium';
  const remainingQuota = subscription ? subscription.monthly_quota - subscription.used_quota : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2">Credits Store</h1>
          <p className="text-muted-foreground">Choose the plan that fits your needs</p>
        </div>

        {/* Current Status */}
        <Card className="p-6 mb-12 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isPremium ? (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                    <Crown className="w-4 h-4 mr-1" />
                    Premium Member
                  </Badge>
                ) : (
                  <Badge variant="outline">Free User</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Monthly Quota: <span className="font-bold text-foreground">{remainingQuota}</span> / {subscription?.monthly_quota || 5}</p>
                <p>Credits Balance: <span className="font-bold text-foreground">{credits?.balance || 0}</span></p>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Subscription */}
        {!isPremium && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Premium Membership</h2>
            <Card className="p-8 border-2 border-primary/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex-1 min-w-[300px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-amber-600" />
                    <h3 className="text-2xl font-bold">Premium</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">Monthly subscription with all benefits</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>50 generations per month</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Priority queue (10 seconds)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Generate up to 3 at once</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>AI prompt optimization</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Private or public creations</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>HD downloads (2048px)</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-primary mb-1">$4.99</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleUpgradePremium}
                    className="w-full min-w-[200px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Subscribe Now
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Credit Packages */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Credit Packages (One-time Purchase)</h2>
          <p className="text-muted-foreground mb-6">
            Credits never expire. Perfect for occasional users.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const pricePerCredit = (Number(pkg.price_usd) / pkg.credits).toFixed(2);
              const isPopular = pkg.credits === 30;
              
              return (
                <Card key={pkg.id} className={`p-6 relative ${isPopular ? 'border-2 border-primary' : ''}`}>
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Best Value
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                    <p className="text-3xl font-bold text-primary mb-1">
                      {pkg.credits} Credits
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${pricePerCredit} / page
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-center mb-1">
                      ${Number(pkg.price_usd).toFixed(2)}
                    </div>
                    <p className="text-sm text-center text-muted-foreground">One-time purchase</p>
                  </div>
                  
                  <Button
                    onClick={() => handlePurchasePackage(pkg.id, pkg.credits, Number(pkg.price_usd))}
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                  >
                    Buy Now
                  </Button>
                  
                  <div className="mt-4 text-xs text-center text-muted-foreground">
                    • Never expires • Stackable
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <Card className="p-6 mt-12">
          <h3 className="font-bold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">Q: What's the difference between subscription and credit packages?</p>
              <p className="text-muted-foreground">A: Subscription auto-renews monthly with fixed quota and premium features. Credit packages are one-time purchases that never expire.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: Do credits expire?</p>
              <p className="text-muted-foreground">A: No! Purchased credits are permanent and can be used anytime.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: What happens when my subscription expires?</p>
              <p className="text-muted-foreground">A: You'll return to free user status, but your purchased credits remain available.</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: Can I have both subscription and credits?</p>
              <p className="text-muted-foreground">A: Yes! Monthly quota is used first, then credits are automatically deducted when quota runs out.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
