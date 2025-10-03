import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [theme, setTheme] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
        throw new Error('Missing required data');
      }

      // Convert base64 to blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      
      // Upload to storage
      const fileName = `${Date.now()}-${theme.replace(/\s+/g, '-')}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coloring-pages')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('coloring-pages')
        .getPublicUrl(fileName);

      // Find category ID
      const category = categories?.find(c => c.name === selectedCategory);
      if (!category) throw new Error('Category not found');

      // Save to database
      const { error: insertError } = await supabase
        .from('coloring_pages')
        .insert({
          title: theme,
          image_url: publicUrl,
          category_id: category.id,
          is_featured: false,
        });

      if (insertError) throw insertError;
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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
          <h1 className="text-4xl font-bold mb-2">管理后台</h1>
          <p className="text-muted-foreground">使用AI生成涂色页面</p>
        </div>

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