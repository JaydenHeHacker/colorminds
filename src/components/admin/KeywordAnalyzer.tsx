import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, FileText, Brain, CheckCircle2, Database } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CategoryStructure {
  name: string;
  slug: string;
  icon: string;
  description: string;
  level: number;
  subcategories?: CategoryStructure[];
}

export default function KeywordAnalyzer() {
  const queryClient = useQueryClient();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setResult(null);
    } else {
      toast.error("请上传CSV文件");
    }
  };

  const insertCategoryMutation = useMutation({
    mutationFn: async ({ category, parentId }: { category: CategoryStructure; parentId: string | null }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          description: category.description,
          parent_id: parentId,
          path: category.slug, // Will be updated by trigger
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleAnalyze = async () => {
    if (!csvFile) {
      toast.error("请先上传CSV文件");
      return;
    }

    setAnalyzing(true);
    try {
      // Read CSV file
      const csvText = await csvFile.text();

      // Call edge function to analyze
      const { data, error } = await supabase.functions.invoke('analyze-keywords', {
        body: { csvData: csvText, topN: 1000 }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult(data);
      toast.success(`分析完成！识别了 ${data.keywordsAnalyzed} 个关键词`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("分析失败：" + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImportCategories = async () => {
    if (!result?.categories) {
      toast.error("没有可导入的分类数据");
      return;
    }

    const toastId = toast.loading("正在导入分类...");
    try {
      let imported = 0;

      // Function to recursively insert categories
      const insertCategory = async (category: CategoryStructure, parentId: string | null = null) => {
        const inserted = await insertCategoryMutation.mutateAsync({ category, parentId });
        imported++;

        // Insert subcategories
        if (category.subcategories && category.subcategories.length > 0) {
          for (const subcat of category.subcategories) {
            await insertCategory(subcat, inserted.id);
          }
        }
      };

      // Insert all top-level categories
      for (const category of result.categories) {
        await insertCategory(category);
      }

      toast.success(`成功导入 ${imported} 个分类！`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      // Clear result after import
      setResult(null);
      setCsvFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast.error("导入失败：" + (error instanceof Error ? error.message : '未知错误'), { id: toastId });
    }
  };

  const renderCategory = (category: CategoryStructure, depth: number = 0) => {
    return (
      <div key={category.slug} style={{ marginLeft: `${depth * 24}px` }} className="mb-2">
        <div className="flex items-center gap-2 p-2 bg-muted rounded">
          <span className="text-xl">{category.icon}</span>
          <div className="flex-1">
            <div className="font-medium">{category.name}</div>
            <div className="text-xs text-muted-foreground">/{category.slug}</div>
          </div>
          <span className="text-xs px-2 py-1 bg-background rounded">Level {category.level}</span>
        </div>
        {category.subcategories?.map(sub => renderCategory(sub, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6" />
          SEO关键词智能分析
        </h2>
        <p className="text-sm text-muted-foreground">
          上传SEMRush关键词CSV文件，AI将自动分析并生成优化的多层级分类结构
        </p>
      </div>

      {/* File Upload */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">上传SEMRush CSV文件</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
              >
                <Upload className="h-5 w-5" />
                <span>{csvFile ? csvFile.name : '选择CSV文件'}</span>
              </label>
              
              {csvFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {(csvFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!csvFile || analyzing}
            className="w-full gap-2"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                开始AI分析
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Analysis Results */}
      {result && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              分析结果
            </h3>
            <Button onClick={handleImportCategories} className="gap-2">
              <Database className="h-4 w-4" />
              导入到数据库
            </Button>
          </div>

          {/* Insights */}
          {result.insights && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">总搜索量/月</div>
                <div className="text-2xl font-bold">{result.insights.totalVolume.toLocaleString()}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">顶级分类</div>
                <div className="text-2xl font-bold">{result.categories.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">分析关键词</div>
                <div className="text-2xl font-bold">{result.keywordsAnalyzed}</div>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          {result.insights?.recommendations && (
            <div>
              <h4 className="font-semibold mb-2">AI建议</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {result.insights.recommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Tree */}
          <div>
            <h4 className="font-semibold mb-4">生成的分类树结构</h4>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {result.categories.map((cat: CategoryStructure) => renderCategory(cat))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}