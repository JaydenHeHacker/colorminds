import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, UserCheck, Calendar, Heart, Coins, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<string>("");
  // 获取用户列表及其角色和积分
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      // 获取用户角色
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw rolesError;

      // 获取用户积分
      const { data: userCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("*");
      
      if (creditsError) throw creditsError;

      // 合并用户数据、角色和积分
      const usersWithRoles = profiles.map(profile => {
        const userRoles = roles.filter(role => role.user_id === profile.id);
        const credits = userCredits.find(c => c.user_id === profile.id);
        return {
          ...profile,
          roles: userRoles.map(r => r.role),
          credits: credits?.balance || 0
        };
      });

      return usersWithRoles;
    },
  });

  // 获取用户活动统计
  const { data: userStats, isLoading: loadingStats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      // 获取收藏数统计
      const { data: favorites, error: favError } = await supabase
        .from("favorites")
        .select("user_id");
      
      if (favError) throw favError;

      // 按用户分组统计收藏数
      const favoritesByUser = favorites.reduce((acc: Record<string, number>, fav) => {
        acc[fav.user_id] = (acc[fav.user_id] || 0) + 1;
        return acc;
      }, {});

      // 计算总积分
      const totalCredits = users?.reduce((sum, user) => sum + (user.credits || 0), 0) || 0;
      const avgCredits = users?.length ? Math.round(totalCredits / users.length) : 0;

      return {
        totalUsers: users?.length || 0,
        adminUsers: users?.filter(u => u.roles?.includes('admin')).length || 0,
        activeUsers: users?.filter(u => favoritesByUser[u.id] > 0).length || 0,
        totalCredits,
        avgCredits,
        favoritesByUser
      };
    },
    enabled: !!users,
  });

  // 更新用户积分
  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, amount, operation }: { userId: string; amount: number; operation: 'add' | 'subtract' }) => {
      // 获取当前积分
      const { data: currentCredits, error: fetchError } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = currentCredits?.balance || 0;
      const newBalance = operation === 'add' 
        ? currentBalance + amount 
        : Math.max(0, currentBalance - amount); // 确保不会变成负数

      // 更新积分
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return { newBalance, operation, amount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success(`积分${data.operation === 'add' ? '增加' : '减少'}成功！新余额: ${data.newBalance}`);
      setEditingUser(null);
      setCreditAmount("");
    },
    onError: (error: Error) => {
      toast.error("操作失败：" + error.message);
    },
  });

  const handleUpdateCredits = (operation: 'add' | 'subtract') => {
    const amount = parseInt(creditAmount);
    if (!amount || amount <= 0) {
      toast.error("请输入有效的积分数量");
      return;
    }

    updateCreditsMutation.mutate({
      userId: editingUser.id,
      amount,
      operation,
    });
  };

  if (loadingUsers || loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              注册用户总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.adminUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              管理员账户数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              有收藏记录的用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总积分</CardTitle>
            <Coins className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalCredits || 0}</div>
            <p className="text-xs text-muted-foreground">
              所有用户积分总和
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均积分</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.avgCredits || 0}</div>
            <p className="text-xs text-muted-foreground">
              每用户平均积分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>所有注册用户及其活动信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {user.id?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.email || `用户 ID: ${user.id?.substring(0, 8)}...`}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant={role === 'admin' ? 'default' : 'secondary'}
                              >
                                {role === 'admin' ? '管理员' : role}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">普通用户</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {user.created_at ? format(new Date(user.created_at), 'PPP', { locale: zhCN }) : '未知'}
                    </div>
                    <div className="flex items-center gap-4">
                      {userStats?.favoritesByUser[user.id] && (
                        <div className="flex items-center gap-1 text-sm">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span>{userStats.favoritesByUser[user.id]} 个收藏</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span>{user.credits || 0} 积分</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setCreditAmount("");
                          }}
                        >
                          <Coins className="h-3 w-3 mr-1" />
                          调整
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无用户数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 积分调整对话框 */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整用户积分</DialogTitle>
            <DialogDescription>
              为用户 {editingUser?.email || editingUser?.id?.substring(0, 8)} 调整积分
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">当前积分余额</span>
              <span className="text-2xl font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                {editingUser?.credits || 0}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">积分数量</label>
              <Input
                type="number"
                placeholder="输入积分数量"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleUpdateCredits('subtract')}
              disabled={updateCreditsMutation.isPending}
            >
              <Minus className="h-4 w-4 mr-1" />
              减少积分
            </Button>
            <Button
              onClick={() => handleUpdateCredits('add')}
              disabled={updateCreditsMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              增加积分
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
