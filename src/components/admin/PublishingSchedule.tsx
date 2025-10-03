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
import { Calendar, Clock, FileText, TrendingUp, Send, CalendarDays } from "lucide-react";
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

  // 获取所有页面
  const { data: pages, isLoading } = useQuery({
    queryKey: ['publishing-schedule', selectedStatus],
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
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['publishing-stats'],
    queryFn: async () => {
      const { data: allPages, error } = await supabase
        .from('coloring_pages')
        .select('status, created_at, published_at');

      if (error) throw error;

      const draft = allPages?.filter(p => p.status === 'draft').length || 0;
      const scheduled = allPages?.filter(p => p.status === 'scheduled').length || 0;
      const published = allPages?.filter(p => p.status === 'published').length || 0;

      // 计算本周和本月发布数量
      const now = new Date();
      const weekStart = startOfWeek(now, { locale: zhCN });
      const weekEnd = endOfWeek(now, { locale: zhCN });
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const thisWeek = allPages?.filter(p => {
        if (!p.published_at) return false;
        const pubDate = new Date(p.published_at);
        return pubDate >= weekStart && pubDate <= weekEnd;
      }).length || 0;

      const thisMonth = allPages?.filter(p => {
        if (!p.published_at) return false;
        const pubDate = new Date(p.published_at);
        return pubDate >= monthStart && pubDate <= monthEnd;
      }).length || 0;

      return { draft, scheduled, published, thisWeek, thisMonth };
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

    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
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
      <div className="grid gap-4 md:grid-cols-5">
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
          {/* 筛选器 */}
          <Card className="p-4">
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
            </div>
          </Card>

          {/* 内容列表 */}
          <div className="space-y-3">
            {pages?.map((page) => (
              <Card key={page.id} className="p-4">
                <div className="flex gap-4">
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
                        {page.scheduled_publish_at && page.status === 'scheduled' && (
                          <p className="text-sm text-blue-600 mt-1">
                            定时发布：{format(new Date(page.scheduled_publish_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                        )}
                        {page.published_at && page.status === 'published' && (
                          <p className="text-sm text-green-600 mt-1">
                            已发布：{format(new Date(page.published_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                        )}
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
                              onClick={() => setEditingPage(page)}
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
            ))}
          </div>
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
    </div>
  );
}
