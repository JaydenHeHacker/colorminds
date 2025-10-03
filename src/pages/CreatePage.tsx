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
        title: "Please log in",
        description: "You need to log in to create coloring pages",
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
        title: "Please enter a prompt",
        description: "Describe the coloring page you want",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerate()) {
      toast({
        title: "Insufficient quota",
        description: "Please purchase credits or upgrade membership",
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
          title: "Added to queue",
          description: "Free users need to wait in queue, estimated 30-60 seconds",
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
        title: "Generation successful!",
        description: "Your coloring page is ready",
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
        title: "Generation failed",
        description: error.message || "Please try again later",
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
            Create with AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Describe what you want, and AI will create a unique coloring page for you
          </p>
        </div>

        {/* User Status Card */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                  <Crown className="w-4 h-4 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="outline">Free User</Badge>
              )}
              <div className="text-sm">
                <span className="text-muted-foreground">Monthly Quota:</span>
                <span className="font-bold ml-2">{remainingQuota} / {subscription?.monthly_quota || 5}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Credits:</span>
                <span className="font-bold ml-2">{credits?.balance || 0}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/credits")}
            >
              <Zap className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        </Card>

        {/* Creation Form */}
        <Card className="p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe the coloring page you want *
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A cute kitten playing in a garden with butterflies and flowers, simple lines suitable for kids"
                className="min-h-[120px]"
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {isPremium ? (
                  <span className="flex items-center gap-2 text-primary">
                    <Crown className="w-4 h-4" />
                    Premium members get AI prompt optimization (coming soon)
                  </span>
                ) : (
                  "Tip: Detailed descriptions of theme, style and complexity will get better results"
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
                      Free User Limitations
                    </p>
                    <ul className="list-disc list-inside text-amber-800 dark:text-amber-200 space-y-1">
                      <li>Queue-based generation (30-60 seconds)</li>
                      <li>Can only generate 1 at a time</li>
                      <li>Creations will be publicly displayed in community</li>
                    </ul>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-amber-700 dark:text-amber-300 mt-2"
                      onClick={() => navigate("/credits")}
                    >
                      Upgrade to Premium →
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Generating...</span>
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
                {isGenerating ? "Generating..." : "Start Creating"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isGenerating}
                size="lg"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-6 bg-secondary/30">
          <h3 className="font-semibold mb-3">💡 Creation Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Clearly describe the theme: e.g. "dinosaur", "princess", "spaceship"</li>
            <li>• Add scene details: e.g. "in a forest", "underwater world"</li>
            <li>• Specify style: e.g. "simple lines", "cartoon style", "suitable for ages 3-6"</li>
            <li>• Avoid overly complex descriptions, keep it simple and clear</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
