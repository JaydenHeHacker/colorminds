import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, FileText, TrendingUp, Send, CalendarDays, CheckSquare, Edit2 } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

type PublishStatus = 'draft' | 'scheduled' | 'published';

export default function PublishingSchedule() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<PublishStatus | 'all'>('all');
  const [editingPage, setEditingPage] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [showBatchScheduleDialog, setShowBatchScheduleDialog] = useState(false);
  const [batchScheduledDate, setBatchScheduledDate] = useState("");
  const [batchScheduledTime, setBatchScheduledTime] = useState("09:00");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // 获取总数
  const { data: totalCount } = useQuery({
    queryKey: ['publishing-schedule-count', selectedStatus],
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
    queryKey: ['publishing-schedule', selectedStatus, currentPage],
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
        .order('created_at', { ascending: false })
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

      const { count: scheduledCount } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

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
        scheduled: scheduledCount || 0,
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
      scheduledAt 
    }: { 
      id: string; 
      status: PublishStatus; 
      scheduledAt?: string;
    }) => {
      const updates: any = { status };
      
      if (status === 'scheduled' && scheduledAt) {
        updates.scheduled_publish_at = scheduledAt;
      } else if (status === 'published') {
        updates.published_at = new Date().toISOString();
        updates.scheduled_publish_at = null;
      } else if (status === 'draft') {
        updates.scheduled_publish_at = null;
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
      setEditingPage(null);
    },
    onError: (error: Error) => {
      toast.error("更新失败：" + error.message);
    },
  });

  const handleSchedulePublish = () => {
    if (!editingPage || !scheduledDate || !scheduledTime) {
      toast.error("请选择日期和时间");
      return;
    }

    // 将本地时间转换为 UTC 时间存储
    const localDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
    const scheduledDateTime = localDateTime.toISOString();
    
    updateStatusMutation.mutate({
      id: editingPage.id,
      status: 'scheduled',
      scheduledAt: scheduledDateTime,
    });
  };

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

  const handleBatchSchedule = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }
    if (!batchScheduledDate || !batchScheduledTime) {
      toast.error("请选择日期和时间");
      return;
    }

    // 将本地时间转换为 UTC 时间存储
    const localDateTime = new Date(`${batchScheduledDate}T${batchScheduledTime}:00`);
    const scheduledDateTime = localDateTime.toISOString();
    
    // 批量更新
    Promise.all(
      Array.from(selectedPages).map(id =>
        updateStatusMutation.mutateAsync({
          id,
          status: 'scheduled',
          scheduledAt: scheduledDateTime,
        })
      )
    ).then(() => {
      toast.success(`成功为 ${selectedPages.size} 个项目设置定时发布！`);
      setSelectedPages(new Set());
      setShowBatchScheduleDialog(false);
    });
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

  const handleEditSchedule = (page: any) => {
    setEditingPage(page);
    if (page.scheduled_publish_at) {
      // 将 UTC 时间转换为本地时间显示
      const utcDate = new Date(page.scheduled_publish_at);
      setScheduledDate(format(utcDate, 'yyyy-MM-dd'));
      setScheduledTime(format(utcDate, 'HH:mm'));
    } else {
      setScheduledDate(format(new Date(), 'yyyy-MM-dd'));
      setScheduledTime("09:00");
    }
  };

  // 获取日历范围内的日期
  const getCalendarDates = () => {
    if (calendarView === 'week') {
      const start = startOfWeek(currentDate, { locale: zhCN });
      const end = endOfWeek(currentDate, { locale: zhCN });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  // 获取某一天的定时发布内容
  const getScheduledForDate = (date: Date) => {
    return pages?.filter(page => {
      if (page.status !== 'scheduled' || !page.scheduled_publish_at) return false;
      return isSameDay(new Date(page.scheduled_publish_at), date);
    }) || [];
  };

  const statusConfig = {
    draft: { label: "草稿", color: "text-gray-500", bgColor: "bg-gray-100" },
    scheduled: { label: "定时发布", color: "text-blue-500", bgColor: "bg-blue-100" },
    published: { label: "已发布", color: "text-green-500", bgColor: "bg-green-100" },
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">内容总数</p>
              <p className="text-2xl font-bold">{(stats?.draft || 0) + (stats?.scheduled || 0) + (stats?.published || 0)}</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">定时发布</p>
              <p className="text-2xl font-bold">{stats?.scheduled || 0}</p>
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

      {/* 主要内容 */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <FileText className="h-4 w-4 mr-2" />
            内容列表
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            发布日历
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* 筛选器和批量操作 */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>状态筛选：</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={(v) => setSelectedStatus(v as PublishStatus | 'all')}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="scheduled">定时发布</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>

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
                      onClick={() => setShowBatchScheduleDialog(true)}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      批量定时
                    </Button>
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
                            {page.scheduled_publish_at && page.status === 'scheduled' && (
                              <p className="text-xs text-blue-600">
                                定时发布：{format(new Date(page.scheduled_publish_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${statusConfig[page.status as PublishStatus]?.bgColor} ${statusConfig[page.status as PublishStatus]?.color}`}>
                            {statusConfig[page.status as PublishStatus]?.label}
                          </span>

                          {page.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSchedule(page)}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                定时发布
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handlePublishNow(page.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                立即发布
                              </Button>
                            </>
                          )}

                          {page.status === 'scheduled' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSchedule(page)}
                                title="编辑定时"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMoveToDraft(page.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                移至草稿
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handlePublishNow(page.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                立即发布
                              </Button>
                            </>
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
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {/* 日历控制 */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (calendarView === 'week') {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  上一{calendarView === 'week' ? '周' : '月'}
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentDate, calendarView === 'week' ? 'yyyy年 MM月 第w周' : 'yyyy年 MM月', { locale: zhCN })}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (calendarView === 'week') {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  下一{calendarView === 'week' ? '周' : '月'}
                </Button>
              </div>

              <Select value={calendarView} onValueChange={(v) => setCalendarView(v as 'week' | 'month')}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">周视图</SelectItem>
                  <SelectItem value="month">月视图</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* 日历网格 */}
          <div className={`grid gap-2 ${calendarView === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
            {getCalendarDates().map((date) => {
              const scheduledPages = getScheduledForDate(date);
              const isToday = isSameDay(date, new Date());

              return (
                <Card
                  key={date.toISOString()}
                  className={`p-3 ${isToday ? 'border-primary border-2' : ''}`}
                >
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">
                      {format(date, 'MM-dd', { locale: zhCN })}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {format(date, 'EEEE', { locale: zhCN })}
                      </span>
                    </div>
                    
                    {scheduledPages.length > 0 && (
                      <div className="space-y-1">
                        {scheduledPages.map((page) => (
                          <div
                            key={page.id}
                            className="text-xs p-2 bg-blue-50 rounded border border-blue-200"
                          >
                            <div className="font-medium truncate">{page.title}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(page.scheduled_publish_at), 'HH:mm')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* 定时发布对话框 */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置定时发布</DialogTitle>
            <DialogDescription>
              为 "{editingPage?.title}" 设置发布时间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>发布日期</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <Label>发布时间</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              取消
            </Button>
            <Button
              onClick={handleSchedulePublish}
              disabled={updateStatusMutation.isPending}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量定时发布对话框 */}
      <Dialog open={showBatchScheduleDialog} onOpenChange={setShowBatchScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量设置定时发布</DialogTitle>
            <DialogDescription>
              为选中的 {selectedPages.size} 个项目设置统一的发布时间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>发布日期</Label>
              <Input
                type="date"
                value={batchScheduledDate}
                onChange={(e) => setBatchScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <Label>发布时间</Label>
              <Input
                type="time"
                value={batchScheduledTime}
                onChange={(e) => setBatchScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchScheduleDialog(false)}>
              取消
            </Button>
            <Button
              onClick={handleBatchSchedule}
              disabled={updateStatusMutation.isPending}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
