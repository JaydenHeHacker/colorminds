import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Play, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const BatchSchedulePublishing = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [weeksCount, setWeeksCount] = useState<string>("1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);

  const handleGenerateSchedule = async () => {
    if (!startDate) {
      toast.error("请选择开始日期");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-publishing-schedule', {
        body: {
          startDate: startDate.toISOString(),
          weeksCount: parseInt(weeksCount),
        },
      });

      if (error) throw error;

      setGeneratedSchedule(data.scheduleItems);
      toast.success(`成功生成 ${data.totalScheduled} 个发布计划`);
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast.error('生成发布计划失败: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySchedule = async () => {
    if (generatedSchedule.length === 0) {
      toast.error("请先生成发布计划");
      return;
    }

    setIsScheduling(true);
    try {
      const scheduleItems = generatedSchedule.map(item => ({
        pageId: item.pageId,
        scheduledTime: item.scheduledTime,
      }));

      const { data, error } = await supabase.functions.invoke('batch-schedule-publishing', {
        body: { scheduleItems },
      });

      if (error) throw error;

      toast.success(`成功设置 ${data.scheduled} 个页面的定时发布`);
      setGeneratedSchedule([]);
    } catch (error: any) {
      console.error('Error applying schedule:', error);
      toast.error('应用发布计划失败: ' + error.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleExportSchedule = () => {
    const csv = [
      ['Week', 'Day', 'Time', 'Title', 'Category', 'Difficulty', 'Scheduled Time'],
      ...generatedSchedule.map(item => [
        item.week,
        item.day,
        item.time,
        item.title,
        item.category,
        item.difficulty,
        format(new Date(item.scheduledTime), 'yyyy-MM-dd HH:mm:ss'),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publishing-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('发布计划已导出');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量设置定时发布</CardTitle>
        <CardDescription>
          根据发布计划自动设置草稿的定时发布时间
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">开始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "选择开始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">周数</label>
            <Select value={weeksCount} onValueChange={setWeeksCount}>
              <SelectTrigger>
                <SelectValue placeholder="选择周数" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 8, 12].map((weeks) => (
                  <SelectItem key={weeks} value={weeks.toString()}>
                    {weeks} 周
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateSchedule}
            disabled={isGenerating || !startDate}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            {isGenerating ? "生成中..." : "生成发布计划"}
          </Button>

          {generatedSchedule.length > 0 && (
            <>
              <Button
                onClick={handleExportSchedule}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                导出
              </Button>
              <Button
                onClick={handleApplySchedule}
                disabled={isScheduling}
                variant="default"
              >
                {isScheduling ? "应用中..." : "应用计划"}
              </Button>
            </>
          )}
        </div>

        {generatedSchedule.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">
              预览发布计划 ({generatedSchedule.length} 个页面)
            </h3>
            <div className="border rounded-lg max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">周</th>
                    <th className="p-2 text-left">日</th>
                    <th className="p-2 text-left">时间</th>
                    <th className="p-2 text-left">类别</th>
                    <th className="p-2 text-left">难度</th>
                    <th className="p-2 text-left">标题</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedSchedule.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">W{item.week}</td>
                      <td className="p-2">D{item.day}</td>
                      <td className="p-2">{item.time}</td>
                      <td className="p-2 capitalize">{item.category}</td>
                      <td className="p-2">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs",
                          item.difficulty === 'easy' && "bg-green-100 text-green-800",
                          item.difficulty === 'medium' && "bg-yellow-100 text-yellow-800",
                          item.difficulty === 'hard' && "bg-red-100 text-red-800"
                        )}>
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="p-2 truncate max-w-xs">{item.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
