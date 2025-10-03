import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Facebook, Twitter, Link2, MessageCircle, Mail, Check, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pageId: string;
  slug?: string;
  imageUrl?: string;
  description?: string;
  difficulty?: string;
  categoryName?: string;
}

export const ShareDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  pageId, 
  slug,
  imageUrl,
  description,
  difficulty,
  categoryName
}: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  
  // 使用SEO友好的URL
  const baseUrl = slug 
    ? `${window.location.origin}/coloring-page/${slug}`
    : `${window.location.origin}/?page=${pageId}`;
  
  // 添加UTM参数用于追踪
  const getShareUrl = (source: string) => {
    const url = new URL(baseUrl);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'social');
    url.searchParams.set('utm_campaign', 'share');
    return url.toString();
  };

  // 多种分享文案模板
  const shareTemplates = [
    {
      name: "热情推荐",
      text: `🎨 发现了超棒的涂色页！\n\n"${title}"\n\n${description || '快来一起涂色，释放创意！'}\n\n✨ ${difficulty ? `难度: ${difficulty}` : ''} | 📁 ${categoryName || '精选'}\n\n#涂色 #创意 #艺术 #${categoryName || '涂色页'}`
    },
    {
      name: "简洁分享",
      text: `🎨 ${title}\n\n${description || '来看看这个有趣的涂色页！'}\n\n👉 `
    },
    {
      name: "亲子推荐",
      text: `👨‍👩‍👧‍👦 适合亲子时光的涂色页！\n\n"${title}"\n\n让孩子们发挥想象力，享受涂色的乐趣～\n${difficulty ? `\n🎯 难度: ${difficulty}` : ''}\n\n#亲子活动 #儿童涂色 #创意启蒙`
    },
    {
      name: "教育分享",
      text: `📚 寓教于乐的涂色素材\n\n"${title}"\n\n${description || '通过涂色培养专注力和创造力'}\n\n💡 ${categoryName ? `主题: ${categoryName}` : ''}\n⭐ ${difficulty ? `适合: ${difficulty}级别` : ''}\n\n#教育资源 #涂色教学`
    }
  ];

  const currentTemplate = shareTemplates[selectedTemplate];

  const copyToClipboard = async (withText: boolean = false) => {
    try {
      const textToCopy = withText 
        ? `${currentTemplate.text}\n\n${getShareUrl('copy')}`
        : getShareUrl('copy');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(withText ? "分享内容已复制！" : "链接已复制到剪贴板！");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("复制失败，请手动复制");
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl('facebook'))}&quote=${encodeURIComponent(currentTemplate.text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    // Twitter限制280字符
    const shortText = currentTemplate.text.length > 240 
      ? currentTemplate.text.substring(0, 237) + '...'
      : currentTemplate.text;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(getShareUrl('twitter'))}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const fullText = `${currentTemplate.text}\n\n${getShareUrl('whatsapp')}`;
    const url = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`🎨 ${title} - 涂色页分享`);
    const body = encodeURIComponent(`${currentTemplate.text}\n\n查看涂色页：\n${getShareUrl('email')}\n\n---\n来自涂色乐园的分享`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🎨 ${title}`,
          text: currentTemplate.text,
          url: getShareUrl('native'),
        });
        toast.success("分享成功！");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error("分享失败");
        }
      }
    } else {
      copyToClipboard(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            分享涂色页
          </DialogTitle>
          <DialogDescription>
            选择模板，一键分享到社交媒体
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 图片预览 */}
          {imageUrl && (
            <div className="relative rounded-lg overflow-hidden border bg-muted">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <h3 className="font-semibold text-white text-lg">{title}</h3>
                {categoryName && difficulty && (
                  <p className="text-white/90 text-sm">
                    {categoryName} · {difficulty}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 分享模板选择 */}
          <Tabs value={selectedTemplate.toString()} onValueChange={(v) => setSelectedTemplate(Number(v))}>
            <TabsList className="grid w-full grid-cols-4">
              {shareTemplates.map((template, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {template.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {shareTemplates.map((template, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4">
                {/* 分享文案预览 */}
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">分享文案预览：</p>
                  <div className="text-sm whitespace-pre-wrap">{template.text}</div>
                </div>

                {/* 复制链接 */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">分享链接：</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={getShareUrl('preview')}
                      readOnly
                      className="flex-1 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(false)}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-600" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-1" />
                          复制链接
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 快速复制完整内容 */}
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(true)}
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  复制完整分享内容
                </Button>
              </TabsContent>
            ))}
          </Tabs>

          {/* 分享按钮 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">快速分享到：</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareToFacebook}
                className="gap-2 hover-scale"
              >
                <Facebook className="h-5 w-5 text-[#1877F2]" />
                Facebook
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToTwitter}
                className="gap-2 hover-scale"
              >
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                Twitter
              </Button>
              
              <Button
                variant="outline"
                onClick={shareToWhatsApp}
                className="gap-2 hover-scale"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                WhatsApp
              </Button>
              
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="gap-2 hover-scale"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                邮件
              </Button>
            </div>

            {/* 原生分享API */}
            {navigator.share && (
              <Button
                variant="default"
                onClick={handleNativeShare}
                className="w-full gap-2"
              >
                <Share2 className="h-4 w-4" />
                更多分享选项
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
