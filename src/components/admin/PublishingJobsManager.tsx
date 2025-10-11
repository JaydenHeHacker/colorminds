import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Play, Pause, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PublishingJobExecutions } from "./PublishingJobExecutions";
import { PublishingCalendar } from "./PublishingCalendar";

interface Category {
  id: string;
  name: string;
}

interface PublishingJob {
  id: string;
  name: string;
  is_recurring: boolean;
  category_id: string | null;
  publish_count: number;
  schedule_time: string;
  schedule_days: number[];
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  start_date?: string | null;
  end_date?: string | null;
  categories?: { name: string };
}

const WEEKDAYS = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 0, label: "周日" }
];

const getWeekdayLabels = (days: number[]) => {
  if (!days || days.length === 0) return "-";
  if (days.length === 7) return "每天";
  return days
    .sort((a, b) => a - b)
    .map(day => WEEKDAYS.find(wd => wd.value === day)?.label || "")
    .join("、");
};

export const PublishingJobsManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingJob, setEditingJob] = useState<PublishingJob | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    is_recurring: false,
    category_id: "",
    publish_count: 1,
    schedule_time: "09:00",
    schedule_days: [] as number[],
    start_date: "",
    end_date: ""
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    is_recurring: false,
    category_id: "",
    publish_count: 1,
    schedule_time: "09:00",
    schedule_days: [] as number[],
    start_date: "",
    end_date: ""
  });

  useEffect(() => {
    loadCategories();
    loadJobs();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      toast({ title: "加载类目失败", description: error.message, variant: "destructive" });
      return;
    }

    setCategories(data || []);
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "加载任务失败", description: error.message, variant: "destructive" });
      return;
    }

    setJobs(data || []);
  };

  const handleCreateJob = async () => {
    if (!formData.name || !formData.category_id) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    if (formData.is_recurring && formData.schedule_days.length === 0) {
      toast({ title: "循环任务需要选择执行日期", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("publishing_jobs").insert({
      ...formData,
      next_run_at: calculateNextRun(
        formData.schedule_time, 
        formData.schedule_days, 
        formData.is_recurring,
        formData.start_date
      )
    });

    setIsLoading(false);

    if (error) {
      toast({ title: "创建任务失败", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "任务创建成功" });
    setFormData({
      name: "",
      is_recurring: false,
      category_id: "",
      publish_count: 1,
      schedule_time: "09:00",
      schedule_days: [],
      start_date: "",
      end_date: ""
    });
    setIsCreating(false);
    loadJobs();
  };

  const calculateNextRun = (
    time: string, 
    days: number[], 
    isRecurring: boolean, 
    startDate?: string | null
  ): string | null => {
    if (!isRecurring || !days || days.length === 0) return null;

    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    
    // Use start date if provided and it's in the future
    const searchStart = startDate && new Date(startDate) > now 
      ? new Date(startDate) 
      : now;
    
    // Search for next occurrence within 14 days
    for (let i = 0; i < 14; i++) {
      const testDate = new Date(searchStart);
      testDate.setDate(testDate.getDate() + i);
      testDate.setHours(hours, minutes, 0, 0);
      
      if (days.includes(testDate.getDay()) && testDate > now) {
        return testDate.toISOString();
      }
    }
    
    return null;
  };

  const handleToggleActive = async (jobId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("publishing_jobs")
      .update({ is_active: !currentActive })
      .eq("id", jobId);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: currentActive ? "任务已暂停" : "任务已激活" });
    loadJobs();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("确定要删除这个任务吗？")) return;

    const { error } = await supabase
      .from("publishing_jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "任务已删除" });
    loadJobs();
  };

  const handleEditJob = (job: PublishingJob) => {
    setEditingJob(job);
    setEditFormData({
      name: job.name,
      is_recurring: job.is_recurring,
      category_id: job.category_id || "",
      publish_count: job.publish_count,
      schedule_time: job.schedule_time.substring(0, 5),
      schedule_days: job.schedule_days,
      start_date: job.start_date || "",
      end_date: job.end_date || ""
    });
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from("publishing_jobs")
      .update({
        name: editFormData.name,
        is_recurring: editFormData.is_recurring,
        category_id: editFormData.category_id || null,
        publish_count: editFormData.publish_count,
        schedule_time: editFormData.schedule_time,
        schedule_days: editFormData.schedule_days,
        start_date: editFormData.start_date || null,
        end_date: editFormData.end_date || null,
        next_run_at: calculateNextRun(
          editFormData.schedule_time,
          editFormData.schedule_days,
          editFormData.is_recurring,
          editFormData.start_date
        )
      })
      .eq("id", editingJob.id);

    setIsLoading(false);

    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "任务已更新" });
    setEditingJob(null);
    loadJobs();
  };

  const toggleEditDay = (day: number) => {
    setEditFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day]
    }));
  };

  const handleFixAllNextRuns = async () => {
    if (!confirm("确定要重新计算所有循环任务的下次执行时间吗？")) return;
    
    setIsLoading(true);
    
    // Get all recurring jobs
    const { data: recurringJobs, error: fetchError } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("is_recurring", true);
    
    if (fetchError) {
      toast({ title: "获取任务失败", description: fetchError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    // Update each job's next_run_at
    const updates = recurringJobs.map(job => {
      const nextRun = calculateNextRun(
        job.schedule_time,
        job.schedule_days,
        job.is_recurring,
        job.start_date
      );
      
      return supabase
        .from("publishing_jobs")
        .update({ next_run_at: nextRun })
        .eq("id", job.id);
    });
    
    await Promise.all(updates);
    
    setIsLoading(false);
    toast({ title: "已重新计算所有任务的执行时间" });
    loadJobs();
  };

  const handleExecuteNow = async (jobId: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.functions.invoke("execute-publishing-job", {
      body: { jobId }
    });

    setIsLoading(false);

    if (error) {
      toast({ title: "执行失败", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "任务执行成功" });
    loadJobs();
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day]
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="jobs" className="w-full">
        <TabsList>
          <TabsTrigger value="jobs">任务管理</TabsTrigger>
          <TabsTrigger value="calendar">发布日历</TabsTrigger>
          <TabsTrigger value="history">执行历史</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          <Card>
        <CardHeader>
          <CardTitle>定时发布任务管理</CardTitle>
          <CardDescription>创建和管理自动发布任务，系统会根据设置自动发布草稿内容</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4 gap-2">
            <Button 
              variant="outline" 
              onClick={handleFixAllNextRuns}
              disabled={isLoading}
            >
              修复执行时间
            </Button>
            <Button onClick={() => setIsCreating(!isCreating)}>
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? "取消" : "创建新任务"}
            </Button>
          </div>

          {isCreating && (
            <Card className="mb-6">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="name">任务名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：每日动物主题发布"
                  />
                </div>

                <div>
                  <Label htmlFor="category">选择类目</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择一个类目" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="count">每次发布数量</Label>
                  <Input
                    id="count"
                    type="number"
                    min="1"
                    value={formData.publish_count}
                    onChange={(e) => setFormData({ ...formData, publish_count: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="time">发布时间</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.schedule_time}
                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked as boolean })}
                  />
                  <Label htmlFor="recurring">循环执行（每周重复）</Label>
                </div>

                {formData.is_recurring && (
                  <>
                    <div>
                      <Label>选择执行日期</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {WEEKDAYS.map(day => (
                          <Badge
                            key={day.value}
                            variant={formData.schedule_days.includes(day.value) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="end_date">结束日期（可选）</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        placeholder="不设置则永久执行"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        留空则任务会一直循环执行
                      </p>
                    </div>
                  </>
                )}

                <Button onClick={handleCreateJob} disabled={isLoading} className="w-full">
                  创建任务
                </Button>
              </CardContent>
            </Card>
          )}

          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>任务名称</TableHead>
              <TableHead>类目</TableHead>
              <TableHead>发布数量</TableHead>
              <TableHead>执行时间</TableHead>
              <TableHead>执行日期</TableHead>
              <TableHead>开始日期</TableHead>
              <TableHead>结束日期</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>下次执行</TableHead>
              <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => (
                <TableRow key={job.id}>
                  <TableCell>{job.name}</TableCell>
                  <TableCell>{job.categories?.name || "所有类目"}</TableCell>
                  <TableCell>{job.publish_count} 篇</TableCell>
                  <TableCell className="font-mono font-semibold text-primary">
                    {job.schedule_time.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getWeekdayLabels(job.schedule_days)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.start_date ? (
                      <span className="text-sm">
                        {new Date(job.start_date).toLocaleDateString("zh-CN")}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">立即开始</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.end_date ? (
                      <span className="text-sm">
                        {new Date(job.end_date).toLocaleDateString("zh-CN")}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">永久</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.is_recurring ? "default" : "secondary"}>
                      {job.is_recurring ? "循环" : "一次性"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.is_active ? "default" : "outline"}>
                      {job.is_active ? "激活" : "暂停"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {job.next_run_at ? new Date(job.next_run_at).toLocaleString("zh-CN") : "-"}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(job.id, job.is_active)}
                            >
                              {job.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{job.is_active ? "暂停任务" : "激活任务"}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExecuteNow(job.id)}
                              disabled={isLoading}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>立即执行一次</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditJob(job)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>编辑任务</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>删除任务</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <PublishingCalendar />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PublishingJobExecutions />
        </TabsContent>
      </Tabs>
      
      {/* 编辑任务对话框 */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑任务</DialogTitle>
            <DialogDescription>修改发布任务的设置</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">任务名称</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="例如：圣诞节主题内容发布"
              />
            </div>

            <div>
              <Label htmlFor="edit-category">类目（可选）</Label>
              <Select
                value={editFormData.category_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, category_id: value })}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="全部类目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类目</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-count">每次发布数量</Label>
                <Input
                  id="edit-count"
                  type="number"
                  min="1"
                  value={editFormData.publish_count}
                  onChange={(e) => setEditFormData({ ...editFormData, publish_count: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="edit-time">发布时间</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editFormData.schedule_time}
                  onChange={(e) => setEditFormData({ ...editFormData, schedule_time: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-recurring"
                checked={editFormData.is_recurring}
                onCheckedChange={(checked) => 
                  setEditFormData({ ...editFormData, is_recurring: checked as boolean })
                }
              />
              <Label htmlFor="edit-recurring">循环执行</Label>
            </div>

            {editFormData.is_recurring && (
              <>
                <div>
                  <Label>执行日期</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-day-${day.value}`}
                          checked={editFormData.schedule_days.includes(day.value)}
                          onCheckedChange={() => toggleEditDay(day.value)}
                        />
                        <Label htmlFor={`edit-day-${day.value}`} className="text-sm">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-date">开始日期（可选）</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={editFormData.start_date}
                      onChange={(e) => setEditFormData({ ...editFormData, start_date: e.target.value })}
                      placeholder="不设置则立即开始"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-end-date">结束日期（可选）</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={editFormData.end_date}
                      onChange={(e) => setEditFormData({ ...editFormData, end_date: e.target.value })}
                      placeholder="不设置则永久执行"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setEditingJob(null)}>
                取消
              </Button>
              <Button onClick={handleUpdateJob} disabled={isLoading}>
                保存更改
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};