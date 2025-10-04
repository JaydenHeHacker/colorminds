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
import { Sparkles, Crown, Zap, Wand2, Eye, EyeOff, BookOpen, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PremiumUpgradeDialog } from "@/components/PremiumUpgradeDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeriesExamplesShowcase } from "@/components/SeriesExamplesShowcase";
import { ImageUploadZone } from "@/components/ImageUploadZone";

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
  const [upgradeFeature, setUpgradeFeature] = useState<'speed' | 'privacy' | 'quantity' | 'ai-polish' | 'series' | 'image-to-image'>('speed');
  const [imageQuantity, setImageQuantity] = useState("1");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [generationType, setGenerationType] = useState<'single' | 'series'>('single');
  const [seriesLength, setSeriesLength] = useState("4");
  const [inputMode, setInputMode] = useState<'text' | 'image' | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [lineComplexity, setLineComplexity] = useState('medium');
  const [imageStyle, setImageStyle] = useState('original');
  const [lineWeight, setLineWeight] = useState('medium');
  const [backgroundMode, setBackgroundMode] = useState('keep');

  // Load categories - get children of "All" root category
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data: allCategory, error: allError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'all')
        .maybeSingle();
      
      if (allError) throw allError;
      if (!allCategory) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon')
        .eq('parent_id', allCategory.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    checkAuth();
    
    const savedState = localStorage.getItem('createPageState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setPrompt(state.prompt || '');
        setSelectedCategoryId(state.selectedCategoryId || '');
        setImageQuantity(state.imageQuantity || '1');
        setIsPrivate(state.isPrivate || false);
        localStorage.removeItem('createPageState');
      } catch (error) {
        console.error('Error restoring form state:', error);
      }
    }
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await loadUserData(user.id);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: syncData } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        console.log('Subscription sync response:', syncData);
      }

      // Wait a bit for the database to update
      await new Promise(resolve => setTimeout(resolve, 500));

      const [subResult, creditsResult] = await Promise.all([
        supabase.from("user_subscriptions").select("*").eq("user_id", userId).single(),
        supabase.from("user_credits").select("*").eq("user_id", userId).single(),
      ]);

      console.log('Loaded subscription from DB:', subResult.data);

      if (subResult.data) setSubscription(subResult.data);
      if (creditsResult.data) setCredits(creditsResult.data);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
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

  const handleAiPolish = async () => {
    if (subscription?.tier !== 'premium') {
      setUpgradeFeature('ai-polish');
      setUpgradeDialogOpen(true);
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Please enter a prompt first",
        description: "Enter your prompt and then click the magic wand to optimize it",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('optimize-prompt', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.optimizedPrompt) {
        setPrompt(data.optimizedPrompt);
        toast({
          title: "Prompt optimized!",
          description: "Your prompt has been enhanced by AI",
        });
      }
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      toast({
        title: "Failed to optimize prompt",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleGenerationTypeChange = (value: 'single' | 'series') => {
    setGenerationType(value);
  };

  const handleSelectInputMode = (mode: 'text' | 'image') => {
    setInputMode(mode);
  };

  const handleBackToSelection = () => {
    setInputMode(null);
    setPrompt('');
    setSelectedImage(null);
    setGenerationType('single');
  };

  const handleGenerate = async () => {
    if (!user) {
      localStorage.setItem('createPageState', JSON.stringify({
        prompt,
        selectedCategoryId,
        imageQuantity,
        isPrivate,
      }));
      
      toast({
        title: "Please log in first",
        description: "You need to log in to generate coloring pages",
        variant: "destructive",
      });
      navigate("/auth?redirect=/create");
      return;
    }

    if (inputMode === 'image' && subscription?.tier !== 'premium') {
      setUpgradeFeature('image-to-image');
      setUpgradeDialogOpen(true);
      return;
    }

    if (generationType === 'series' && subscription?.tier !== 'premium') {
      setUpgradeFeature('series');
      setUpgradeDialogOpen(true);
      return;
    }

    if (inputMode === 'text' && !prompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: generationType === 'series' ? "Describe the story theme" : "Describe the coloring page you want",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'image' && !selectedImage) {
      toast({
        title: "Please upload an image",
        description: "Upload a photo to convert to coloring page",
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
      if (subscription.tier === 'free') {
        toast({
          title: "Added to queue",
          description: "Free users need to wait in queue, estimated 30-60 seconds",
        });
        
        for (let i = 10; i <= 50; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 6000));
          setProgress(i);
        }
      } else {
        setProgress(50);
      }

      if (generationType === 'series') {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name')
          .eq('id', selectedCategoryId)
          .single();

        const { data, error } = await supabase.functions.invoke('generate-story-series', {
          body: {
            category: categoryData?.name || 'General',
            theme: prompt,
            difficulty: 'easy',
            seriesLength: parseInt(seriesLength)
          }
        });

        if (error) throw error;

        setProgress(100);
        
        toast({
          title: "Series generation successful!",
          description: `Created ${seriesLength} connected coloring pages`,
        });

        await loadUserData(user.id);
        
        // Jump to the first generated page
        if (data?.images && data.images.length > 0 && data.images[0].generationId) {
          navigate(`/my-creations/${data.images[0].generationId}`);
        } else {
          // Fallback to profile if no generation ID
          navigate('/profile');
        }
      } else {
        let requestBody: any = {
          category_id: selectedCategoryId,
          is_private: isPrivate,
        };

        if (inputMode === 'image' && selectedImage) {
          // Convert image to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedImage);
          });

          requestBody = {
            ...requestBody,
            image_data: base64,
            line_complexity: lineComplexity,
            image_style: imageStyle,
            line_weight: lineWeight,
            background_mode: backgroundMode,
          };
        } else {
          requestBody.prompt = prompt;
        }

        const { data, error } = await supabase.functions.invoke('generate-ai-coloring', {
          body: requestBody
        });

        if (error) throw error;

        setProgress(100);
        
        toast({
          title: "Generation successful!",
          description: "Your coloring page is ready",
        });

        await loadUserData(user.id);
        
        if (data?.generation_id) {
          navigate(`/my-creations/${data.generation_id}`);
        }
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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-primary" />
              Create with AI
            </h1>
            <p className="text-muted-foreground text-lg">
              Describe what you want, and AI will create a unique coloring page for you
            </p>
          </div>

          {user && (
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
          )}

          {!user && (
            <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    💡 Try it out! Fill in the form below to see how it works
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You'll be asked to log in when you click "Start Creating"
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Log In Now
                </Button>
              </div>
            </Card>
          )}

          {inputMode === null ? (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">What would you like to create?</h2>
                <p className="text-muted-foreground">Choose how you want to generate your coloring page</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card 
                  className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/50 group"
                  onClick={() => handleSelectInputMode('text')}
                >
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Create from Text</h3>
                    <p className="text-sm text-muted-foreground">
                      Describe what you want and AI will generate unique coloring pages
                    </p>
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>Single page or story series</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>Unlimited creativity</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        <span>AI-powered generation</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" size="lg">
                      Start Creating
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>

                <Card 
                  className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-orange-500/5 group relative overflow-hidden"
                  onClick={() => handleSelectInputMode('image')}
                >
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-10 h-10 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold">Convert Your Photo</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload any photo and transform it into a beautiful coloring page
                    </p>
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                        <span>Family photos & pets</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                        <span>Custom style options</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-600"></div>
                        <span>Adjustable complexity</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" size="lg">
                      Convert Photo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="p-8 mb-8">
              {/* Mode indicator and switch */}
              <div className="flex items-center justify-between p-4 mb-6 bg-secondary/30 rounded-lg border">
                <div className="flex items-center gap-3">
                  {inputMode === 'text' ? (
                    <>
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Text to Image Mode</p>
                        <p className="text-xs text-muted-foreground">Create from description</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Image to Image Mode
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Convert photo to coloring page</p>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleBackToSelection}
                  size="sm"
                  disabled={isGenerating}
                >
                  Switch Mode
                </Button>
              </div>

              <div className="space-y-6">
                {inputMode === 'text' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-3">
                        Generation Type
                      </label>
                      <Tabs value={generationType} onValueChange={(v) => handleGenerationTypeChange(v as 'single' | 'series')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="single">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Single Page
                          </TabsTrigger>
                          <TabsTrigger value="series">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Series
                            {!isPremium && <Crown className="w-3 h-3 ml-2 text-amber-500" />}
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <p className="text-sm text-muted-foreground mt-2">
                        {generationType === 'single' 
                          ? "Generate a single coloring page"
                          : "Generate 4-8 connected pages with a cohesive story"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Category *
                      </label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a category..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
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

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {generationType === 'single' ? 'Describe the coloring page you want *' : 'Series Theme & Story *'}
                      </label>
                      <div className="relative">
                        <Textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={
                            generationType === 'single'
                              ? "Example: A cute kitten playing in a garden with butterflies and flowers, simple lines suitable for kids"
                              : "Example: A baby dinosaur's adventure from hatching to making friends in the jungle"
                          }
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
                        {generationType === 'single'
                          ? "Tip: Click the magic wand to let AI enhance your prompt"
                          : "AI will create a cohesive story arc across multiple pages"}
                      </p>
                    </div>

                    {generationType === 'series' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Series Length</label>
                          <Select value={seriesLength} onValueChange={setSeriesLength} disabled={isGenerating}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">4 Pages</SelectItem>
                              <SelectItem value="5">5 Pages</SelectItem>
                              <SelectItem value="6">6 Pages</SelectItem>
                              <SelectItem value="7">7 Pages</SelectItem>
                              <SelectItem value="8">8 Pages</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            More pages = more detailed story progression
                          </p>
                        </div>

                        <SeriesExamplesShowcase />
                      </div>
                    )}

                    {generationType === 'single' && (
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
                    )}

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

                    <div className="space-y-4">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || (user && !canGenerate())}
                        className="w-full"
                        size="lg"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {isGenerating ? "Generating..." : (user ? "Start Creating" : "Start Creating (Login Required)")}
                      </Button>

                      {!isGenerating && !isPremium && (
                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">
                            🕐 Free users: ~45 seconds average generation time
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate("/credits-store")}
                            className="text-primary"
                          >
                            Upgrade to Premium for instant generation
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <ImageUploadZone
                      onImageSelect={setSelectedImage}
                      selectedImage={selectedImage}
                      onRemove={() => setSelectedImage(null)}
                      lineComplexity={lineComplexity}
                      onLineComplexityChange={setLineComplexity}
                      style={imageStyle}
                      onStyleChange={setImageStyle}
                      lineWeight={lineWeight}
                      onLineWeightChange={setLineWeight}
                      backgroundMode={backgroundMode}
                      onBackgroundModeChange={setBackgroundMode}
                      disabled={isGenerating}
                    />

                    {selectedImage && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Select Category *
                          </label>
                          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} disabled={isGenerating}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a category..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {categories?.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {isGenerating && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Progress value={progress} className="flex-1" />
                            </div>
                            <div className="text-center space-y-1">
                              <p className="text-sm text-muted-foreground">
                                Converting your photo... {progress}%
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || (user && !canGenerate())}
                            className="w-full"
                            size="lg"
                          >
                            <Sparkles className="w-5 h-5 mr-2" />
                            {isGenerating ? "Converting..." : (user ? "Convert to Coloring Page" : "Convert (Login Required)")}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {!inputMode && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">💡 Creation Tips</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">For Best Results:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Be specific about details you want</li>
                    <li>• Mention if it's for kids or adults</li>
                    <li>• Describe the scene and main subject</li>
                    <li>• Specify simple or detailed lines</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Example Prompts:</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• "Cute baby elephant with balloons"</li>
                    <li>• "Detailed mandala pattern"</li>
                    <li>• "Simple car for 3-year-olds"</li>
                    <li>• "Fantasy castle with dragons"</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
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
