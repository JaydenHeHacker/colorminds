import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, Download, Upload, Save, History, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  goldenScore: number;
  parentCategory?: string;
  keywords: KeywordData[];
}

export const CSVAnalysisReport = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState("coloring-pages_broad-match_us_2025-10-03.csv");
  const [analysisName, setAnalysisName] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      let text: string;
      
      if (csvFile) {
        // Read uploaded file
        text = await csvFile.text();
        setCsvFileName(csvFile.name);
      } else {
        // Read default file
        const response = await fetch('/coloring-pages_broad-match_us_2025-10-03.csv');
        text = await response.text();
      }
      
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
            goldenScore: 0,
            keywords: []
          });
        }
        
        const cat = categoryMap.get(catSlug)!;
        cat.keywords.push(kw);
        cat.volume += kw.volume;
      }

      // Calculate average KD and Golden Score
      const categories = Array.from(categoryMap.values()).map(cat => {
        cat.avgKD = Math.round(
          cat.keywords.reduce((sum, kw) => sum + kw.kd, 0) / cat.keywords.length
        );
        
        // Golden Score: High volume + Low KD = High ROI
        // Raw formula: (Volume / 100) * (100 - avgKD) * sqrt(keyword_count)
        const volumeFactor = cat.volume / 100;
        const difficultyFactor = Math.max(0, 100 - cat.avgKD);
        const keywordBonus = Math.sqrt(cat.keywords.length);
        cat.goldenScore = volumeFactor * difficultyFactor * keywordBonus;
        
        return cat;
      });

      // Normalize Golden Score to 0-100
      const maxRawScore = Math.max(...categories.map(c => c.goldenScore));
      const minRawScore = Math.min(...categories.map(c => c.goldenScore));
      
      categories.forEach(cat => {
        if (maxRawScore === minRawScore) {
          cat.goldenScore = 50; // All same, set to middle
        } else {
          cat.goldenScore = Math.round(
            ((cat.goldenScore - minRawScore) / (maxRawScore - minRawScore)) * 100
          );
        }
      });

      // Sort by Golden Score (highest first)
      categories.sort((a, b) => b.goldenScore - a.goldenScore);

      // Take all categories (no limit)
      const allCategories = categories;

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
        categories: allCategories,
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

  const saveAnalysis = async () => {
    if (!report) {
      toast.error('请先完成分析');
      return;
    }

    if (!analysisName.trim()) {
      toast.error('请输入分析名称');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('keyword_analysis_results')
        .insert([{
          analysis_name: analysisName,
          csv_filename: csvFileName,
          total_keywords: report.totalKeywords,
          total_volume: report.totalVolume,
          avg_kd: report.avgKD,
          categories: report.categories as any,
          opportunities: report.opportunities as any,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast.success('分析结果已保存！');
      setAnalysisName('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('keyword_analysis_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistoryData(data || []);
      setHistoryOpen(true);
    } catch (error) {
      console.error('Load history error:', error);
      toast.error('加载历史记录失败');
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAnalysis = (item: any) => {
    setReport({
      totalKeywords: item.total_keywords,
      totalVolume: item.total_volume,
      avgKD: item.avg_kd,
      categories: item.categories,
      opportunities: item.opportunities
    });
    setCsvFileName(item.csv_filename);
    setHistoryOpen(false);
    toast.success(`已加载分析：${item.analysis_name}`);
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('keyword_analysis_results')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistoryData(prev => prev.filter(item => item.id !== id));
      toast.success('已删除');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('删除失败');
    } finally {
      setDeleteId(null);
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-upload">上传CSV文件（可选）</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCsvFile(file);
                    toast.success(`已选择文件: ${file.name}`);
                  }
                }}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                如果不上传，将使用默认CSV文件
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={analyzeCSV} 
                disabled={analyzing}
                size="lg"
              >
                {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {analyzing ? '分析中...' : '开始完整分析'}
              </Button>

              <Button 
                onClick={loadHistory}
                disabled={loadingHistory}
                variant="outline"
                size="lg"
              >
                {loadingHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                历史记录
              </Button>
            </div>
          </div>

          {report && (
            <div className="flex gap-2 pt-4 border-t">
              <div className="flex-1">
                <Label htmlFor="analysis-name">分析名称</Label>
                <Input
                  id="analysis-name"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="例如：2025年Q1关键词分析"
                  className="mt-2"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  onClick={saveAnalysis}
                  disabled={saving || !analysisName.trim()}
                  variant="default"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  保存分析
                </Button>
                <Button onClick={exportPlan} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  导出JSON
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>历史分析记录</DialogTitle>
            <DialogDescription>
              点击任意记录加载分析结果
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {historyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无历史记录</p>
            ) : (
              historyData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => loadAnalysis(item)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.analysis_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      文件: {item.csv_filename}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.total_keywords} 关键词 | {item.categories.length} 类目 | 
                      {new Date(item.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，确定要删除这条分析记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteAnalysis(deleteId)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  <CardTitle>所有类目（按黄金分数排序）</CardTitle>
                  <CardDescription>
                    共 {report.categories.length} 个类目，黄金分数 0-100（综合搜索量、难度、关键词数量）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {report.categories.map((cat, idx) => {
                      // Calculate score level for visual feedback
                      const isGolden = cat.goldenScore >= 70;
                      const isSilver = cat.goldenScore >= 40 && cat.goldenScore < 70;
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                            isGolden ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 
                            isSilver ? 'border-gray-400 bg-gray-50 dark:bg-gray-900/20' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                              {isGolden && <span className="text-yellow-500">🏆</span>}
                              {isSilver && <span className="text-gray-400">🥈</span>}
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {cat.keywords.length} 个关键词 | {formatNumber(cat.volume)}/月 | KD {cat.avgKD}
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
                            <div className={`text-2xl font-bold ${
                              isGolden ? 'text-yellow-600 dark:text-yellow-400' :
                              isSilver ? 'text-gray-600 dark:text-gray-400' :
                              'text-muted-foreground'
                            }`}>
                              {cat.goldenScore}
                            </div>
                            <div className="text-xs text-muted-foreground">黄金分数</div>
                          </div>
                        </div>
                      );
                    })}
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
