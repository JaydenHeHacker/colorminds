import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Crown, Zap, Lock } from "lucide-react";

export default function CreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "请先登录",
        description: "需要登录才能创建涂色页",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(user);
    await loadUserData(user.id);
  };

  const loadUserData = async (userId: string) => {
    const [subResult, creditsResult] = await Promise.all([
      supabase.from("user_subscriptions").select("*").eq("user_id", userId).single(),
      supabase.from("user_credits").select("*").eq("user_id", userId).single(),
    ]);

    if (subResult.data) setSubscription(subResult.data);
    if (creditsResult.data) setCredits(creditsResult.data);
  };

  const canGenerate = () => {
    if (!subscription || !credits) return false;
    return subscription.used_quota < subscription.monthly_quota || credits.balance > 0;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "请输入提示词",
        description: "描述你想要的涂色页内容",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerate()) {
      toast({
        title: "配额不足",
        description: "请购买积分包或升级会员",
        variant: "destructive",
      });
      navigate("/credits");
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      // Simulate generation progress for free users (delayed)
      if (subscription.tier === 'free') {
        toast({
          title: "已加入队列",
          description: "免费用户需要排队，预计30-60秒",
        });
        
        // Simulate queue delay
        for (let i = 10; i <= 50; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 6000));
          setProgress(i);
        }
      } else {
        setProgress(50);
      }

      // Call edge function to generate
      const { data, error } = await supabase.functions.invoke('generate-ai-coloring', {
        body: { prompt }
      });

      if (error) throw error;

      setProgress(100);
      
      toast({
        title: "生成成功！",
        description: "你的涂色页已经准备好了",
      });

      // Reload user data
      await loadUserData(user.id);
      
      // Navigate to the generated page
      if (data?.generation_id) {
        navigate(`/my-creations/${data.generation_id}`);
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "生成失败",
        description: error.message || "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const remainingQuota = subscription ? subscription.monthly_quota - subscription.used_quota : 0;
  const isPremium = subscription?.tier === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-primary" />
            AI 创作涂色页
          </h1>
          <p className="text-muted-foreground text-lg">
            用文字描述，让AI为你创作独特的涂色页
          </p>
        </div>

        {/* User Status Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                  <Crown className="w-4 h-4 mr-1" />
                  高级会员
                </Badge>
              ) : (
                <Badge variant="outline">免费用户</Badge>
              )}
              <div className="text-sm">
                <span className="text-muted-foreground">本月配额：</span>
                <span className="font-bold ml-2">{remainingQuota} / {subscription?.monthly_quota || 5}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">积分余额：</span>
                <span className="font-bold ml-2">{credits?.balance || 0}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/credits")}
            >
              <Zap className="w-4 h-4 mr-2" />
              购买积分
            </Button>
          </div>
        </Card>

        {/* Creation Form */}
        <Card className="p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                描述你想要的涂色页内容 *
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：一只可爱的小猫在花园里玩耍，周围有蝴蝶和花朵，简单线条适合儿童涂色"
                className="min-h-[120px]"
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {isPremium ? (
                  <span className="flex items-center gap-2 text-primary">
                    <Crown className="w-4 h-4" />
                    高级会员可以使用AI优化提示词功能（即将推出）
                  </span>
                ) : (
                  "提示：详细描述主题、风格和复杂度会获得更好的效果"
                )}
              </p>
            </div>

            {/* Free User Notice */}
            {!isPremium && (
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      免费用户限制
                    </p>
                    <ul className="list-disc list-inside text-amber-800 dark:text-amber-200 space-y-1">
                      <li>需要排队生成（30-60秒）</li>
                      <li>一次只能生成1张</li>
                      <li>生成的作品将公开展示在社区</li>
                    </ul>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-amber-700 dark:text-amber-300 mt-2"
                      onClick={() => navigate("/credits")}
                    >
                      升级为高级会员 →
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>生成中...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate()}
                className="flex-1"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isGenerating ? "生成中..." : "开始创作"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isGenerating}
                size="lg"
              >
                返回首页
              </Button>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-secondary/30">
          <h3 className="font-semibold mb-3">💡 创作小贴士</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 清晰描述主题：如"恐龙"、"公主"、"太空飞船"等</li>
            <li>• 添加场景细节：如"在森林里"、"在海底世界"</li>
            <li>• 指定风格：如"简单线条"、"卡通风格"、"适合3-6岁儿童"</li>
            <li>• 避免过于复杂的描述，保持简洁明了</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
