import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface JobExecution {
  id: string;
  job_id: string;
  executed_at: string;
  status: string;
  pages_published: number;
  pages_attempted: number;
  error_message: string | null;
  publishing_jobs?: {
    name: string;
  };
}

export const PublishingJobExecutions = () => {
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadExecutions();
  }, [filterStatus]);

  const loadExecutions = async () => {
    setIsLoading(true);

    let query = supabase
      .from("publishing_job_executions")
      .select("*, publishing_jobs(name)")
      .order("executed_at", { ascending: false })
      .limit(100);

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    setIsLoading(false);

    if (error) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
      return;
    }

    setExecutions(data || []);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "partial":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "destructive" | "secondary" } = {
      success: "default",
      failed: "destructive",
      partial: "secondary",
    };
    const labels: { [key: string]: string } = {
      success: "成功",
      failed: "失败",
      partial: "部分成功",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>任务执行历史</CardTitle>
            <CardDescription>查看所有定时发布任务的执行记录</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="partial">部分成功</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadExecutions} disabled={isLoading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务名称</TableHead>
              <TableHead>执行时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发布数量</TableHead>
              <TableHead>错误信息</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  暂无执行记录
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">
                    {execution.publishing_jobs?.name || "未知任务"}
                  </TableCell>
                  <TableCell>
                    {new Date(execution.executed_at).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      {getStatusBadge(execution.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {execution.pages_published} / {execution.pages_attempted}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {execution.error_message || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};