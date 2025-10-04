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
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  
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
  }, []);

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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert placeholder connection
      const { error } = await supabase
        .from('social_media_connections')
        .upsert({
          user_id: user.id,
          platform,
          access_token: 'PLACEHOLDER_TOKEN',
          username: 'placeholder_user',
          is_active: true,
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

      toast({
        title: "连接成功",
        description: `${platform === 'reddit' ? 'Reddit' : 'Pinterest'} 账号已连接（占位符模式）`,
      });

      loadConnections();
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
          <CardTitle>发布内容</CardTitle>
          <CardDescription>发布涂色页到社交媒体</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
            <DialogTrigger asChild>
              <Button>创建新帖子</Button>
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
    </div>
  );
}