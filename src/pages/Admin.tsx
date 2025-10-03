import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, X, ArrowLeft, LogOut, Wand2, Settings, BarChart3, FolderTree, Brain } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ManageColoringPages from "@/components/admin/ManageColoringPages";
import ManageCategories from "@/components/admin/ManageCategories";
import DashboardStats from "@/components/admin/DashboardStats";
import KeywordAnalyzer from "@/components/admin/KeywordAnalyzer";
import InitializeCategories from "@/components/admin/InitializeCategories";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState("1");
  const [generationType, setGenerationType] = useState<"single" | "series">("single");
  const [seriesLength, setSeriesLength] = useState("5");
  const [seriesData, setSeriesData] = useState<any>(null);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data && !error);
      setCheckingRole(false);
    };

    checkAdminRole();
  }, [user]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('order_position', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (generationType === "series") {
        // Generate story series
        const length = parseInt(seriesLength);
        const { data, error } = await supabase.functions.invoke('generate-story-series', {
          body: { category: selectedCategory, theme, difficulty, seriesLength: length }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);
        
        setSeriesData(data);
        return data.images.map((img: any) => img.imageUrl);
      } else {
        // Generate individual pages
        const count = parseInt(generateCount);
        const images: string[] = [];
        
        for (let i = 0; i < count; i++) {
          const { data, error } = await supabase.functions.invoke('generate-coloring-page', {
            body: { category: selectedCategory, theme, difficulty }
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error);
          
          images.push(data.imageUrl);
          toast.success(`已生成第 ${i + 1}/${count} 张图片`);
        }
        
        return images;
      }
    },
    onSuccess: (images) => {
      setGeneratedImages(images);
      if (generationType === "series") {
        toast.success(`成功生成故事系列！共 ${images.length} 张图片`);
      } else {
        toast.success(`成功生成 ${images.length} 张涂色页面！`);
      }
    },
    onError: (error: Error) => {
      console.error('Generation error:', error);
      toast.error("生成失败：" + error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (generatedImages.length === 0 || !selectedCategory) {
        throw new Error('缺少必要数据');
      }

      const category = categories?.find(c => c.name === selectedCategory);
      if (!category) throw new Error('未找到分类');

      let successCount = 0;
      const seriesId = generationType === "series" ? crypto.randomUUID() : null;
      
      for (let i = 0; i < generatedImages.length; i++) {
        const imageData = generatedImages[i];
        
        // Upload to R2
        const fileName = `${Date.now()}-${i}-${theme.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-r2', {
          body: {
            imageData,
            fileName
          }
        });

        if (uploadError || !uploadData?.publicUrl) {
          console.error(`上传第 ${i + 1} 张图片失败:`, uploadError);
          continue;
        }

        // Prepare insert data
        const insertData: any = {
          title: generationType === "series" 
            ? `${theme} - 第${i + 1}章` 
            : `${theme} ${i + 1}`,
          description: generationType === "series" && seriesData?.images?.[i]?.sceneDescription 
            ? seriesData.images[i].sceneDescription 
            : null,
          image_url: uploadData.publicUrl,
          category_id: category.id,
          difficulty: difficulty,
          is_featured: false,
        };

        // Add series fields if generating a story series
        if (generationType === "series" && seriesId) {
          insertData.series_id = seriesId;
          insertData.series_title = theme;
          insertData.series_order = i + 1;
          insertData.series_total = generatedImages.length;
        }

        // Save to database
        const { error: insertError } = await supabase
          .from('coloring_pages')
          .insert(insertData);

        if (insertError) {
          console.error(`保存第 ${i + 1} 张图片失败:`, insertError);
          continue;
        }
        
        successCount++;
        toast.success(`已保存第 ${successCount}/${generatedImages.length} 张图片`);
      }
      
      if (successCount === 0) {
        throw new Error('所有图片保存失败');
      }
      
      return successCount;
    },
    onSuccess: (count) => {
      if (generationType === "series") {
        toast.success(`成功保存故事系列！共 ${count} 章节`);
      } else {
        toast.success(`成功保存 ${count} 张涂色页面！`);
      }
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      setGeneratedImages([]);
      setSeriesData(null);
      setTheme("");
      setSelectedCategory("");
    },
    onError: (error: Error) => {
      console.error('Save error:', error);
      toast.error("保存失败：" + error.message);
    },
  });

  const handleGenerate = async () => {
    if (!selectedCategory || !theme) {
      toast.error("请选择类目并输入主题");
      return;
    }
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDiscard = () => {
    setGeneratedImages([]);
    toast.info("已放弃当前生成");
  };

  const handleGenerateTheme = async () => {
    if (!selectedCategory) {
      toast.error("请先选择类目");
      return;
    }

    setIsGeneratingTheme(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-theme', {
        body: { category: selectedCategory }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setTheme(data.theme);
      toast.success("主题生成成功！");
    } catch (error) {
      console.error('Theme generation error:', error);
      toast.error("生成失败：" + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("登录成功！");
    } catch (error: any) {
      toast.error("登录失败：" + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("已退出登录");
  };

  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              仅管理员可访问，请联系管理员获取账号
            </p>
          </form>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">访问受限</h1>
          <p className="text-muted-foreground mb-6">
            您没有管理员权限，无法访问此页面。
          </p>
          <div className="space-y-2">
            <Button onClick={handleLogout} className="w-full">
              退出登录
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              返回首页
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">管理后台</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="container py-8">
        <Tabs defaultValue="init" className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-6 mb-8">
            <TabsTrigger value="init" className="gap-2">
              <Sparkles className="h-4 w-4" />
              初始化
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              数据统计
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="gap-2">
              <Brain className="h-4 w-4" />
              SEO分析
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Wand2 className="h-4 w-4" />
              生成涂色页
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="h-4 w-4" />
              分类管理
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <Settings className="h-4 w-4" />
              管理涂色页
            </TabsTrigger>
          </TabsList>

          <TabsContent value="init">
            <InitializeCategories />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="analyzer">
            <KeywordAnalyzer />
          </TabsContent>

          <TabsContent value="generate">

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">生成设置</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">类目</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择类目" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {"  ".repeat(cat.level - 1)}{cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="theme">主题描述</Label>
                <div className="flex gap-2">
                  <Input
                    id="theme"
                    placeholder="例如：可爱的小猫在花园里玩耍"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGenerateTheme}
                    disabled={isGeneratingTheme || !selectedCategory}
                    variant="outline"
                    size="icon"
                    title="AI生成主题"
                  >
                    {isGeneratingTheme ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="count">生成数量</Label>
                <Select value={generateCount} onValueChange={setGenerateCount}>
                  <SelectTrigger id="count">
                    <SelectValue placeholder="选择数量" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 张</SelectItem>
                    <SelectItem value="2">2 张</SelectItem>
                    <SelectItem value="3">3 张</SelectItem>
                    <SelectItem value="4">4 张</SelectItem>
                    <SelectItem value="5">5 张</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="generationType">生成类型</Label>
                <Select value={generationType} onValueChange={(value: "single" | "series") => setGenerationType(value)}>
                  <SelectTrigger id="generationType">
                    <SelectValue placeholder="选择生成类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">📄 单张涂色页</SelectItem>
                    <SelectItem value="series">📚 AI故事系列（连贯故事）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generationType === "series" && (
                <div>
                  <Label htmlFor="seriesLength">故事长度</Label>
                  <Select value={seriesLength} onValueChange={setSeriesLength}>
                    <SelectTrigger id="seriesLength">
                      <SelectValue placeholder="选择章节数" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 章节（简短）</SelectItem>
                      <SelectItem value="5">5 章节（标准）</SelectItem>
                      <SelectItem value="7">7 章节（完整）</SelectItem>
                      <SelectItem value="8">8 章节（详细）</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI将创建一个连贯的故事，每个章节一张涂色页
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="difficulty">难度等级</Label>
                <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="选择难度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 简单 - 3-5岁（粗线条，大色块）</SelectItem>
                    <SelectItem value="medium">🟡 中等 - 6-8岁（适中细节）</SelectItem>
                    <SelectItem value="hard">🔴 困难 - 9岁+（复杂精细）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || generateMutation.isPending || !selectedCategory || !theme}
                className="w-full"
              >
                {(isGenerating || generateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {generationType === "series" ? "生成故事系列中..." : "生成中..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {generationType === "series" ? "生成AI故事系列" : "生成涂色页面"}
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">预览</h2>
            
            {generatedImages.length > 0 ? (
              <div className="space-y-4">
                {generationType === "series" && seriesData && (
                  <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h3 className="font-semibold text-lg mb-2">📚 故事系列: {theme}</h3>
                    <p className="text-sm text-muted-foreground">共 {generatedImages.length} 个章节</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <div className="aspect-square overflow-hidden rounded-lg border-2 bg-white">
                        <img
                          src={image}
                          alt={`Generated coloring page ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {generationType === "series" && seriesData?.images?.[index] && (
                        <div className="p-2 bg-muted/50 rounded text-xs">
                          <p className="font-semibold">第 {index + 1} 章</p>
                          <p className="text-muted-foreground line-clamp-2">
                            {seriesData.images[index].sceneDescription}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex-1"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        保存到系统
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDiscard}
                    variant="outline"
                    disabled={saveMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    放弃
                  </Button>
                </div>
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-muted rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground text-center">
                  生成的图片将在此显示
                </p>
              </div>
            )}
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="categories">
            <ManageCategories />
          </TabsContent>

          <TabsContent value="manage">
            <ManageColoringPages />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}