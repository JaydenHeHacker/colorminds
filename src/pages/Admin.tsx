import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, LogOut, Settings, BarChart3, FolderTree, TrendingUp, Users, CalendarClock, Zap, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ManageColoringPages from "@/components/admin/ManageColoringPages";
import ManageCategories from "@/components/admin/ManageCategories";
import DashboardStats from "@/components/admin/DashboardStats";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import UserManagement from "@/components/admin/UserManagement";
import PublishingSchedule from "@/components/admin/PublishingSchedule";
import { PublishingJobsManager } from "@/components/admin/PublishingJobsManager";
import { AutoGenerateControl } from "@/components/admin/AutoGenerateControl";
import ManageArtwork from "@/components/admin/ManageArtwork";
import ManageContactMessages from "@/components/admin/ManageContactMessages";
import { SocialMediaManager } from "@/components/admin/SocialMediaManager";

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setCheckingRole(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data && !error);
      setCheckingRole(false);
    };

    checkAdminRole();
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("登录成功！");
    } catch (error: any) {
      toast.error("登录失败：" + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("已退出登录");
  };

  if (isLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              仅管理员可访问，请联系管理员获取账号
            </p>
          </form>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">访问受限</h1>
          <p className="text-muted-foreground mb-6">
            您没有管理员权限，无法访问此页面。
          </p>
          <div className="space-y-2">
            <Button onClick={handleLogout} className="w-full">
              退出登录
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              返回首页
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">管理后台</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-4 sm:py-8 px-2 sm:px-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-10 mb-4 sm:mb-8 h-auto">
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">数据概览</span>
              <span className="sm:hidden">概览</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">数据分析</span>
              <span className="sm:hidden">分析</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">用户管理</span>
              <span className="sm:hidden">用户</span>
            </TabsTrigger>
            <TabsTrigger value="artwork" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">作品审核</span>
              <span className="sm:hidden">审核</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <FolderTree className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">管理分类</span>
              <span className="sm:hidden">分类</span>
            </TabsTrigger>
            <TabsTrigger value="publishing" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <CalendarClock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">发布计划</span>
              <span className="sm:hidden">发布</span>
            </TabsTrigger>
            <TabsTrigger value="auto-generate" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">自动生成</span>
              <span className="sm:hidden">自动</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">管理页面</span>
              <span className="sm:hidden">页面</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">联系消息</span>
              <span className="sm:hidden">消息</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">社交媒体</span>
              <span className="sm:hidden">社交</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="categories">
            <ManageCategories />
          </TabsContent>

          <TabsContent value="publishing">
            <PublishingJobsManager />
          </TabsContent>

          <TabsContent value="auto-generate">
            <AutoGenerateControl />
          </TabsContent>

          <TabsContent value="manage">
            <ManageColoringPages />
          </TabsContent>

          <TabsContent value="artwork">
            <ManageArtwork />
          </TabsContent>

          <TabsContent value="contact">
            <ManageContactMessages />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}