import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Database, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CategoryStructure {
  name: string;
  slug: string;
  icon: string;
  description: string;
  level: number;
  subcategories?: CategoryStructure[];
}

export default function InitializeCategories() {
  const [initializing, setInitializing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState<{ total: number; insights: any } | null>(null);

  const insertCategory = async (category: CategoryStructure, parentId: string | null = null): Promise<string> => {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description,
        parent_id: parentId,
        path: category.slug,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  };

  const insertCategoryTree = async (categories: CategoryStructure[], parentId: string | null = null): Promise<number> => {
    let count = 0;
    
    for (const category of categories) {
      const categoryId = await insertCategory(category, parentId);
      count++;
      
      if (category.subcategories && category.subcategories.length > 0) {
        const subCount = await insertCategoryTree(category.subcategories, categoryId);
        count += subCount;
      }
    }
    
    return count;
  };

  const handleInitialize = async () => {
    setInitializing(true);
    
    try {
      // 读取CSV文件
      const csvResponse = await fetch('/user-uploads/coloring-pages_broad-match_us_2025-10-03.csv');
      const csvText = await csvResponse.text();
      
      toast.loading("正在分析关键词...", { id: 'analyze' });
      
      // 调用edge function分析
      const { data, error } = await supabase.functions.invoke('analyze-keywords', {
        body: { csvData: csvText, topN: 1000 }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success(`分析完成！识别了 ${data.keywordsAnalyzed} 个关键词`, { id: 'analyze' });
      
      // 导入分类
      toast.loading("正在导入分类到数据库...", { id: 'import' });
      
      const totalImported = await insertCategoryTree(data.categories);
      
      toast.success(`成功导入 ${totalImported} 个分类！`, { id: 'import' });
      
      setStats({
        total: totalImported,
        insights: data.insights
      });
      
      setCompleted(true);
      
    } catch (error) {
      console.error('初始化失败:', error);
      toast.error("初始化失败：" + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setInitializing(false);
    }
  };

  if (completed && stats) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <div>
            <h3 className="text-2xl font-bold mb-2">初始化完成！</h3>
            <p className="text-muted-foreground mb-4">
              成功创建了 <span className="font-bold text-primary">{stats.total}</span> 个分类
            </p>
            {stats.insights && (
              <div className="grid gap-4 md:grid-cols-3 mt-6">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">总搜索量/月</div>
                  <div className="text-2xl font-bold">{stats.insights.totalVolume?.toLocaleString()}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">顶级分类</div>
                  <div className="text-2xl font-bold">{stats.insights.topCategories?.length || 0}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground">分析关键词</div>
                  <div className="text-2xl font-bold">1000</div>
                </Card>
              </div>
            )}
          </div>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <Database className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-2xl font-bold mb-2">初始化分类树</h3>
          <p className="text-muted-foreground mb-6">
            基于SEMRush关键词数据，使用AI智能分析并创建优化的多层级分类结构
          </p>
          
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="flex items-start gap-2 text-sm text-left">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">注意事项：</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>此操作将分析上传的CSV文件（50,000+关键词）</li>
                  <li>AI将创建最多3层的分类结构</li>
                  <li>处理时间约30-60秒</li>
                  <li>完成后此功能可以移除</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            onClick={handleInitialize}
            disabled={initializing}
            size="lg"
            className="w-full max-w-md gap-2"
          >
            {initializing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                正在初始化...
              </>
            ) : (
              <>
                <Database className="h-5 w-5" />
                开始初始化分类树
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
