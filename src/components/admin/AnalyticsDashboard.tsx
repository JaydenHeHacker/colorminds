import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Download, Eye, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function AnalyticsDashboard() {
  // 获取下载排行榜
  const { data: topDownloads, isLoading: loadingTopDownloads } = useQuery({
    queryKey: ["top-downloads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coloring_pages")
        .select("id, title, download_count, category_id, categories(name, parent_id)")
        .order("download_count", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // 获取分类下载统计
  const { data: categoryStats, isLoading: loadingCategoryStats } = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const { data: pages, error } = await supabase
        .from("coloring_pages")
        .select("category_id, download_count, categories(name, parent_id)");
      
      if (error) throw error;

      const stats = pages.reduce((acc: any, page: any) => {
        const categoryName = page.categories?.name || "未分类";
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            downloads: 0,
            count: 0,
          };
        }
        acc[categoryName].downloads += page.download_count || 0;
        acc[categoryName].count += 1;
        return acc;
      }, {});

      return Object.values(stats).sort((a: any, b: any) => b.downloads - a.downloads).slice(0, 8);
    },
  });

  // 获取创建趋势（最近30天）
  const { data: creationTrend, isLoading: loadingCreationTrend } = useQuery({
    queryKey: ["creation-trend"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("coloring_pages")
        .select("created_at, download_count")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });
      
      if (error) throw error;

      // 按日期分组
      const grouped = data.reduce((acc: any, page: any) => {
        const date = new Date(page.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, count: 0, downloads: 0 };
        }
        acc[date].count += 1;
        acc[date].downloads += page.download_count || 0;
        return acc;
      }, {});

      return Object.values(grouped);
    },
  });

  // 获取难度分布
  const { data: difficultyStats, isLoading: loadingDifficultyStats } = useQuery({
    queryKey: ["difficulty-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coloring_pages")
        .select("difficulty, download_count");
      
      if (error) throw error;

      const stats = data.reduce((acc: any, page: any) => {
        const difficulty = page.difficulty || "未设置";
        if (!acc[difficulty]) {
          acc[difficulty] = { name: difficulty, value: 0, downloads: 0 };
        }
        acc[difficulty].value += 1;
        acc[difficulty].downloads += page.download_count || 0;
        return acc;
      }, {});

      return Object.values(stats);
    },
  });

  const isLoading = loadingTopDownloads || loadingCategoryStats || loadingCreationTrend || loadingDifficultyStats;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 下载排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            下载排行榜 TOP 10
          </CardTitle>
          <CardDescription>最受欢迎的涂色页面</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topDownloads?.map((page, index) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-950' :
                    index === 1 ? 'bg-gray-400 text-gray-950' :
                    index === 2 ? 'bg-amber-600 text-amber-950' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{page.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {page.categories?.name || "未分类"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  {page.download_count || 0}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类下载统计 */}
        <Card>
          <CardHeader>
            <CardTitle>分类下载统计</CardTitle>
            <CardDescription>各分类的总下载量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="downloads" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 难度分布 */}
        <Card>
          <CardHeader>
            <CardTitle>难度分布</CardTitle>
            <CardDescription>涂色页面难度统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={difficultyStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {difficultyStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 创建趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            最近30天创建趋势
          </CardTitle>
          <CardDescription>每日新增涂色页面数量和累计下载量</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                name="新增数量"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="downloads"
                stroke="hsl(var(--secondary))"
                name="累计下载"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
