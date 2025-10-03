import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Community() {
  const { toast } = useToast();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunityGenerations();
  }, []);

  const loadCommunityGenerations = async () => {
    const { data, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("is_public", true)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading community generations:", error);
      toast({
        title: "加载失败",
        description: "无法加载社区作品",
        variant: "destructive",
      });
    } else {
      setGenerations(data || []);
    }
    setLoading(false);
  };

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `coloring-page-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "下载成功",
      description: "涂色页已保存到本地",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-primary" />
            社区创作
          </h1>
          <p className="text-muted-foreground text-lg">
            探索用户们创作的精彩涂色页
          </p>
        </div>

        {/* Notice */}
        <Card className="p-6 mb-8 bg-primary/5">
          <p className="text-sm text-center">
            💡 这里展示的是免费用户创作的作品。所有免费用户的创作都会公开展示在社区。
            <br />
            成为高级会员后，你可以选择将作品设为私有。
          </p>
        </Card>

        {/* Generations Grid */}
        {generations.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">还没有社区作品</h3>
            <p className="text-muted-foreground mb-6">
              成为第一个创作者，分享你的作品吧！
            </p>
            <Button onClick={() => window.location.href = '/create'}>
              开始创作
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generations.map((gen) => (
              <Card key={gen.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {gen.image_url ? (
                    <img
                      src={gen.image_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(gen.image_url, gen.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm line-clamp-2 mb-2">{gen.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(gen.created_at).toLocaleDateString('zh-CN')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      社区作品
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
