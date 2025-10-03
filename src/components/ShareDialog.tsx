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
import { Facebook, Twitter, Link2, MessageCircle, Mail, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pageId: string;
}

export const ShareDialog = ({ isOpen, onClose, title, pageId }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/?page=${pageId}`;
  const shareText = `来看看这个有趣的涂色页：${title}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板！");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("复制失败，请手动复制");
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("分享成功！");
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error("分享失败");
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享涂色页</DialogTitle>
          <DialogDescription>
            与朋友分享这个涂色页
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="flex items-center gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Share Buttons */}
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

          {/* Native Share (if available) */}
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
      </DialogContent>
    </Dialog>
  );
};

// Import Share2 icon at the top
import { Share2 } from "lucide-react";
