import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Calendar, Heart } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function UserManagement() {
  // 获取用户列表及其角色
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

      // 合并用户数据和角色
      const usersWithRoles = profiles.map(profile => {
        const userRoles = roles.filter(role => role.user_id === profile.id);
        return {
          ...profile,
          roles: userRoles.map(r => r.role)
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
      const favoritesByUser = favorites.reduce((acc: any, fav) => {
        acc[fav.user_id] = (acc[fav.user_id] || 0) + 1;
        return acc;
      }, {});

      return {
        totalUsers: users?.length || 0,
        adminUsers: users?.filter(u => u.roles?.includes('admin')).length || 0,
        activeUsers: users?.filter(u => favoritesByUser[u.id] > 0).length || 0,
        favoritesByUser
      };
    },
    enabled: !!users,
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    {userStats?.favoritesByUser[user.id] && (
                      <div className="flex items-center gap-1 text-sm">
                        <Heart className="h-4 w-4 text-pink-500" />
                        <span>{userStats.favoritesByUser[user.id]} 个收藏</span>
                      </div>
                    )}
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
    </div>
  );
}
