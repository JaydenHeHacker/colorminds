import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileImage, FolderTree, Download, Star, TrendingUp, Users } from "lucide-react";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Get total pages
      const { count: totalPages } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true });

      // Get total categories
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Get featured pages count
      const { count: featuredPages } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('is_featured', true);

      // Get total downloads
      const { data: downloads } = await supabase
        .from('coloring_pages')
        .select('download_count');
      
      const totalDownloads = downloads?.reduce((sum, page) => sum + (page.download_count || 0), 0) || 0;

      // Get series count
      const { data: seriesData } = await supabase
        .from('coloring_pages')
        .select('series_id')
        .not('series_id', 'is', null);
      
      const uniqueSeries = new Set(seriesData?.map(p => p.series_id)).size;

      // Get recent pages (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentPages } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get category distribution
      const { data: categoryDistribution } = await supabase
        .from('coloring_pages')
        .select('category_id, categories(name, icon)')
        .not('category_id', 'is', null);

      const categoryStats = categoryDistribution?.reduce((acc: any, page: any) => {
        const catName = page.categories?.name || 'Uncategorized';
        const catIcon = page.categories?.icon || '📄';
        if (!acc[catName]) {
          acc[catName] = { count: 0, icon: catIcon };
        }
        acc[catName].count++;
        return acc;
      }, {});

      const topCategories = Object.entries(categoryStats || {})
        .sort(([, a]: any, [, b]: any) => b.count - a.count)
        .slice(0, 5)
        .map(([name, data]: any) => ({ name, count: data.count, icon: data.icon }));

      return {
        totalPages: totalPages || 0,
        totalCategories: totalCategories || 0,
        featuredPages: featuredPages || 0,
        totalDownloads,
        uniqueSeries,
        recentPages: recentPages || 0,
        topCategories,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "涂色页总数",
      value: stats?.totalPages || 0,
      icon: FileImage,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "分类总数",
      value: stats?.totalCategories || 0,
      icon: FolderTree,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "总下载量",
      value: stats?.totalDownloads || 0,
      icon: Download,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "精选页面",
      value: stats?.featuredPages || 0,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      title: "故事系列",
      value: stats?.uniqueSeries || 0,
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
    },
    {
      title: "近7天新增",
      value: stats?.recentPages || 0,
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {stats?.topCategories && stats.topCategories.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">热门分类 Top 5</h3>
          <div className="space-y-3">
            {stats.topCategories.map((cat, index) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </span>
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium">{cat.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {cat.count} 页
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}