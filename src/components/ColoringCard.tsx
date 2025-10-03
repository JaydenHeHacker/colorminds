import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { ShareDialog } from "./ShareDialog";

interface ColoringCardProps {
  id?: string;
  title: string;
  image: string;
  category: string;
  difficulty?: "easy" | "medium" | "hard";
  onSelect?: (selected: boolean) => void;
  isSelected?: boolean;
}

export const ColoringCard = ({ id, title, image, category, difficulty = "medium", onSelect, isSelected = false }: ColoringCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && id) {
      checkFavoriteStatus();
    }
  }, [user, id]);

  const checkFavoriteStatus = async () => {
    if (!id || !user) return;
    
    setIsCheckingFavorite(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('coloring_page_id', id)
        .maybeSingle();
      
      if (!error) {
        setIsFavorited(!!data);
      }
    } catch (error) {
      console.error('Error checking favorite:', error);
    } finally {
      setIsCheckingFavorite(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      sonnerToast.error("请先登录以收藏涂色页");
      navigate("/auth");
      return;
    }

    if (!id) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('coloring_page_id', id);
        
        if (error) throw error;
        
        setIsFavorited(false);
        sonnerToast.success("已取消收藏");
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            coloring_page_id: id
          });
        
        if (error) throw error;
        
        setIsFavorited(true);
        sonnerToast.success("已添加到收藏");
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      sonnerToast.error("操作失败：" + error.message);
    }
  };

  const difficultyConfig = {
    easy: { label: "简单", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "中等", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "困难", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[difficulty];

  const handleDownload = async () => {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Increment download count
      if (id) {
        await supabase.rpc('increment_download_count', { page_id: id });
      }
      
      toast({
        title: "Download started",
        description: `Downloading ${title}...`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful relative">
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
        </div>
      )}
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={`${title} - ${category} coloring page for kids and adults - Free printable`}
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          loading="lazy"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {category}
            </span>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1 gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button 
            size="sm" 
            variant={isFavorited ? "default" : "outline"}
            onClick={handleToggleFavorite}
            disabled={isCheckingFavorite}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsShareOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {id && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={title}
          pageId={id}
        />
      )}
    </Card>
  );
};
