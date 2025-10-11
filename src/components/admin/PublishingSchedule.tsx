import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, TrendingUp, Send, Calendar, CheckSquare, ArrowUpDown } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

type PublishStatus = 'draft' | 'published';

type SortField = 'created_at' | 'published_at' | 'updated_at' | 'title';
type SortOrder = 'asc' | 'desc';

export default function PublishingSchedule() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<PublishStatus | 'all'>('all');
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const itemsPerPage = 10;

  // 获取总数
  const { data: totalCount } = useQuery({
    queryKey: ['publishing-schedule-count', selectedStatus, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // 获取分页数据
  const { data: pages, isLoading } = useQuery({
    queryKey: ['publishing-schedule', selectedStatus, currentPage, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false })
        .range(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage - 1);

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // 计算总页数
  const pageCount = Math.ceil((totalCount || 0) / itemsPerPage);

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['publishing-stats'],
    queryFn: async () => {
      // 使用 count 获取精确统计
      const { count: draftCount } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      const { count: publishedCount } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // 计算本周和本月发布数量
      const now = new Date();
      const weekStart = startOfWeek(now, { locale: zhCN });
      const weekEnd = endOfWeek(now, { locale: zhCN });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { count: thisWeekCount } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', weekStart.toISOString())
        .lte('published_at', weekEnd.toISOString());

      const { count: thisMonthCount } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('published_at', monthStart.toISOString())
        .lte('published_at', monthEnd.toISOString());

      return {
        draft: draftCount || 0,
        published: publishedCount || 0,
        thisWeek: thisWeekCount || 0,
        thisMonth: thisMonthCount || 0,
      };
    },
  });

  // 更新发布状态
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
    }: { 
      id: string; 
      status: PublishStatus; 
    }) => {
      const updates: any = { status };
      
      if (status === 'published') {
        // 立即发布
        updates.published_at = new Date().toISOString();
      } else if (status === 'draft') {
        // 改回草稿
        updates.published_at = null;
      }

      const { error } = await supabase
        .from('coloring_pages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishing-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['publishing-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      toast.success("状态更新成功！");
    },
    onError: (error: Error) => {
      toast.error("更新失败：" + error.message);
    },
  });

  const handlePublishNow = (pageId: string) => {
    updateStatusMutation.mutate({
      id: pageId,
      status: 'published',
    });
  };

  const handleMoveToDraft = (pageId: string) => {
    updateStatusMutation.mutate({
      id: pageId,
      status: 'draft',
    });
  };

  // 批量操作
  const handleToggleSelect = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === pages?.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(pages?.map(p => p.id) || []));
    }
  };

  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
    setSelectedPages(new Set()); // 清空选择
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBatchPublish = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }

    Promise.all(
      Array.from(selectedPages).map(id =>
        updateStatusMutation.mutateAsync({
          id,
          status: 'published',
        })
      )
    ).then(() => {
      toast.success(`成功发布 ${selectedPages.size} 个项目！`);
      setSelectedPages(new Set());
    });
  };

  const handleBatchToDraft = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }

    Promise.all(
      Array.from(selectedPages).map(id =>
        updateStatusMutation.mutateAsync({
          id,
          status: 'draft',
        })
      )
    ).then(() => {
      toast.success(`成功移至草稿 ${selectedPages.size} 个项目！`);
      setSelectedPages(new Set());
    });
  };

  const statusConfig = {
    draft: { label: "草稿", color: "text-gray-500", bgColor: "bg-gray-100" },
    published: { label: "已发布", color: "text-green-500", bgColor: "bg-green-100" },
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">内容总数</p>
              <p className="text-2xl font-bold">{(stats?.draft || 0) + (stats?.published || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                草稿 {stats?.draft || 0} / 已发布 {stats?.published || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">草稿</p>
              <p className="text-2xl font-bold">{stats?.draft || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已发布</p>
              <p className="text-2xl font-bold">{stats?.published || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本周发布</p>
              <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">本月发布</p>
              <p className="text-2xl font-bold">{stats?.thisMonth || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 筛选器和批量操作 */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>状态筛选：</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={(v) => setSelectedStatus(v as PublishStatus | 'all')}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>排序字段：</Label>
              <Select 
                value={sortField} 
                onValueChange={(v) => setSortField(v as SortField)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">创建时间</SelectItem>
                  <SelectItem value="published_at">发布时间</SelectItem>
                  <SelectItem value="updated_at">更新时间</SelectItem>
                  <SelectItem value="title">标题</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>排序方向：</Label>
              <Select 
                value={sortOrder} 
                onValueChange={(v) => setSortOrder(v as SortOrder)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="ml-auto"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedPages.size === pages?.length ? "取消全选" : "全选"}
            </Button>
          </div>

          {selectedPages.size > 0 && (
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedPages.size} 个项目
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchPublish}
                  disabled={updateStatusMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  批量发布
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchToDraft}
                  disabled={updateStatusMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  移至草稿
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 内容列表 */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">加载中...</div>
          </Card>
        ) : pages && pages.length > 0 ? (
          pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex gap-4">
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedPages.has(page.id)}
                    onCheckedChange={() => handleToggleSelect(page.id)}
                  />
                </div>

                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 bg-white flex-shrink-0">
                  <img
                    src={page.image_url}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {page.categories?.name}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          生成时间：{format(new Date(page.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </p>
                        {page.published_at && (
                          <p className="text-xs text-green-600">
                            发布时间：{format(new Date(page.published_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${statusConfig[page.status as PublishStatus]?.bgColor} ${statusConfig[page.status as PublishStatus]?.color}`}>
                        {statusConfig[page.status as PublishStatus]?.label}
                      </span>

                      {page.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishNow(page.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          立即发布
                        </Button>
                      )}

                      {page.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoveToDraft(page.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          撤回
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">暂无内容</div>
          </Card>
        )}
      </div>

      {/* 分页控件 */}
      {!isLoading && pageCount > 1 && (
        <div className="mt-6">
          <Pagination
            pageCount={pageCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <div className="text-center text-sm text-muted-foreground mt-3">
            共 {totalCount} 项，每页 {itemsPerPage} 项
          </div>
        </div>
      )}
    </div>
  );
}