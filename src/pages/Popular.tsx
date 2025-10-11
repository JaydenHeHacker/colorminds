import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { SocialMeta } from "@/components/SocialMeta";
import { StructuredData } from "@/components/StructuredData";
import { Loader2, TrendingUp } from "lucide-react";

const Popular = () => {
  // Fetch most downloaded/viewed coloring pages
  const { data: popularPages, isLoading } = useQuery({
    queryKey: ['popular-pages'],
    queryFn: async () => {
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
        .order('download_count', { ascending: false })
        .limit(48);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SocialMeta
        title="Most Popular Free Printable Coloring Pages | Color Minds"
        description="Browse the most popular free printable coloring pages. Discover trending designs loved by thousands of users. Download and print the best coloring pages for kids and adults."
        image={popularPages?.[0]?.image_url}
        type="website"
        keywords={[
          'popular coloring pages',
          'trending coloring pages',
          'most downloaded coloring pages',
          'best coloring pages',
          'free printable coloring pages',
          'top coloring pages'
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: "Popular Coloring Pages",
          description: "Most popular free printable coloring pages, sorted by downloads and user favorites.",
          numberOfItems: popularPages?.length || 0,
          items: popularPages?.slice(0, 12).map(page => ({
            title: page.title,
            image: page.image_url
          })) || []
        }}
      />
      
      <Header />
      
      <main className="flex-1">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Popular Pages', isCurrentPage: true }
          ]}
        />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-pink-950/20 py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 mb-6">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Trending Now</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Most Popular Coloring Pages
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Discover the most loved free printable coloring pages. These trending designs are downloaded and printed thousands of times by our community!
              </p>
              <div className="text-sm text-muted-foreground">
                🔥 {popularPages?.length || 0} trending designs · Updated daily based on downloads
              </div>
            </div>
          </div>
        </section>

        {/* Popular Pages Grid */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container px-4">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Top Downloaded Coloring Pages
              </h2>
              <p className="text-muted-foreground">
                These are the most popular coloring pages based on downloads and user favorites. All designs are 100% free to print!
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : popularPages && popularPages.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {popularPages.map((page, index) => (
                    <div key={page.id} className="relative">
                      {index < 3 && (
                        <div className="absolute -top-2 -left-2 z-10 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                          #{index + 1}
                        </div>
                      )}
                      <ColoringCard
                        id={page.id}
                        slug={page.slug}
                        title={page.title}
                        image={page.image_url}
                        category={page.categories?.name || 'Uncategorized'}
                        difficulty={page.difficulty as "easy" | "medium" | "hard"}
                        seriesId={page.series_id}
                        seriesTitle={page.series_title}
                        seriesOrder={page.series_order}
                        seriesTotal={page.series_total}
                        publishedAt={page.published_at}
                      />
                    </div>
                  ))}
                </div>

                {/* SEO Content */}
                <div className="mt-16 max-w-4xl mx-auto prose prose-lg">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Why These Coloring Pages Are Popular
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Our most popular coloring pages represent the best designs loved by thousands of users worldwide. 
                    These trending printables feature engaging themes, perfect detail levels, and high-quality designs 
                    that appeal to both kids and adults.
                  </p>
                  <h3 className="text-xl font-semibold mb-3">
                    What Makes a Coloring Page Popular?
                  </h3>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-6">
                    <li><strong>Engaging themes:</strong> Characters, animals, and scenes that resonate with colorists</li>
                    <li><strong>Perfect difficulty:</strong> Balanced detail that's fun without being overwhelming</li>
                    <li><strong>Print quality:</strong> High-resolution designs that print beautifully every time</li>
                    <li><strong>Versatile appeal:</strong> Designs suitable for various age groups and skill levels</li>
                  </ul>
                  <p className="text-muted-foreground">
                    All our popular coloring pages are 100% free to download and print. Browse our trending collection 
                    and discover why these designs are favorites among our community!
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No popular pages available yet
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Popular;
