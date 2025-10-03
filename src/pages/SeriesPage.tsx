import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { useEffect } from "react";
import { StructuredData } from "@/components/StructuredData";
import { SocialMeta } from "@/components/SocialMeta";

const SeriesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: seriesPages, isLoading } = useQuery({
    queryKey: ['series-pages', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Invalid series slug');
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug,
            path
          )
        `)
        .eq('status', 'published')
        .eq('series_slug', slug)
        .order('series_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const seriesTitle = seriesPages?.[0]?.series_title;
  const category = seriesPages?.[0]?.categories;
  const totalPages = seriesPages?.[0]?.series_total;

  useEffect(() => {
    if (seriesTitle) {
      document.title = `${seriesTitle} Series - Complete Story Collection | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Explore the complete ${seriesTitle} coloring page series. ${totalPages} pages telling a beautiful story. Free printable coloring pages for kids and adults.`
        );
      }
    }
  }, [seriesTitle, totalPages]);

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

  if (!seriesPages || seriesPages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Series Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title={`${seriesTitle} Series - Complete Story Collection`}
        description={`Explore the complete ${seriesTitle} coloring page series with ${totalPages} chapters. Download and print free high-quality coloring pages for kids and adults.`}
        image={seriesPages[0]?.image_url}
        type="website"
        keywords={[
          seriesTitle || 'series',
          category?.name || 'coloring',
          'story series',
          'coloring pages',
          'printable',
          'free',
          'kids',
          'adults'
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: seriesTitle,
          description: `Complete ${seriesTitle} coloring page series with ${totalPages} pages`,
          numberOfItems: seriesPages.length,
          items: seriesPages.map(page => ({
            title: page.title,
            image: page.image_url
          }))
        }}
      />
      
      <main className="flex-1">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            ...(category ? [{ 
              label: category.name, 
              href: `/category/${category.path || category.slug}` 
            }] : []),
            { label: seriesTitle || 'Series', isCurrentPage: true },
          ]}
        />

        <section className="container px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Series Header */}
            <header className="mb-8 md:mb-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {seriesTitle}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
                A complete coloring page series with {totalPages} chapters telling a beautiful story
              </p>
              {category && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-medium">Category: {category.name}</span>
                </div>
              )}
            </header>

            {/* Story Progress */}
            <div className="mb-8 p-6 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Story Progress</h2>
                <span className="text-sm text-muted-foreground">
                  {seriesPages.length} of {totalPages} chapters
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${(seriesPages.length / (totalPages || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Series Pages Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">All Chapters</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {seriesPages.map((page) => (
                  <div key={page.id} className="relative">
                    <div className="absolute -top-2 -left-2 z-10 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                      {page.series_order}
                    </div>
                    <ColoringCard
                      id={page.id}
                      slug={page.slug}
                      title={page.title}
                      image={page.image_url}
                      category={category?.name || 'Series'}
                      difficulty={page.difficulty as "easy" | "medium" | "hard"}
                      seriesId={page.series_id}
                      seriesTitle={page.series_title}
                      seriesOrder={page.series_order}
                      seriesTotal={page.series_total}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* About This Series */}
            <div className="mt-12 p-6 rounded-lg bg-gradient-to-br from-primary/5 to-secondary/5 border">
              <h2 className="text-2xl font-semibold mb-4">📚 About This Series</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  This series consists of {totalPages} beautifully illustrated coloring pages that tell a complete story. 
                  Each page builds upon the previous one, creating an engaging narrative journey for children and adults alike.
                </p>
                <p className="font-medium text-foreground">
                  💡 <strong>Tip:</strong> Print all pages in order to create your own coloring storybook!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SeriesPage;
