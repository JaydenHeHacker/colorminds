import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface JobExecution {
  id: string;
  job_id: string;
  executed_at: string;
  status: string;
  pages_published: number;
  pages_attempted: number;
  error_message: string | null;
  published_page_ids: string[] | null;
  publishing_jobs?: {
    name: string;
  };
}

interface PublishedPage {
  id: string;
  title: string;
  slug: string;
}

export const PublishingJobExecutions = () => {
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [publishedPages, setPublishedPages] = useState<{ [key: string]: PublishedPage[] }>({});
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

  const toggleRow = async (executionId: string, pageIds: string[] | null) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(executionId)) {
      newExpandedRows.delete(executionId);
      setExpandedRows(newExpandedRows);
    } else {
      newExpandedRows.add(executionId);
      setExpandedRows(newExpandedRows);
      
      // Load page details if not already loaded
      if (pageIds && pageIds.length > 0 && !publishedPages[executionId]) {
        const { data, error } = await supabase
          .from("coloring_pages")
          .select("id, title, slug")
          .in("id", pageIds);
        
        if (!error && data) {
          setPublishedPages(prev => ({ ...prev, [executionId]: data }));
        }
      }
    }
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
              <TableHead className="w-12"></TableHead>
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
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暂无执行记录
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => {
                const isExpanded = expandedRows.has(execution.id);
                const hasPages = execution.published_page_ids && execution.published_page_ids.length > 0;
                
                return (
                  <>
                    <TableRow key={execution.id}>
                      <TableCell>
                        {hasPages && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(execution.id, execution.published_page_ids)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
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
                    {isExpanded && hasPages && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <div className="font-semibold text-sm mb-2">已发布的页面：</div>
                            <div className="grid gap-2">
                              {publishedPages[execution.id]?.map((page) => (
                                <div
                                  key={page.id}
                                  className="flex items-center gap-2 text-sm bg-background p-2 rounded border"
                                >
                                  <Badge variant="outline" className="shrink-0">
                                    {page.id.slice(0, 8)}
                                  </Badge>
                                  <a
                                    href={`/coloring/${page.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline flex-1 truncate"
                                  >
                                    {page.title}
                                  </a>
                                </div>
                              )) || (
                                <div className="text-sm text-muted-foreground">加载中...</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};