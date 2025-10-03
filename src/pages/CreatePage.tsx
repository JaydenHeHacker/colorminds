import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Crown, Zap, Lock, Wand2, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PremiumUpgradeDialog } from "@/components/PremiumUpgradeDialog";

export default function CreatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'speed' | 'privacy' | 'quantity' | 'ai-polish'>('speed');
  const [imageQuantity, setImageQuantity] = useState("1");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Load categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('level', 1)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

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
    const hasQuota = subscription.used_quota < subscription.monthly_quota;
    const hasCredits = credits.balance > 0;
    return hasQuota || hasCredits;
  };

  const handleSpeedBoost = () => {
    setUpgradeFeature('speed');
    setUpgradeDialogOpen(true);
  };

  const handlePrivacyToggle = (checked: boolean) => {
    if (subscription?.tier !== 'premium') {
      setUpgradeFeature('privacy');
      setUpgradeDialogOpen(true);
      return;
    }
    setIsPrivate(checked);
  };

  const handleQuantityChange = (value: string) => {
    if (value !== "1" && subscription?.tier !== 'premium') {
      setUpgradeFeature('quantity');
      setUpgradeDialogOpen(true);
      return;
    }
    setImageQuantity(value);
  };

  const handleAiPolish = () => {
    setUpgradeFeature('ai-polish');
    setUpgradeDialogOpen(true);
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

    if (!selectedCategoryId) {
      toast({
        title: "Please select a category",
        description: "Choose a category for your coloring page",
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
      navigate("/credits-store");
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
        body: { 
          prompt,
          category_id: selectedCategoryId,
          is_private: isPrivate,
        }
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
    <>
      <Header />
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
              onClick={() => navigate("/credits-store")}
            >
              <Zap className="w-4 h-4 mr-2" />
              Buy Credits
            </Button>
          </div>
        </Card>

        {/* Creation Form */}
        <Card className="p-8 mb-8">
          <div className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Category *
              </label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Select the most relevant category for your coloring page
              </p>
            </div>

            {/* Prompt Input with AI Polish */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe the coloring page you want *
              </label>
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: A cute kitten playing in a garden with butterflies and flowers, simple lines suitable for kids"
                  className="min-h-[120px] pr-12"
                  disabled={isGenerating}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleAiPolish}
                  disabled={isGenerating}
                  title="AI Polish Prompt"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Tip: Click the magic wand to let AI enhance your prompt
              </p>
            </div>

            {/* Image Quantity & Privacy Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Images</label>
                <Select value={imageQuantity} onValueChange={handleQuantityChange} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">
                      <span className="flex items-center gap-2">
                        2 Images
                        <Crown className="h-3 w-3 text-amber-500" />
                      </span>
                    </SelectItem>
                    <SelectItem value="3">
                      <span className="flex items-center gap-2">
                        3 Images
                        <Crown className="h-3 w-3 text-amber-500" />
                      </span>
                    </SelectItem>
                    <SelectItem value="4">
                      <span className="flex items-center gap-2">
                        4 Images
                        <Crown className="h-3 w-3 text-amber-500" />
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Generate multiple variations to choose the best one
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-background">
                  <div className="flex items-center gap-2">
                    {isPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <Label htmlFor="privacy-mode" className="cursor-pointer">
                      {isPrivate ? "Private" : "Public"}
                    </Label>
                  </div>
                  <Switch
                    id="privacy-mode"
                    checked={isPrivate}
                    onCheckedChange={handlePrivacyToggle}
                    disabled={isGenerating}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "Control who can see your creations" : "Private mode available with Premium"}
                </p>
              </div>
            </div>

            {/* Progress with Speed Boost */}
            {isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1" />
                  {!isPremium && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSpeedBoost}
                      className="shrink-0"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Speed Up
                    </Button>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Generating... {progress}%
                  </p>
                  {!isPremium && (
                    <p className="text-xs text-muted-foreground">
                      💡 Premium users generate in 5-10 seconds
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate()}
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isGenerating ? "Generating..." : "Start Creating"}
              </Button>

              {!isGenerating && !isPremium && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    🕐 Free users: ~45 seconds average generation time
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/credits-store')}
                  >
                    View Premium Benefits
                  </Button>
                </div>
              )}
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
    <Footer />

    <PremiumUpgradeDialog
      open={upgradeDialogOpen}
      onOpenChange={setUpgradeDialogOpen}
      feature={upgradeFeature}
    />
    </>
  );
}
