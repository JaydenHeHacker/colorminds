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
      title: "功能开发中",
      description: "支付功能即将上线，敬请期待！",
    });
    // TODO: Integrate with Stripe
  };

  const handleUpgradePremium = () => {
    toast({
      title: "功能开发中",
      description: "订阅功能即将上线，敬请期待！",
    });
    // TODO: Integrate with Stripe for subscription
  };

  const isPremium = subscription?.tier === 'premium';
  const remainingQuota = subscription ? subscription.monthly_quota - subscription.used_quota : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
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
            返回
          </Button>
          <h1 className="text-4xl font-bold mb-2">积分商店</h1>
          <p className="text-muted-foreground">选择适合你的套餐，解锁更多创作可能</p>
        </div>

        {/* Current Status */}
        <Card className="p-6 mb-12 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {isPremium ? (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                    <Crown className="w-4 h-4 mr-1" />
                    高级会员
                  </Badge>
                ) : (
                  <Badge variant="outline">免费用户</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>本月配额：<span className="font-bold text-foreground">{remainingQuota}</span> / {subscription?.monthly_quota || 5}</p>
                <p>积分余额：<span className="font-bold text-foreground">{credits?.balance || 0}</span></p>
              </div>
            </div>
          </div>
        </Card>

        {/* Premium Subscription */}
        {!isPremium && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">订阅会员</h2>
            <Card className="p-8 border-2 border-primary/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <div className="flex items-start justify-between flex-wrap gap-6">
                <div className="flex-1 min-w-[300px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-6 h-6 text-amber-600" />
                    <h3 className="text-2xl font-bold">高级会员</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">每月订阅，享受所有特权</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>每月 50 张配额（可满足重度需求）</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>优先生成队列（10秒内完成）</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>一次生成最多3张（多选项）</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>AI智能优化提示词</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>作品可选私有/公开</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>高清下载（2048px）</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-primary mb-1">$4.99</div>
                    <div className="text-sm text-muted-foreground">每月</div>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleUpgradePremium}
                    className="w-full min-w-[200px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    立即订阅
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Credit Packages */}
        <div>
          <h2 className="text-2xl font-bold mb-6">积分包（一次性购买）</h2>
          <p className="text-muted-foreground mb-6">
            积分永久有效，不会过期。适合不需要频繁使用的用户。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const pricePerCredit = (Number(pkg.price_usd) / pkg.credits).toFixed(2);
              const isPopular = pkg.credits === 30;
              
              return (
                <Card key={pkg.id} className={`p-6 relative ${isPopular ? 'border-2 border-primary' : ''}`}>
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      最超值
                    </Badge>
                  )}
                  
                  <div className="text-center mb-6">
                    <Zap className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                    <p className="text-3xl font-bold text-primary mb-1">
                      {pkg.credits} 积分
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${pricePerCredit} / 张
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-center mb-1">
                      ${Number(pkg.price_usd).toFixed(2)}
                    </div>
                    <p className="text-sm text-center text-muted-foreground">一次性购买</p>
                  </div>
                  
                  <Button
                    onClick={() => handlePurchasePackage(pkg.id, pkg.credits, Number(pkg.price_usd))}
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                  >
                    立即购买
                  </Button>
                  
                  <div className="mt-4 text-xs text-center text-muted-foreground">
                    • 永久有效 • 可叠加购买
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <Card className="p-6 mt-12">
          <h3 className="font-bold mb-4">常见问题</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">Q: 订阅和积分包有什么区别？</p>
              <p className="text-muted-foreground">A: 订阅每月自动续费，提供固定配额和所有特权功能。积分包是一次性购买，永久有效，适合偶尔使用的用户。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: 积分会过期吗？</p>
              <p className="text-muted-foreground">A: 不会！购买的积分永久有效，可以随时使用。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: 如果订阅到期了会怎样？</p>
              <p className="text-muted-foreground">A: 你将回到免费用户状态，但已购买的积分依然可以使用。</p>
            </div>
            <div>
              <p className="font-medium mb-1">Q: 可以同时拥有订阅和积分吗？</p>
              <p className="text-muted-foreground">A: 可以！生成时会优先使用月度配额，配额用完后自动使用积分。</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
