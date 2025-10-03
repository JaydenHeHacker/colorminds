import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Zap, TrendingUp } from "lucide-react";

export function AutoGenerateControl() {
  const queryClient = useQueryClient();

  // 获取自动生成开关状态
  const { data: settings, isLoading } = useQuery({
    queryKey: ['auto-generate-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'auto_generate_enabled')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // 获取今日生成统计
  const { data: todayStats } = useQuery({
    queryKey: ['generation-stats-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('generation_stats')
        .select('*')
        .gte('generated_at', today.toISOString());
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // 每30秒刷新一次
  });

  // 切换自动生成开关
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('key', 'auto_generate_enabled');
      
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['auto-generate-settings'] });
      toast.success(enabled ? "自动生成已启动 🚀" : "自动生成已停止");
    },
    onError: (error) => {
      toast.error("操作失败：" + error.message);
    }
  });

  // 手动触发一次生成
  const generateNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('auto-generate-drafts', {
        body: {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['generation-stats-today'] });
      toast.success(`成功生成 ${data.pages?.length || 0} 个草稿页面！`);
    },
    onError: (error) => {
      toast.error("生成失败：" + error.message);
    }
  });

  const isEnabled = settings?.value === 'true';
  const totalToday = todayStats?.reduce((sum, stat) => sum + stat.pages_count, 0) || 0;
  const successRate = todayStats?.length 
    ? (todayStats.filter(s => s.success).length / todayStats.length * 100).toFixed(1)
    : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          自动生成草稿
        </CardTitle>
        <CardDescription>
          自动批量生成涂色页草稿，包括单图和系列图，覆盖所有难度级别
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 开关控制 */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="font-medium">启用自动生成</p>
            <p className="text-sm text-muted-foreground">
              每3分钟自动生成 {isEnabled ? '1-2' : '0'} 个草稿
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            disabled={isLoading || toggleMutation.isPending}
          />
        </div>

        {/* 今日统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-card border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              今日生成
            </div>
            <p className="text-2xl font-bold">{totalToday}</p>
            <p className="text-xs text-muted-foreground">个草稿页面</p>
          </div>
          
          <div className="p-4 bg-card border rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">成功率</div>
            <p className="text-2xl font-bold">{successRate}%</p>
            <p className="text-xs text-muted-foreground">
              {todayStats?.filter(s => s.success).length || 0}/{todayStats?.length || 0} 次成功
            </p>
          </div>
        </div>

        {/* 手动触发 */}
        <Button
          onClick={() => generateNowMutation.mutate()}
          disabled={generateNowMutation.isPending}
          className="w-full"
          variant="outline"
        >
          {generateNowMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              立即生成一次
            </>
          )}
        </Button>

        {/* 说明 */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded">
          <p>• 每3分钟自动运行一次生成任务</p>
          <p>• 每次生成会随机选择类目和难度</p>
          <p>• 40% 概率生成单图，60% 概率生成 8 张系列图</p>
          <p>• 所有内容保存为草稿状态，需手动发布</p>
          <p>• 利用 Gemini API 免费期间批量生成</p>
        </div>
      </CardContent>
    </Card>
  );
}
