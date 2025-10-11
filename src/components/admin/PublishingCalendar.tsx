import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from "date-fns";
import { zhCN } from "date-fns/locale";

interface PublishingJob {
  id: string;
  name: string;
  category_id: string | null;
  schedule_time: string;
  schedule_days: number[];
  publish_count: number;
  is_active: boolean;
  created_at: string;
  start_date?: string | null;
  end_date?: string | null;
  categories?: { name: string };
}

export const PublishingCalendar = () => {
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*, categories(name)")
      .eq("is_active", true)
      .eq("is_recurring", true);

    if (error) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
      return;
    }

    setJobs(data || []);
  };

  const getJobsForDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return jobs.filter(job => {
      // 检查是否在执行日期范围内
      if (!job.schedule_days.includes(dayOfWeek)) {
        return false;
      }
      
      // 检查是否在开始日期之前
      if (job.start_date) {
        const startDate = new Date(job.start_date);
        startDate.setHours(0, 0, 0, 0);
        if (date < startDate) {
          return false;
        }
      }
      
      // 检查是否超过结束日期
      if (job.end_date) {
        const endDate = new Date(job.end_date);
        endDate.setHours(23, 59, 59, 999);
        if (date > endDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getDaysToShow = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const navigatePrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getTotalPagesForDay = (date: Date) => {
    const dayJobs = getJobsForDay(date);
    return dayJobs.reduce((sum, job) => sum + job.publish_count, 0);
  };

  const days = getDaysToShow();
  const today = new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>发布日历</CardTitle>
            <CardDescription>直观查看周度和月度发布计划</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {viewMode === "week"
                ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MM月dd日", { locale: zhCN })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MM月dd日", { locale: zhCN })}`
                : format(currentDate, "yyyy年MM月", { locale: zhCN })}
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "week" | "month")}>
          <TabsList className="mb-4">
            <TabsTrigger value="week">周视图</TabsTrigger>
            <TabsTrigger value="month">月视图</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-0">
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayJobs = getJobsForDay(day);
                const totalPages = getTotalPagesForDay(day);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border rounded-lg p-3 min-h-[150px] ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm mb-2">
                      {format(day, "EEE", { locale: zhCN })}
                      <div className="text-lg">{format(day, "dd")}</div>
                      {totalPages > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          {totalPages}篇
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayJobs.map((job) => (
                        <div
                          key={job.id}
                          className="text-xs bg-muted/50 rounded p-1.5 border-l-2 border-primary"
                        >
                          <div className="font-medium truncate">{job.schedule_time}</div>
                          <div className="text-muted-foreground truncate">
                            {job.categories?.name || "全类目"}
                          </div>
                          <div className="text-muted-foreground">
                            {job.publish_count}篇
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="month" className="mt-0">
            <div className="grid grid-cols-7 gap-1">
              {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                <div key={day} className="text-center text-sm font-semibold p-2">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const totalPages = getTotalPagesForDay(day);
                const isToday = isSameDay(day, today);

                return (
                  <div
                    key={day.toISOString()}
                    className={`border rounded p-2 min-h-[80px] ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="text-sm font-semibold">{format(day, "dd")}</div>
                    {totalPages > 0 && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {totalPages}篇
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};