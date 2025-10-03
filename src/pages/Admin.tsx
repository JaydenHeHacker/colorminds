import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, X, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-coloring-page', {
        body: { category: selectedCategory, theme }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.imageUrl;
    },
    onSuccess: (imageUrl) => {
      setGeneratedImage(imageUrl);
      toast.success("涂色页面生成成功！");
    },
    onError: (error: Error) => {
      console.error('Generation error:', error);
      toast.error("生成失败：" + error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedImage || !selectedCategory) {
        throw new Error('缺少必要数据');
      }

      // Upload to R2
      const fileName = `${Date.now()}-${theme.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-r2', {
        body: {
          imageData: generatedImage,
          fileName
        }
      });

      if (uploadError || !uploadData?.publicUrl) {
        throw new Error('上传到 R2 失败：' + (uploadError?.message || '未知错误'));
      }

      // Find category ID
      const category = categories?.find(c => c.name === selectedCategory);
      if (!category) throw new Error('未找到分类');

      // Save to database
      const { error: insertError } = await supabase
        .from('coloring_pages')
        .insert({
          title: theme,
          image_url: uploadData.publicUrl,
          category_id: category.id,
          is_featured: false,
        });

      if (insertError) {
        throw new Error('保存到数据库失败：' + insertError.message);
      }
    },
    onSuccess: () => {
      toast.success("涂色页面已保存！");
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      setGeneratedImage(null);
      setTheme("");
      setSelectedCategory("");
    },
    onError: (error: Error) => {
      console.error('Save error:', error);
      toast.error("保存失败：" + error.message);
    },
  });

  const handleGenerate = () => {
    if (!selectedCategory || !theme) {
      toast.error("请选择类目并输入主题");
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate();
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleDiscard = () => {
    setGeneratedImage(null);
    toast.info("已放弃当前生成");
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
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="theme">主题描述</Label>
                <Input
                  id="theme"
                  placeholder="例如：可爱的小猫在花园里玩耍"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || generateMutation.isPending || !selectedCategory || !theme}
                className="w-full"
              >
                {(isGenerating || generateMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成涂色页面
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">预览</h2>
            
            {generatedImage ? (
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border-2 bg-white">
                  <img
                    src={generatedImage}
                    alt="Generated coloring page"
                    className="w-full h-full object-contain"
                  />
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
      </div>
    </div>
  );
}