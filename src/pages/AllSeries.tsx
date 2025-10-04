import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SocialMeta } from "@/components/SocialMeta";
import { StructuredData } from "@/components/StructuredData";

const AllSeries = () => {
  const navigate = useNavigate();

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

  useEffect(() => {
    document.title = "Free Printable Story Series Coloring Pages - Complete Collections | Color Minds";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Browse ${seriesToDisplay.length}+ free printable story series coloring page collections. Each series tells a complete story through beautifully illustrated sequential pages. Perfect for kids and adults who love narrative coloring experiences. Download and print instantly!`
      );
    }
  }, [seriesToDisplay.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title="Free Printable Story Series Coloring Pages - Complete Collections"
        description={`Explore ${seriesToDisplay.length}+ free printable story series coloring page collections. Each series tells a complete narrative through beautifully illustrated sequential pages. Download and print high-quality coloring books for kids and adults instantly!`}
        image={seriesToDisplay[0]?.firstImage}
        type="website"
        keywords={[
          'story series coloring pages',
          'free printable story coloring',
          'coloring page series',
          'sequential coloring pages',
          'coloring book series',
          'narrative coloring pages',
          'free printable coloring books',
          'story-based coloring',
          'kids story coloring pages',
          'adult coloring series'
        ]}
      />
      
      <StructuredData
        type="ItemList"
        data={{
          name: 'Free Printable Story Series Coloring Page Collections',
          description: `Complete collection of ${seriesToDisplay.length} story-based coloring page series. Each series tells a narrative through sequential illustrated pages.`,
          numberOfItems: seriesToDisplay.length,
          items: seriesToDisplay.map((series, index) => ({
            title: series.seriesTitle,
            image: series.firstImage,
            slug: series.seriesSlug,
            position: index + 1
          }))
        }}
      />
      
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">Free Printable Story Series Coloring Pages</h1>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl mb-4">
                Explore {seriesToDisplay.length}+ complete free printable coloring page series that tell beautiful stories. 
                Each series contains multiple sequential chapters perfect for creating your own coloring storybook. 
                Download and print high-quality designs for kids and adults - 100% free!
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  📚 {seriesToDisplay.length}+ Series
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  🎨 100% Free
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                  🖨️ Printable
                </span>
              </div>
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
