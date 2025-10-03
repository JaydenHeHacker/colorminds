import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Heart, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { ShareDialog } from "./ShareDialog";

interface ColoringCardProps {
  id?: string;
  slug?: string;
  title: string;
  image: string;
  category: string;
  difficulty?: "easy" | "medium" | "hard";
}

export const ColoringCard = ({ id, slug, title, image, category, difficulty = "medium" }: ColoringCardProps) => {
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

  const handlePrint = async () => {
    try {
      sonnerToast.info("Loading image for print...");
      
      // Create a hidden iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe');
      }
      
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ${title}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              img {
                max-width: 100%;
                height: auto;
                display: block;
              }
              @media print {
                body {
                  margin: 0;
                }
                img {
                  max-width: 100%;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <img src="${image}" alt="${title}" />
          </body>
        </html>
      `);
      iframeDoc.close();
      
      // Wait for image to load
      const img = iframeDoc.querySelector('img');
      if (img) {
        img.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 100);
          }, 250);
        };
        
        img.onerror = () => {
          sonnerToast.error("Failed to load image");
          document.body.removeChild(iframe);
        };
      }
      
      // Increment download count
      if (id) {
        await supabase.rpc('increment_download_count', { page_id: id });
      }
      
      sonnerToast.success("Print dialog will open shortly...");
    } catch (error) {
      console.error('Print error:', error);
      sonnerToast.error("Print failed. Please try again.");
    }
  };
  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful relative">
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
          <Button size="sm" className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
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
