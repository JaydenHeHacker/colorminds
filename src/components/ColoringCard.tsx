import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Loader2, ShoppingBasket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInBasket, setIsInBasket] = useState(false);
  const queryClient = useQueryClient();

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
      checkBasketStatus();
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

  const checkBasketStatus = async () => {
    if (!id || !user) return;
    
    try {
      const { data } = await supabase
        .from('print_basket')
        .select('id')
        .eq('user_id', user.id)
        .eq('coloring_page_id', id)
        .maybeSingle();
      
      setIsInBasket(!!data);
    } catch (error) {
      console.error('Error checking basket:', error);
    }
  };

  const basketMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) return;

      if (isInBasket) {
        // 从打印篮移除
        const { error } = await supabase
          .from('print_basket')
          .delete()
          .eq('user_id', user.id)
          .eq('coloring_page_id', id);
        if (error) throw error;
      } else {
        // 添加到打印篮前检查限制
        // 先检查是否是Premium用户
        const { data: subData } = await supabase.functions.invoke('check-subscription');
        const isPremium = subData?.subscribed || false;
        
        if (!isPremium) {
          // Free用户，检查数量限制
          const { data: basketItems, error: countError } = await supabase
            .from('print_basket')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);
          
          if (countError) throw countError;
          
          const FREE_USER_LIMIT = 3;
          if (basketItems && basketItems.length >= FREE_USER_LIMIT) {
            throw new Error(`FREE_LIMIT:Free users can only add up to ${FREE_USER_LIMIT} items. Upgrade to Premium for unlimited items!`);
          }
        }

        const { error } = await supabase
          .from('print_basket')
          .insert({ user_id: user.id, coloring_page_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setIsInBasket(!isInBasket);
      queryClient.invalidateQueries({ queryKey: ['print-basket'] });
      sonnerToast.success(isInBasket ? "Removed from print basket" : "Added to print basket");
    },
    onError: (error: Error) => {
      if (error.message.startsWith('FREE_LIMIT:')) {
        const message = error.message.replace('FREE_LIMIT:', '');
        sonnerToast.error(message, {
          description: "Upgrade to Premium for unlimited print basket items",
          action: {
            label: "Upgrade",
            onClick: () => navigate('/credits-store')
          }
        });
      } else {
        sonnerToast.error("Operation failed");
      }
    }
  });

  const handleToggleFavorite = async () => {
    if (!user) {
      sonnerToast.error("Please log in to save favorites");
      navigate("/auth");
      return;
    }

    if (!id) return;

    setIsTogglingFavorite(true);
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
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleToggleBasket = () => {
    if (!user) {
      sonnerToast.error("请先登录");
      navigate("/auth");
      return;
    }
    basketMutation.mutate();
  };

  const difficultyConfig = {
    easy: { label: "Easy", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "Medium", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "Hard", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[difficulty];

  return (
    <Card className="group overflow-hidden border-2 hover:border-primary transition-all duration-300 shadow-sm hover:shadow-colorful hover:-translate-y-1 relative animate-fade-in">
      {/* Action buttons in top-right corner */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button
          size="icon"
          variant={isInBasket ? "default" : "secondary"}
          className="h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
          onClick={handleToggleBasket}
          disabled={basketMutation.isPending}
          aria-label={isInBasket ? "从打印篮移除" : "添加到打印篮"}
        >
          {basketMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBasket className={`h-4 w-4 transition-all ${isInBasket ? 'fill-current scale-110' : ''}`} />
          )}
        </Button>
        <Button
          size="icon"
          variant={isFavorited ? "default" : "secondary"}
          className="h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
          onClick={handleToggleFavorite}
          disabled={isCheckingFavorite || isTogglingFavorite}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          {isTogglingFavorite ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 transition-all ${isFavorited ? 'fill-current scale-110' : ''}`} />
          )}
        </Button>
      </div>

      <Link to={slug ? `/coloring-page/${slug}` : '#'} className="block" aria-label={`View ${title} coloring page`}>
        <div className="aspect-square overflow-hidden bg-muted relative">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0">
              <Skeleton className="absolute inset-0 animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
            </div>
          )}
          <img
            src={imageError ? '/placeholder.svg' : image}
            alt={`${title} - ${category} design`}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-1 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </div>
      </Link>
      
      <div className="p-4 bg-gradient-to-b from-background to-muted/20">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 transition-colors group-hover:bg-primary/20">
            {category}
          </span>
          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${config.color}`}>
            {config.icon} {config.label}
          </span>
          {seriesId && seriesTitle && (
            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary-foreground border border-secondary/30 transition-all group-hover:from-secondary/30 group-hover:to-accent/30">
              📚 {seriesOrder}/{seriesTotal}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">{title}</h3>
        {seriesId && seriesTitle && (
          <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">
            Part of: {seriesTitle}
          </p>
        )}
      </div>
    </Card>
  );
};
