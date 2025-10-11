import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BarChart3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KeywordData {
  keyword: string;
  volume: number;
  kd: number;
  intent: string;
}

interface AnalysisResult {
  summary: {
    totalKeywords: number;
    totalVolume: number;
    avgKD: number;
    uniqueCategories: number;
  };
  byVolume: {
    ultraHigh: { count: number; keywords: KeywordData[] };
    veryHigh: { count: number; keywords: KeywordData[] };
    high: { count: number; keywords: KeywordData[] };
    medium: { count: number; keywords: KeywordData[] };
    low: { count: number; keywords: KeywordData[] };
    veryLow: { count: number; keywords: KeywordData[] };
  };
  opportunities: KeywordData[];
  topCategories: string[];
}

export const KeywordVolumeAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Read CSV file
      const response = await fetch('/coloring-pages_broad-match_us_2025-10-03.csv');
      const csvData = await response.text();

      console.log('Analyzing CSV data...');

      // Call edge function
      const { data, error } = await supabase.functions.invoke('analyze-keywords-volume', {
        body: { csvData, minVolume: 500 }
      });

      if (error) throw error;

      setResult(data);
      toast.success('分析完成！');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzing(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            关键词搜索量分析
          </CardTitle>
          <CardDescription>
            分析CSV文件中所有搜索量&gt;500的关键词
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzing}
            size="lg"
          >
            {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {analyzing ? '分析中...' : '开始分析'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总关键词数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(result.summary.totalKeywords)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  总搜索量/月
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(result.summary.totalVolume)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  平均难度
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KD {result.summary.avgKD}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  潜在类目
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.summary.uniqueCategories}</div>
              </CardContent>
            </Card>
          </div>

          {/* By Volume Ranges */}
          <Card>
            <CardHeader>
              <CardTitle>按搜索量分布</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'ultraHigh', label: '超高流量 (>20K)', color: 'bg-red-500' },
                { key: 'veryHigh', label: '很高流量 (10K-20K)', color: 'bg-orange-500' },
                { key: 'high', label: '高流量 (5K-10K)', color: 'bg-yellow-500' },
                { key: 'medium', label: '中等流量 (2K-5K)', color: 'bg-blue-500' },
                { key: 'low', label: '较低流量 (1K-2K)', color: 'bg-green-500' },
                { key: 'veryLow', label: '低流量 (500-1K)', color: 'bg-gray-500' }
              ].map(({ key, label, color }) => {
                const data = result.byVolume[key as keyof typeof result.byVolume];
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="font-medium">{label}</span>
                      </div>
                      <Badge variant="secondary">{data.count} 关键词</Badge>
                    </div>
                    <div className="pl-5 space-y-1">
                      {data.keywords.slice(0, 5).map((kw, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex justify-between">
                          <span>{kw.keyword}</span>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{formatNumber(kw.volume)}</Badge>
                            <Badge variant="outline" className="text-xs">KD {kw.kd}</Badge>
                          </span>
                        </div>
                      ))}
                      {data.count > 5 && (
                        <div className="text-xs text-muted-foreground">
                          ... 还有 {data.count - 5} 个关键词
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                黄金机会 (低竞争度 + 高搜索量)
              </CardTitle>
              <CardDescription>
                难度&lt;25 且 搜索量&gt;2000 的前50个关键词
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.opportunities.map((kw, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{kw.keyword}</div>
                      <div className="text-xs text-muted-foreground">{kw.intent}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{formatNumber(kw.volume)}</Badge>
                      <Badge variant="outline" className="bg-green-50">KD {kw.kd}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          <Card>
            <CardHeader>
              <CardTitle>识别出的潜在类目关键词</CardTitle>
              <CardDescription>从关键词中提取的主题词（前100个）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.topCategories.map((cat, idx) => (
                  <Badge key={idx} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
