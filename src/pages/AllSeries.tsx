import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AllSeries = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "All Story Series - Free Printable Coloring Page Collections | Color Minds";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Explore all our story series collections. Each series tells a complete story through beautifully illustrated coloring pages. Perfect for kids and adults who love narrative coloring experiences.'
      );
    }
  }, []);

  const { data: allPages, isLoading } = useQuery({
    queryKey: ['all-series'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('status', 'published')
        .not('series_id', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Group pages by series
  const seriesGroups = new Map<string, any[]>();
  
  allPages?.forEach((page) => {
    if (page.series_id) {
      if (!seriesGroups.has(page.series_id)) {
        seriesGroups.set(page.series_id, []);
      }
      seriesGroups.get(page.series_id)!.push(page);
    }
  });

  // Sort series pages by order
  seriesGroups.forEach((pages) => {
    pages.sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  });

  // Get series to display
  const seriesToDisplay = Array.from(seriesGroups.entries()).map(([seriesId, pages]) => ({
    seriesId,
    seriesSlug: pages[0]?.series_slug || '',
    seriesTitle: pages[0]?.series_title || '',
    seriesTotal: pages[0]?.series_total || pages.length,
    difficulty: pages[0]?.difficulty || 'medium',
    category: pages[0]?.categories?.name || 'Story',
    firstImage: pages[0]?.image_url || '',
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="gap-2 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Story Series</h1>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                Explore complete coloring page series that tell beautiful stories. Each series contains multiple chapters perfect for creating your own coloring storybook.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading series...</p>
              </div>
            ) : seriesToDisplay.length > 0 ? (
              <>
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-center">
                    📚 <strong>{seriesToDisplay.length}</strong> complete story series available · 
                    <strong className="ml-2">{allPages?.length}</strong> total coloring pages
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {seriesToDisplay.map((series) => (
                    <SeriesCard
                      key={series.seriesId}
                      seriesId={series.seriesId}
                      seriesSlug={series.seriesSlug}
                      seriesTitle={series.seriesTitle}
                      seriesTotal={series.seriesTotal}
                      difficulty={series.difficulty as "easy" | "medium" | "hard"}
                      category={series.category}
                      firstImage={series.firstImage}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-24 w-24 mx-auto mb-6 opacity-20" />
                <h2 className="text-2xl font-semibold mb-2">No series available yet</h2>
                <p className="text-muted-foreground mb-6">
                  Check back soon for new story series!
                </p>
                <Button onClick={() => navigate('/')} className="gap-2">
                  Browse All Coloring Pages
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AllSeries;
