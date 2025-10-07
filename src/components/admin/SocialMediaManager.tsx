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
  post_url: string | null;
  status: string;
  posted_at: string | null;
  created_at: string;
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
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    // Check if we're returning from Reddit OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      const savedState = sessionStorage.getItem('reddit_oauth_state');
      
      if (state === savedState) {
        sessionStorage.removeItem('reddit_oauth_state');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Not authenticated');
          
          const redirectUri = `${window.location.origin}${window.location.pathname}`;
          
          const { data, error } = await supabase.functions.invoke('verify-reddit-connection', {
            body: { code, redirect_uri: redirectUri },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          
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
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
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
        
        const { data, error } = await supabase.functions.invoke('get-reddit-auth-url', {
          body: { redirect_uri: redirectUri },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (error || !data?.authUrl) {
          throw new Error(data?.error || 'Failed to get Reddit auth URL');
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
          <CardTitle>发布历史</CardTitle>
          <CardDescription>查看你的社交媒体发布记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>平台</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="capitalize">{post.platform}</TableCell>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.posted_at 
                      ? new Date(post.posted_at).toLocaleDateString('zh-CN')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {post.post_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer">
                          查看
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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