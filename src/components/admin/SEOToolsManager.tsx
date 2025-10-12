import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Image, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SEOToolsManager = () => {
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [isGeneratingImageSitemap, setIsGeneratingImageSitemap] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      console.log('Generating sitemap...');
      const { data, error } = await supabase.functions.invoke('generate-sitemap');
      
      if (error) throw error;
      
      console.log('Sitemap generated successfully');
      setLastGenerated(new Date().toLocaleString('zh-CN'));
      toast.success('Sitemap 生成成功', {
        description: '新的 sitemap.xml 已生成，包含所有最新的类目slug'
      });
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('生成失败', {
        description: error instanceof Error ? error.message : '请稍后重试'
      });
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const handleGenerateImageSitemap = async () => {
    setIsGeneratingImageSitemap(true);
    try {
      console.log('Generating image sitemap...');
      const { data, error } = await supabase.functions.invoke('generate-image-sitemap');
      
      if (error) throw error;
      
      console.log('Image sitemap generated successfully');
      toast.success('图片 Sitemap 生成成功', {
        description: '新的 image-sitemap.xml 已生成'
      });
    } catch (error) {
      console.error('Error generating image sitemap:', error);
      toast.error('生成失败', {
        description: error instanceof Error ? error.message : '请稍后重试'
      });
    } finally {
      setIsGeneratingImageSitemap(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">SEO 工具</h2>
        <p className="text-muted-foreground">
          管理网站的 SEO 相关文件和配置
        </p>
      </div>

      {lastGenerated && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            上次生成时间: {lastGenerated}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Sitemap */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>主 Sitemap</CardTitle>
            </div>
            <CardDescription>
              生成包含所有页面、类目和内容的主 sitemap.xml
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ 自动包含所有已发布的着色页</p>
              <p>✓ 自动包含所有类目（使用最新slug）</p>
              <p>✓ 自动设置优先级和更新频率</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateSitemap}
                disabled={isGeneratingSitemap}
                className="flex-1"
              >
                {isGeneratingSitemap ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重新生成
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                asChild
              >
                <a 
                  href="https://www.colorminds.fun/sitemap.xml" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                提示：类目slug更新后建议立即重新生成
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Sitemap */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              <CardTitle>图片 Sitemap</CardTitle>
            </div>
            <CardDescription>
              生成专门的图片 sitemap，帮助 Google 图片搜索索引
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ 包含所有着色页图片</p>
              <p>✓ 优化 Google 图片搜索收录</p>
              <p>✓ 自动添加图片标题和描述</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateImageSitemap}
                disabled={isGeneratingImageSitemap}
                className="flex-1"
              >
                {isGeneratingImageSitemap ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重新生成
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                asChild
              >
                <a 
                  href="https://www.colorminds.fun/image-sitemap.xml" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                提示：新增大量图片后建议重新生成
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle>SEO 优化建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-primary">1.</span>
            <p>类目slug更新后，立即重新生成主sitemap，让搜索引擎快速发现新URL</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-primary">2.</span>
            <p>确保 robots.txt 包含 sitemap 引用（已配置）</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-primary">3.</span>
            <p>在 Google Search Console 中手动提交新生成的 sitemap</p>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-primary">4.</span>
            <p>重定向系统已自动处理旧URL，无需额外配置</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
