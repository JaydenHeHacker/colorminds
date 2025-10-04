import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Flame, Star, Medal } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface ColoringCalendarProps {
  userId: string;
}

const ACHIEVEMENT_CONFIG = {
  first_download: { icon: Star, label: "首次下载", color: "text-yellow-500" },
  ten_downloads: { icon: Trophy, label: "下载达人", color: "text-blue-500" },
  fifty_downloads: { icon: Medal, label: "涂色专家", color: "text-purple-500" },
  hundred_downloads: { icon: Trophy, label: "百图大师", color: "text-orange-500" },
  three_day_streak: { icon: Flame, label: "3天连击", color: "text-red-500" },
  seven_day_streak: { icon: Flame, label: "7天连击", color: "text-red-600" },
  thirty_day_streak: { icon: Flame, label: "30天连击", color: "text-red-700" },
};

export const ColoringCalendar = ({ userId }: ColoringCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 获取当月历史记录
  const { data: history } = useQuery({
    queryKey: ['coloring-history', userId, currentMonth.getFullYear(), currentMonth.getMonth()],
    enabled: !!userId,
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('coloring_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // 获取用户成就
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 统计信息
  const { data: stats } = useQuery({
    queryKey: ['coloring-stats', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_history')
        .select('action_type, created_at')
        .eq('user_id', userId);

      if (error) throw error;

      const downloads = data?.filter(h => h.action_type === 'download').length || 0;
      const prints = data?.filter(h => h.action_type === 'print').length || 0;

      // 计算连续天数
      const uniqueDays = Array.from(
        new Set(data?.map(h => format(new Date(h.created_at), 'yyyy-MM-dd')) || [])
      ).sort().reverse();

      let streak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      for (let i = 0; i < uniqueDays.length; i++) {
        const expectedDate = format(
          new Date(new Date(today).getTime() - i * 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        );
        if (uniqueDays[i] === expectedDate) {
          streak++;
        } else {
          break;
        }
      }

      return { downloads, prints, streak };
    },
  });

  // 生成日历网格
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 检查某天是否有活动
  const hasActivity = (day: Date) => {
    return history?.some(h => isSameDay(new Date(h.created_at), day));
  };

  // 获取某天活动数量
  const getDayActivityCount = (day: Date) => {
    return history?.filter(h => isSameDay(new Date(h.created_at), day)).length || 0;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总下载</p>
              <p className="text-2xl font-bold">{stats?.downloads || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总打印</p>
              <p className="text-2xl font-bold">{stats?.prints || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Flame className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">连续天数</p>
              <p className="text-2xl font-bold">{stats?.streak || 0}天</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 日历视图 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            涂色日历
          </h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              上月
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
            >
              本月
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              下月
            </Button>
          </div>
        </div>

        <div className="mb-4 text-center">
          <p className="text-lg font-medium">
            {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
          </p>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 填充月初空白 */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {/* 日期 */}
          {days.map(day => {
            const active = hasActivity(day);
            const count = getDayActivityCount(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all
                  ${active ? 'bg-primary/10 border-primary hover:bg-primary/20' : 'border-border hover:border-primary/50'}
                  ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                  cursor-pointer group
                `}
              >
                <span className={`text-sm font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {active && (
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-primary bg-primary/10" />
            <span>有涂色活动</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-border" />
            <span>无活动</span>
          </div>
        </div>
      </Card>

      {/* 成就展示 */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          我的成就
        </h3>

        {achievements && achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const config = ACHIEVEMENT_CONFIG[achievement.achievement_name as keyof typeof ACHIEVEMENT_CONFIG];
              if (!config) return null;

              const Icon = config.icon;

              return (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-gradient-to-b from-background to-muted/20 hover:shadow-md transition-shadow"
                >
                  <div className={`p-3 rounded-full bg-muted ${config.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-center">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(achievement.unlocked_at), 'MM/dd', { locale: zhCN })}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>开始涂色旅程，解锁成就徽章！</p>
          </div>
        )}
      </Card>
    </div>
  );
};