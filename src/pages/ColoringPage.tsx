import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RecommendedPages } from "@/components/RecommendedPages";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";

const ColoringPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
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

  const { data: page, isLoading } = useQuery({
    queryKey: ['coloring-page', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Invalid slug');
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: isFavoritedData } = useQuery({
    queryKey: ['is-favorited', page?.id, user?.id],
    queryFn: async () => {
      if (!page?.id || !user) return false;
      
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('coloring_page_id', page.id)
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!page?.id && !!user,
  });

  useEffect(() => {
    setIsFavorited(isFavoritedData || false);
  }, [isFavoritedData]);

  useEffect(() => {
    if (page) {
      const categoryName = page.categories?.name || 'Coloring Page';
      document.title = `${page.title} - Free Printable ${categoryName} Coloring Page | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Download and print this free ${page.title} coloring page. ${page.description || `Perfect for kids and adults who love ${categoryName.toLowerCase()}.`} High-quality printable design.`
        );
      }
    }
  }, [page]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      navigate("/auth");
      return;
    }

    if (!page?.id) return;

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('coloring_page_id', page.id);
        
        if (error) throw error;
        
        setIsFavorited(false);
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            coloring_page_id: page.id
          });
        
        if (error) throw error;
        
        setIsFavorited(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite");
    }
  };

  const handleDownload = async () => {
    if (!page) return;
    
    try {
      const response = await fetch(page.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      await supabase.rpc('increment_download_count', { page_id: page.id });
      toast.success(`Downloading ${page.title}...`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Download failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Coloring Page Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const difficultyConfig = {
    easy: { label: "Easy", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "Medium", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "Hard", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[page.difficulty || 'medium'];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            ...(page.categories ? [{ 
              label: page.categories.name, 
              href: `/category/${page.categories.slug}` 
            }] : []),
            { label: page.title, isCurrentPage: true },
          ]}
        />

        <article className="container px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Image Section */}
              <div className="space-y-4">
                <div className="aspect-square overflow-hidden rounded-lg border-2 border-border shadow-lg">
                  <img
                    src={page.image_url}
                    alt={`${page.title} - Free printable ${page.categories?.name || 'coloring'} page for kids and adults`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleDownload} className="flex-1 gap-2" size="lg">
                    <Download className="h-5 w-5" />
                    Download & Print
                  </Button>
                  <Button 
                    variant={isFavorited ? "default" : "outline"}
                    onClick={handleToggleFavorite}
                    size="lg"
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsShareOpen(true)}
                    size="lg"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                    {page.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {page.categories && (
                      <Link to={`/category/${page.categories.slug}`}>
                        <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer">
                          {page.categories.name}
                        </span>
                      </Link>
                    )}
                    <span className={`inline-block px-3 py-1.5 text-sm font-medium rounded-full border ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                    {page.series_title && (
                      <span className="inline-block px-3 py-1.5 text-sm font-medium rounded-full bg-secondary/10 text-secondary-foreground">
                        📚 {page.series_title} - Chapter {page.series_order}/{page.series_total}
                      </span>
                    )}
                  </div>

                  {page.description && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {page.description}
                    </p>
                  )}
                </div>

                <div className="space-y-4 p-6 rounded-lg bg-muted/50 border">
                  <h2 className="text-xl font-semibold">How to Use This Coloring Page</h2>
                  <ol className="space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">1.</span>
                      <span>Click the <strong>"Download & Print"</strong> button above to save the image to your device</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">2.</span>
                      <span>Open the downloaded image and print it on standard letter or A4 paper</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">3.</span>
                      <span>Use crayons, colored pencils, markers, or any coloring tools you prefer</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold text-foreground">4.</span>
                      <span>Share your colored masterpiece with friends and family!</span>
                    </li>
                  </ol>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span><strong>{page.download_count}</strong> downloads</span>
                  </div>
                  <p className="text-xs">
                    💡 <strong>Tip:</strong> For best results, print on thick paper or cardstock for easier coloring and reduced bleed-through.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Recommended Pages */}
        {page.categories && (
          <RecommendedPages 
            currentPageId={page.id}
            category={page.categories.name}
            difficulty={page.difficulty || 'medium'}
          />
        )}
      </main>

      <Footer />

      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={page.title}
        pageId={page.id}
      />
    </div>
  );
};

export default ColoringPage;
