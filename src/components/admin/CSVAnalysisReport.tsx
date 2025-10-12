import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KeywordData {
  keyword: string;
  volume: number;
  kd: number;
  intent: string;
}

interface CategoryPlan {
  name: string;
  slug: string;
  volume: number;
  avgKD: number;
  parentCategory?: string;
  keywords: KeywordData[];
}

export const CSVAnalysisReport = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<{
    totalKeywords: number;
    totalVolume: number;
    avgKD: number;
    categories: CategoryPlan[];
    opportunities: KeywordData[];
  } | null>(null);

  const extractCategoryName = (keyword: string): string => {
    const lower = keyword.toLowerCase();
    
    // Skip generic terms
    if (lower === 'coloring pages' || lower === 'coloring page') {
      return 'general';
    }
    
    // Remove noise words but keep the pattern
    let cleaned = lower
      .replace(/coloring pages?/g, '')
      .replace(/printable/g, '')
      .replace(/free/g, '')
      .replace(/cute/g, '')
      .replace(/easy/g, '')
      .replace(/simple/g, '')
      .trim();
    
    // Handle "for X" pattern - extract X
    const forMatch = cleaned.match(/^for\s+(.+)/);
    if (forMatch) {
      cleaned = forMatch[1];
    }
    
    // Handle "X for Y" pattern - extract X (the main subject)
    const forIndex = cleaned.indexOf(' for ');
    if (forIndex > 0) {
      cleaned = cleaned.substring(0, forIndex);
    }
    
    // Remove common prepositions and articles from the start
    cleaned = cleaned
      .replace(/^(the|a|an|of|in|on|at|to|with)\s+/g, '')
      .trim();
    
    // Get the main subject (first 1-2 meaningful words)
    const words = cleaned.split(' ').filter(w => w.length > 1);
    
    if (words.length === 0) return 'general';
    
    // For compound subjects, keep up to 2 words
    // e.g., "ice cream", "solar system", "bubble guppies"
    if (words.length >= 2 && words[0].length + words[1].length < 15) {
      return words.slice(0, 2).join(' ');
    }
    
    return words[0];
  };

  const analyzeCSV = async () => {
    setAnalyzing(true);
    try {
      const response = await fetch('/coloring-pages_broad-match_us_2025-10-03.csv');
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header

      const allKeywords: KeywordData[] = [];
      
      // Parse CSV
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const match = line.match(/^"[^"]*",([^,]*),([^,]*),(\d+),(\d+)/);
        if (!match) continue;

        const volume = parseInt(match[3]);
        const kd = parseInt(match[4]);

        if (volume >= 500) {
          allKeywords.push({
            keyword: match[1].trim(),
            volume,
            kd,
            intent: match[2].trim()
          });
        }
      }

      // Sort by volume
      allKeywords.sort((a, b) => b.volume - a.volume);

      // Group into categories
      const categoryMap = new Map<string, CategoryPlan>();
      
      for (const kw of allKeywords) {
        const catName = extractCategoryName(kw.keyword);
        const catSlug = catName.toLowerCase().replace(/\s+/g, '-');
        
        if (!categoryMap.has(catSlug)) {
          categoryMap.set(catSlug, {
            name: catName.charAt(0).toUpperCase() + catName.slice(1),
            slug: catSlug,
            volume: 0,
            avgKD: 0,
            keywords: []
          });
        }
        
        const cat = categoryMap.get(catSlug)!;
        cat.keywords.push(kw);
        cat.volume += kw.volume;
      }

      // Calculate average KD
      const categories = Array.from(categoryMap.values()).map(cat => {
        cat.avgKD = Math.round(
          cat.keywords.reduce((sum, kw) => sum + kw.kd, 0) / cat.keywords.length
        );
        return cat;
      });

      // Sort by volume (highest first)
      categories.sort((a, b) => b.volume - a.volume);

      // Take top 200 categories
      const topCategories = categories.slice(0, 200);

      // Find opportunities (low KD, high volume)
      const opportunities = allKeywords
        .filter(kw => kw.kd < 25 && kw.volume >= 2000)
        .slice(0, 100);

      const totalVolume = allKeywords.reduce((sum, kw) => sum + kw.volume, 0);
      const avgKD = Math.round(
        allKeywords.reduce((sum, kw) => sum + kw.kd, 0) / allKeywords.length
      );

      setReport({
        totalKeywords: allKeywords.length,
        totalVolume,
        avgKD,
        categories: topCategories,
        opportunities
      });

      toast.success(`分析完成！找到 ${allKeywords.length} 个关键词`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzing(false);
    }
  };

  const exportPlan = () => {
    if (!report) return;

    const plan = {
      summary: {
        totalKeywords: report.totalKeywords,
        totalVolume: report.totalVolume,
        avgKD: report.avgKD,
        categories: report.categories.length
      },
      categories: report.categories,
      opportunities: report.opportunities
    };

    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-analysis-plan.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('计划已导出！');
  };

  const formatNumber = (num: number) => num.toLocaleString('en-US');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV关键词完整分析报告
          </CardTitle>
          <CardDescription>
            分析整个CSV文件（50,004行），生成可执行的详细计划
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={analyzeCSV} 
            disabled={analyzing}
            size="lg"
          >
            {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {analyzing ? '分析中...' : '开始完整分析'}
          </Button>

          {report && (
            <Button onClick={exportPlan} variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              导出详细计划
            </Button>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">总关键词</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(report.totalKeywords)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">总搜索量/月</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(report.totalVolume)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">平均难度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KD {report.avgKD}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">建议类目数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.categories.length}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">所有类目</TabsTrigger>
              <TabsTrigger value="opportunities">黄金机会</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>所有类目（按搜索量排序）</CardTitle>
                  <CardDescription>
                    共 {report.categories.length} 个类目，按月搜索量从高到低排序
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.categories.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {cat.keywords.length} 个关键词
                          </div>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {cat.keywords.slice(0, 3).map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {kw.keyword}
                              </Badge>
                            ))}
                            {cat.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{cat.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-1 ml-4">
                          <div className="text-lg font-bold">{formatNumber(cat.volume)}</div>
                          <div className="text-xs text-muted-foreground">月搜索量</div>
                          <Badge variant="outline" className="text-xs">KD {cat.avgKD}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>黄金机会关键词</CardTitle>
                  <CardDescription>
                    低竞争度（KD&lt;25）+ 高搜索量（≥2000） - 共 {report.opportunities.length} 个
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.opportunities.map((kw, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                        <div>
                          <div className="font-medium">{kw.keyword}</div>
                          <div className="text-xs text-muted-foreground">{kw.intent}</div>
                        </div>
                        <div className="flex gap-2">
                          <Badge>{formatNumber(kw.volume)}</Badge>
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                            KD {kw.kd}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
