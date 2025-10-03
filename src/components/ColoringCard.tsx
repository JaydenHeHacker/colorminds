import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast as sonnerToast } from "sonner";

interface ColoringCardProps {
  id?: string;
  slug?: string;
  title: string;
  image: string;
  category: string;
  difficulty?: "easy" | "medium" | "hard";
  seriesId?: string | null;
  seriesTitle?: string | null;
  seriesOrder?: number | null;
  seriesTotal?: number | null;
}

export const ColoringCard = ({ 
  id, 
  slug, 
  title, 
  image, 
  category, 
  difficulty = "medium",
  seriesId,
  seriesTitle,
  seriesOrder,
  seriesTotal
}: ColoringCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);

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
      sonnerToast.error("Please log in to save favorites");
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
        sonnerToast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            coloring_page_id: id
          });
        
        if (error) throw error;
        
        setIsFavorited(true);
        sonnerToast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      sonnerToast.error("Failed to update favorite");
    }
  };

  const difficultyConfig = {
    easy: { label: "Easy", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "Medium", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "Hard", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[difficulty];

  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful relative">
      {/* Favorite button in top-right corner */}
      <Button
        size="icon"
        variant={isFavorited ? "default" : "secondary"}
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-all"
        onClick={handleToggleFavorite}
        disabled={isCheckingFavorite}
      >
        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
      </Button>

      <Link to={slug ? `/coloring-page/${slug}` : '#'} className="block">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={`${title} - ${category} coloring page for kids and adults - Free printable`}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
            {category}
          </span>
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
            {config.icon} {config.label}
          </span>
          {seriesId && seriesTitle && (
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary-foreground border border-secondary/30">
              📚 {seriesOrder}/{seriesTotal}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">{title}</h3>
        {seriesId && seriesTitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            Part of: {seriesTitle}
          </p>
        )}
      </div>
    </Card>
  );
};
