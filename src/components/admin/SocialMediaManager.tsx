import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SocialConnection {
  id: string;
  platform: string;
  username: string | null;
  connected_at: string;
  is_active: boolean;
}

interface SocialPost {
  id: string;
  platform: string;
  title: string;
  description: string | null;
  post_url: string | null;
  image_url: string | null;
  status: string;
  error_message: string | null;
  subreddit: string | null;
  ai_generated: boolean;
  engagement_score: number;
  reply_count: number;
  posted_at: string | null;
  created_at: string;
}

interface RedditAutoConfig {
  id: string;
  is_enabled: boolean;
  posts_per_day: number;
  hours_between_posts: number;
  max_replies_per_post: number;
  minutes_between_replies: number;
  allowed_subreddits: string[];
  last_post_at: string | null;
}

export function SocialMediaManager() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoPosting, setAutoPosting] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  
  // Reddit auto-post config
  const [autoConfig, setAutoConfig] = useState<RedditAutoConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  
  // Form states
  const [platform, setPlatform] = useState<'reddit' | 'pinterest'>('reddit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [subreddit, setSubreddit] = useState('');
  const [boardId, setBoardId] = useState('');

  useEffect(() => {
    loadConnections();
    loadPosts();
    loadAutoConfig();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    // Check if we're returning from Reddit OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    console.log('OAuth callback check:', { 
      code: code ? 'present' : 'missing', 
      state: state ? 'present' : 'missing',
      url: window.location.href 
    });
    
    if (code && state) {
      const savedState = sessionStorage.getItem('reddit_oauth_state');
      
      console.log('State validation:', { 
        receivedState: state, 
        savedState, 
        matches: state === savedState 
      });
      
      if (state === savedState) {
        sessionStorage.removeItem('reddit_oauth_state');
        
        try {
          console.log('Starting Reddit connection verification...');
          
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Not authenticated');
          
          const redirectUri = `${window.location.origin}${window.location.pathname}`;
          
          console.log('Calling verify-reddit-connection with redirect_uri:', redirectUri);
          
          const { data, error } = await supabase.functions.invoke('verify-reddit-connection', {
            body: { code, redirect_uri: redirectUri },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          
          console.log('Verification response:', { data, error });
          
          if (error || !data?.success) {
            throw new Error(data?.error || 'Reddit 连接失败');
          }
          
          toast({
            title: "连接成功",
            description: `Reddit 账号 u/${data.username} 已连接`,
          });
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          loadConnections();
        } catch (error) {
          console.error('Error completing Reddit OAuth:', error);
          toast({
            title: "连接失败",
            description: error instanceof Error ? error.message : "请重试",
            variant: "destructive",
          });
        }
      } else {
        console.error('State mismatch - possible CSRF attack');
        toast({
          title: "安全验证失败",
          description: "请重新尝试连接",
          variant: "destructive",
        });
      }
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .select('*')
        .order('connected_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
      
      toast({
        title: "刷新成功",
        description: `已加载 ${data?.length || 0} 条记录`,
      });
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: "刷新失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAutoConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reddit_auto_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAutoConfig(data);
      } else {
        // 创建默认配置
        const { data: newConfig, error: insertError } = await supabase
          .from('reddit_auto_config')
          .insert({
            user_id: user.id,
            is_enabled: false,
            posts_per_day: 2,
            hours_between_posts: 6,
            max_replies_per_post: 3,
            minutes_between_replies: 30,
            allowed_subreddits: ['test', 'coloring', 'ColoringPages']
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setAutoConfig(newConfig);
      }
    } catch (error) {
      console.error('Error loading auto config:', error);
    }
  };

  const updateAutoConfig = async (updates: Partial<RedditAutoConfig>) => {
    if (!autoConfig) return;

    try {
      setConfigLoading(true);
      const { error } = await supabase
        .from('reddit_auto_config')
        .update(updates)
        .eq('id', autoConfig.id);

      if (error) throw error;

      setAutoConfig({ ...autoConfig, ...updates });
      toast({
        title: "配置已更新",
        description: "自动发布设置已保存",
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const testAutoPost = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('auto-post-reddit', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "测试完成",
        description: data.message || "查看控制台了解详情",
      });

      console.log('Auto-post test result:', data);
      loadPosts();
    } catch (error) {
      console.error('Error testing auto-post:', error);
      toast({
        title: "测试失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPhase2Config = async () => {
    try {
      setConfigLoading(true);
      await updateAutoConfig({
        posts_per_day: 6,
        hours_between_posts: 4,
        allowed_subreddits: ['test', 'coloring', 'ColoringPages', 'crafts']
      });
      toast({
        title: "配置已应用",
        description: "已切换到第二阶段推荐配置：6次/天，4小时间隔",
      });
      
      // 配置成功后自动测试发布一次
      setConfigLoading(false);
      await testAutoPost();
    } catch (error) {
      console.error('Error applying phase 2 config:', error);
      setConfigLoading(false);
    }
  };

  const handleConnect = async (platform: 'reddit' | 'pinterest') => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      if (platform === 'reddit') {
        // Get Reddit OAuth URL from backend
        const redirectUri = `${window.location.origin}${window.location.pathname}`;
        
        console.log('Calling get-reddit-auth-url with redirect_uri:', redirectUri);
        
        const { data, error } = await supabase.functions.invoke('get-reddit-auth-url', {
          body: { redirect_uri: redirectUri },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        console.log('Reddit auth URL response:', { data, error });
        
        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Edge function failed: ${JSON.stringify(error)}`);
        }
        
        if (!data?.authUrl) {
          console.error('No auth URL in response:', data);
          throw new Error(data?.error || 'No auth URL returned from server');
        }
        
        // Store state for verification
        sessionStorage.setItem('reddit_oauth_state', data.state);
        
        // Redirect to Reddit OAuth
        window.location.href = data.authUrl;
        return;
      } else if (platform === 'pinterest') {
        // Verify real Pinterest connection
        const { data, error } = await supabase.functions.invoke('verify-pinterest-connection', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error || !data?.success) {
          throw new Error(data?.error || 'Pinterest 连接失败');
        }

        toast({
          title: "连接成功",
          description: `Pinterest 账号 @${data.username} 已连接，共 ${data.boardsCount} 个 Board`,
        });
        
        loadConnections();
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: "已断开连接",
        description: "社交媒体账号已断开连接",
      });

      loadConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "断开连接失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  const handlePost = async () => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const functionName = platform === 'reddit' ? 'post-to-reddit' : 'post-to-pinterest';
      
      const body = platform === 'reddit' 
        ? {
            subreddit,
            title,
            text: description,
            imageUrl: imageUrl || undefined,
          }
        : {
            boardId,
            title,
            description,
            imageUrl,
          };

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "发布成功",
        description: `内容已成功发布到 ${platform === 'reddit' ? 'Reddit' : 'Pinterest'}`,
      });

      setPostDialogOpen(false);
      resetForm();
      loadPosts();
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "发布失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setSubreddit('');
    setBoardId('');
  };

  const handlePreviewPost = async () => {
    try {
      setIsGeneratingPreview(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('auto-post-to-social', {
        body: { platform: 'pinterest', count: 1, preview: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.preview) {
        setPreviewData(data.preview);
        setPreviewDialogOpen(true);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "预览生成失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleConfirmPost = async () => {
    if (!previewData) return;

    try {
      setAutoPosting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('auto-post-to-social', {
        body: { 
          platform: 'pinterest', 
          count: 1,
          pageId: previewData.pageId,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "发布成功",
        description: `已成功发布到 Pinterest`,
      });

      setPreviewDialogOpen(false);
      setPreviewData(null);
      loadPosts();
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "发布失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setAutoPosting(false);
    }
  };

  const handleAutoPost = async (count: number = 1) => {
    try {
      setAutoPosting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('auto-post-to-social', {
        body: { platform: 'pinterest', count },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "自动发布成功",
        description: `成功发布 ${data.totalPosted} 个帖子${data.totalFailed > 0 ? `，${data.totalFailed} 个失败` : ''}`,
      });

      loadPosts();
    } catch (error) {
      console.error('Error auto-posting:', error);
      toast({
        title: "自动发布失败",
        description: error instanceof Error ? error.message : "请重试",
        variant: "destructive",
      });
    } finally {
      setAutoPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Reddit
            </CardTitle>
            <CardDescription>连接你的 Reddit 账号</CardDescription>
          </CardHeader>
          <CardContent>
            {connections.find(c => c.platform === 'reddit' && c.is_active) ? (
              <div className="space-y-2">
                <Badge variant="secondary">已连接</Badge>
                <div className="text-sm text-muted-foreground">
                  用户名: {connections.find(c => c.platform === 'reddit')?.username || '未知'}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const conn = connections.find(c => c.platform === 'reddit');
                    if (conn) handleDisconnect(conn.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  断开连接
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleConnect('reddit')} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                连接 Reddit
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Pinterest
            </CardTitle>
            <CardDescription>连接你的 Pinterest 账号</CardDescription>
          </CardHeader>
          <CardContent>
            {connections.find(c => c.platform === 'pinterest' && c.is_active) ? (
              <div className="space-y-2">
                <Badge variant="secondary">已连接</Badge>
                <div className="text-sm text-muted-foreground">
                  用户名: {connections.find(c => c.platform === 'pinterest')?.username || '未知'}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    const conn = connections.find(c => c.platform === 'pinterest');
                    if (conn) handleDisconnect(conn.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  断开连接
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleConnect('pinterest')} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                连接 Pinterest
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>智能自动发布</CardTitle>
          <CardDescription>AI 自动生成文案并发布涂色页到 Pinterest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handlePreviewPost}
              disabled={isGeneratingPreview || autoPosting || !connections.find(c => c.platform === 'pinterest' && c.is_active)}
              className="flex-1"
            >
              {isGeneratingPreview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              预览并发布
            </Button>
            <Button 
              onClick={() => handleAutoPost(1)} 
              disabled={autoPosting || !connections.find(c => c.platform === 'pinterest' && c.is_active)}
              variant="secondary"
              className="flex-1"
            >
              {autoPosting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              直接发布 1 个
            </Button>
            <Button 
              onClick={() => handleAutoPost(3)} 
              disabled={autoPosting || !connections.find(c => c.platform === 'pinterest' && c.is_active)}
              variant="outline"
              className="flex-1"
            >
              {autoPosting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              批量发布 3 个
            </Button>
          </div>
          {!connections.find(c => c.platform === 'pinterest' && c.is_active) && (
            <p className="text-sm text-muted-foreground">
              请先连接 Pinterest 账号
            </p>
          )}
          <div className="text-sm text-muted-foreground">
            <p>✨ AI 将自动：</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>从未发布的涂色页中选择</li>
              <li>生成吸引人的标题和描述</li>
              <li>添加相关 hashtags</li>
              <li>发布到您的 Pinterest Board</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reddit 测试</CardTitle>
          <CardDescription>快速测试 Reddit 发布功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={async () => {
              try {
                setLoading(true);
                
                // 获取一个涂色页作为测试
                const { data: coloringPages } = await supabase
                  .from('coloring_pages')
                  .select('id, title, image_url')
                  .eq('status', 'published')
                  .limit(1)
                  .single();
                
                if (!coloringPages) {
                  throw new Error('没有找到可用的涂色页');
                }
                
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error('Not authenticated');
                
                const testData = {
                  subreddit: 'test',
                  title: `Testing coloring page: ${coloringPages.title}`,
                  text: `This is an automated test post from ColorMinds.fun\n\nImage: ${coloringPages.image_url}`,
                  imageUrl: coloringPages.image_url,
                };
                
                console.log('Posting test to r/test:', testData);
                
                const { data, error } = await supabase.functions.invoke('post-to-reddit', {
                  body: testData,
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                });
                
                if (error) throw error;
                
                toast({
                  title: "测试发布成功！",
                  description: `已发布到 r/test，点击下方链接查看`,
                });
                
                console.log('Test post result:', data);
                loadPosts();
              } catch (error) {
                console.error('Error testing Reddit post:', error);
                toast({
                  title: "测试发布失败",
                  description: error instanceof Error ? error.message : "请重试",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || !connections.find(c => c.platform === 'reddit' && c.is_active)}
            className="w-full"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            🧪 测试发布到 r/test
          </Button>
          {!connections.find(c => c.platform === 'reddit' && c.is_active) && (
            <p className="text-sm text-muted-foreground">
              请先连接 Reddit 账号
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            点击按钮将自动从数据库选择一个涂色页并发布到 r/test 进行测试
          </p>
        </CardContent>
      </Card>

      {autoConfig && (
        <Card>
          <CardHeader>
            <CardTitle>🤖 Reddit 智能自动营销</CardTitle>
            <CardDescription>AI 自动生成文案并定时发布，遵守社区规则</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 启用/禁用开关 */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">自动发布状态</h4>
                <p className="text-sm text-muted-foreground">
                  {autoConfig.is_enabled ? '✅ 已启用 - 系统将自动发布内容' : '❌ 已禁用 - 手动控制发布'}
                </p>
              </div>
              <Button
                variant={autoConfig.is_enabled ? "destructive" : "default"}
                onClick={() => updateAutoConfig({ is_enabled: !autoConfig.is_enabled })}
                disabled={configLoading || !connections.find(c => c.platform === 'reddit' && c.is_active)}
              >
                {configLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {autoConfig.is_enabled ? '停止自动发布' : '启用自动发布'}
              </Button>
            </div>

            {/* 配置设置 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>每天发布次数</Label>
                <Select
                  value={autoConfig.posts_per_day.toString()}
                  onValueChange={(value) => updateAutoConfig({ posts_per_day: parseInt(value) })}
                  disabled={configLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 次/天（最保守）</SelectItem>
                    <SelectItem value="2">2 次/天（推荐）</SelectItem>
                    <SelectItem value="3">3 次/天</SelectItem>
                    <SelectItem value="4">4 次/天</SelectItem>
                    <SelectItem value="5">5 次/天（最大）</SelectItem>
                    <SelectItem value="10">10 次/天 🧪 测试用</SelectItem>
                    <SelectItem value="24">24 次/天 🧪 测试用</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  保守策略避免被封禁
                </p>
              </div>

              <div className="space-y-2">
                <Label>发布间隔（小时）</Label>
                <Select
                  value={autoConfig.hours_between_posts.toString()}
                  onValueChange={(value) => updateAutoConfig({ hours_between_posts: parseFloat(value) })}
                  disabled={configLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.033">2 分钟 🧪 极速测试</SelectItem>
                    <SelectItem value="0.083">5 分钟 🧪 快速测试</SelectItem>
                    <SelectItem value="0.167">10 分钟 🧪 测试用</SelectItem>
                    <SelectItem value="0.25">15 分钟 🧪 测试用</SelectItem>
                    <SelectItem value="0.5">30 分钟 🧪 测试用</SelectItem>
                    <SelectItem value="1">1 小时 🧪 测试用</SelectItem>
                    <SelectItem value="2">2 小时</SelectItem>
                    <SelectItem value="4">4 小时</SelectItem>
                    <SelectItem value="6">6 小时（推荐）</SelectItem>
                    <SelectItem value="8">8 小时</SelectItem>
                    <SelectItem value="12">12 小时</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subreddit 配置 */}
            <div className="space-y-2">
              <Label>允许的 Subreddits</Label>
              <Textarea
                value={autoConfig.allowed_subreddits.join(', ')}
                onChange={(e) => {
                  const subreddits = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  updateAutoConfig({ allowed_subreddits: subreddits });
                }}
                placeholder="test, coloring, ColoringPages, crafts"
                disabled={configLoading}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                用逗号分隔，不需要 r/ 前缀。AI 会根据内容选择最适合的 subreddit。
              </p>
            </div>

            {/* 状态显示 */}
            {autoConfig.last_post_at && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">最后发布时间</p>
                <p className="text-muted-foreground">
                  {new Date(autoConfig.last_post_at).toLocaleString('zh-CN')}
                </p>
              </div>
            )}

            {/* 快速配置按钮 */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">⚡ 快速配置</h4>
              <Button
                onClick={applyPhase2Config}
                disabled={configLoading}
                variant="default"
                className="w-full"
              >
                {configLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                🚀 使用第二阶段推荐配置
              </Button>
              <p className="text-xs text-muted-foreground">
                将应用：6次/天，4小时间隔，目标 subreddits: test, coloring, ColoringPages, crafts
              </p>
            </div>

            {/* 测试按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={testAutoPost}
                disabled={loading || !connections.find(c => c.platform === 'reddit' && c.is_active)}
                variant="outline"
                className="flex-1"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                🧪 测试运行一次
              </Button>
            </div>

            {/* 说明 */}
            <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
              <h4 className="font-medium">🛡️ 安全保护机制</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>AI 自动生成自然文案，避免模板化</li>
                <li>严格遵守发布频率限制</li>
                <li>避免重复发布同一内容到同一 subreddit</li>
                <li>30天内不重复发布相同涂色页</li>
                <li>根据涂色页内容智能选择 subreddit</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>手动发布</CardTitle>
          <CardDescription>手动创建和发布内容</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">创建新帖子</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>发布到社交媒体</DialogTitle>
                <DialogDescription>
                  选择平台并填写内容信息
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>平台</Label>
                  <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="pinterest">Pinterest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>标题</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入标题..."
                  />
                </div>

                <div>
                  <Label>描述</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="输入描述..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>图片URL</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {platform === 'reddit' && (
                  <div>
                    <Label>Subreddit</Label>
                    <Input
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      placeholder="coloring"
                    />
                  </div>
                )}

                {platform === 'pinterest' && (
                  <div>
                    <Label>Board ID</Label>
                    <Input
                      value={boardId}
                      onChange={(e) => setBoardId(e.target.value)}
                      placeholder="输入 Board ID..."
                    />
                  </div>
                )}

                <Button onClick={handlePost} disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  发布
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📊 营销动作历史</CardTitle>
              <CardDescription>查看所有自动和手动发布的详细记录</CardDescription>
            </div>
            <Button
              onClick={loadPosts}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              🔄 刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                暂无发布记录
              </p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  {/* 头部：平台、状态、时间 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {post.platform === 'reddit' ? '🔴 Reddit' : '📌 Pinterest'}
                      </Badge>
                      {post.ai_generated && (
                        <Badge variant="secondary">
                          🤖 AI 自动
                        </Badge>
                      )}
                      <Badge variant={post.status === 'published' ? 'default' : post.status === 'failed' ? 'destructive' : 'secondary'}>
                        {post.status === 'published' ? '✅ 已发布' : post.status === 'failed' ? '❌ 失败' : post.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {post.posted_at 
                        ? new Date(post.posted_at).toLocaleString('zh-CN', { 
                            year: 'numeric',
                            month: '2-digit', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '待发布'}
                    </span>
                  </div>

                  {/* 标题 */}
                  <div>
                    <h4 className="font-medium text-base mb-1">{post.title}</h4>
                    {post.subreddit && (
                      <p className="text-sm text-muted-foreground">
                        📍 r/{post.subreddit}
                      </p>
                    )}
                  </div>

                  {/* 描述 */}
                  {post.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.description}
                    </p>
                  )}

                  {/* 互动数据 */}
                  {(post.engagement_score > 0 || post.reply_count > 0) && (
                    <div className="flex gap-4 text-sm">
                      {post.engagement_score > 0 && (
                        <span className="text-muted-foreground">
                          👍 互动分: {post.engagement_score}
                        </span>
                      )}
                      {post.reply_count > 0 && (
                        <span className="text-muted-foreground">
                          💬 回复: {post.reply_count}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 错误信息 */}
                  {post.error_message && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      ⚠️ {post.error_message}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-2">
                    {post.post_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                          🔗 查看帖子
                        </a>
                      </Button>
                    )}
                    {post.image_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={post.image_url} target="_blank" rel="noopener noreferrer">
                          🖼️ 查看图片
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>预览帖子</DialogTitle>
            <DialogDescription>
              查看 AI 生成的内容，确认后发布到 Pinterest
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={previewData.imageUrl} 
                  alt={previewData.title}
                  className="w-full h-64 object-cover"
                />
              </div>

              <div>
                <Label>标题</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {previewData.title}
                </div>
              </div>

              <div>
                <Label>描述</Label>
                <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {previewData.description}
                </div>
              </div>

              <div>
                <Label>发布到</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  📌 Board: {previewData.boardName}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleConfirmPost}
                  disabled={autoPosting}
                  className="flex-1"
                >
                  {autoPosting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  确认发布
                </Button>
                <Button 
                  onClick={() => setPreviewDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}