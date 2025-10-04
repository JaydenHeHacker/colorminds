import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { SeriesCard } from "@/components/SeriesCard";
import { RecommendedPages } from "@/components/RecommendedPages";
import { FAQ } from "@/components/FAQ";
import { AboutSection } from "@/components/AboutSection";
import { CreateCTA } from "@/components/CreateCTA";
import { Footer } from "@/components/Footer";
import { SocialMeta } from "@/components/SocialMeta";
import { StructuredData } from "@/components/StructuredData";
import { LazySection } from "@/components/LazySection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, BookOpen, Palette } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Get URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(
    searchParams.get('series')
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSeriesId) params.set('series', selectedSeriesId);
    if (searchQuery) params.set('search', searchQuery);
    
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    window.history.replaceState({}, '', newUrl);
    
    // Update page title based on filters
    let title = 'Free Printable Coloring Pages for Kids & Adults | Color Minds';
    if (selectedCategory) {
      title = `${selectedCategory} Coloring Pages - Free Printables | Color Minds`;
    } else if (searchQuery) {
      title = `Search: "${searchQuery}" - Coloring Pages | Color Minds`;
    }
    document.title = title;
  }, [selectedCategory, selectedSeriesId, searchQuery]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setShowFavorites(false);
      }
    });

    // Check if URL has #favorites hash
    if (window.location.hash === '#favorites') {
      setTimeout(() => {
        setShowFavorites(true);
        document.getElementById('favorites-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    return () => subscription.unsubscribe();
  }, []);

  const { data: coloringPages, isLoading } = useQuery({
    queryKey: ['coloring-pages'],
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
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: favoritePages, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorite-pages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          coloring_page_id,
          coloring_pages!inner (
            *,
            categories (
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('coloring_pages.status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(fav => fav.coloring_pages).filter(Boolean);
    },
  });

  // Filter coloring pages by search and category
  const filteredPages = coloringPages?.filter(page => {
    const matchesCategory = !selectedCategory || page.categories?.name === selectedCategory;
    const matchesSearch = !searchQuery || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.categories?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.series_title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group pages by series
  const seriesGroups = new Map<string, any[]>();
  const standalonePages: any[] = [];

  filteredPages?.forEach(page => {
    if (page.series_id) {
      if (!seriesGroups.has(page.series_id)) {
        seriesGroups.set(page.series_id, []);
      }
      seriesGroups.get(page.series_id)!.push(page);
    } else {
      standalonePages.push(page);
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
    category: pages[0]?.categories?.name || 'Uncategorized',
    firstImage: pages[0]?.image_url || '',
    pages
  }));

  // Get recently published pages (last 7 days)
  const getRecentlyPublished = () => {
    if (!standalonePages.length) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return standalonePages
      .filter(page => page.published_at && new Date(page.published_at) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 12);
  };

  // Get today's featured pages (rotates daily based on date)
  const getTodaysFeatured = () => {
    if (!standalonePages.length) return [];
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const startIndex = (dayOfYear * 4) % standalonePages.length;
    const featured = [];
    for (let i = 0; i < Math.min(8, standalonePages.length); i++) {
      featured.push(standalonePages[(startIndex + i) % standalonePages.length]);
    }
    return featured;
  };

  const recentlyPublished = getRecentlyPublished();

  // Pages to display (either selected series pages or standalone pages)
  const pagesToDisplay = selectedSeriesId
    ? seriesGroups.get(selectedSeriesId) || []
    : selectedCategory || searchQuery
    ? standalonePages
    : getTodaysFeatured();

  // Get current series title for breadcrumbs
  const currentSeriesTitle = selectedSeriesId 
    ? seriesToDisplay.find(s => s.seriesId === selectedSeriesId)?.seriesTitle 
    : null;


  // SEO meta data
  const pageTitle = selectedCategory 
    ? `${selectedCategory} Coloring Pages - Free Printables | Color Minds`
    : searchQuery
    ? `Search: "${searchQuery}" - Coloring Pages | Color Minds`
    : 'Free Printable Coloring Pages for Kids & Adults | Color Minds';
    
  const pageDescription = selectedCategory
    ? `Browse ${selectedCategory.toLowerCase()} coloring pages - 100% free and printable! Download high-quality designs for kids and adults. Print instantly at home or in the classroom.`
    : 'Discover 1000+ free printable coloring pages for kids and adults. Browse animals, holidays, fantasy characters, and exclusive AI-generated story series. Download and print high-quality designs instantly - perfect for home or classroom!';

  // Get most recent published date for SEO
  const mostRecentUpdate = coloringPages?.[0]?.published_at || new Date().toISOString();

  return (
    <div className="min-h-screen flex flex-col">
      <SocialMeta
        title={pageTitle}
        description={pageDescription}
        image={coloringPages?.[0]?.image_url}
        type="website"
        modifiedTime={mostRecentUpdate}
        keywords={[
          'free coloring pages',
          'printable coloring pages',
          'free printable coloring pages',
          'coloring pages for kids',
          'adult coloring pages',
          'download coloring pages',
          'coloring pages printable',
          ...(selectedCategory ? [`${selectedCategory} coloring pages`] : [])
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: selectedCategory || 'All Categories',
          description: pageDescription,
          numberOfItems: filteredPages?.length || 0,
          items: pagesToDisplay.slice(0, 12).map(page => ({
            title: page.title,
            image: page.image_url
          }))
        }}
      />
      
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        {(selectedCategory || selectedSeriesId || searchQuery) && (
          <Breadcrumbs 
            items={[
              { label: 'Home', href: '#' },
              ...(selectedCategory ? [{ label: selectedCategory, isCurrentPage: !selectedSeriesId }] : []),
              ...(selectedSeriesId && currentSeriesTitle ? [{ label: currentSeriesTitle, isCurrentPage: true }] : []),
              ...(searchQuery && !selectedCategory && !selectedSeriesId ? [{ label: `Search: "${searchQuery}"`, isCurrentPage: true }] : []),
            ]}
          />
        )}
        
        <Categories 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        {/* Search Bar - Moved up for better UX */}
        <section className="py-6 md:py-8 bg-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <p className="text-center text-sm md:text-base text-muted-foreground mb-3">
                🔍 Search from 1000+ free printable coloring pages - Find your perfect design to download and print instantly!
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search free printable coloring pages - animals, holidays, characters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-11 md:h-12 text-sm md:text-base"
                  aria-label="Search free printable coloring pages"
                />
              </div>
              {searchQuery && (
                <p className="text-xs md:text-sm text-muted-foreground mt-2 text-center">
                  Found {pagesToDisplay.length + (selectedSeriesId ? 0 : seriesToDisplay.length)} results
                </p>
              )}
            </div>
          </div>
        </section>
        
        {/* Recently Published Section - Only show on homepage without filters */}
        {!selectedCategory && !selectedSeriesId && !searchQuery && recentlyPublished.length > 0 && (
          <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="container px-4 relative z-10">
              <div className="text-center mb-8 md:mb-10">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 border-2 border-primary/30 mb-4 animate-fade-in">
                  <span className="text-2xl animate-bounce">✨</span>
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">Fresh Content</span>
                  <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎨</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Recently Published Coloring Pages
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                  🔥 Brand new designs added in the last 7 days - Download and print the freshest coloring pages now!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {recentlyPublished.map((page, index) => (
                  <div key={page.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
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
                      showNewBadge={index < 4}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* AI Creation CTA after search */}
        <LazySection className="container px-4 py-8">
          <CreateCTA variant="inline" context="category" />
        </LazySection>

        {/* Favorites Section */}
        {user && showFavorites && (
          <article className="py-12 md:py-16 lg:py-20 bg-background" id="favorites-section">
            <div className="container px-4">
              <div className="text-center mb-6 md:mb-8">
                <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                  <Heart className="h-6 w-6 md:h-8 md:w-8 text-primary fill-primary" />
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">My Favorites</h2>
                </div>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                  All your favorite coloring pages in one place
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowFavorites(false)}
                  className="mt-3 md:mt-4"
                >
                  Back to Browse
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isLoadingFavorites ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading...
                  </div>
                ) : favoritePages && favoritePages.length > 0 ? (
                  favoritePages.map((page: any) => (
                    <ColoringCard
                      key={page.id}
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
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-xl mb-2">No favorites yet</p>
                    <p className="text-sm">Browse coloring pages below and click the heart icon to save your favorites</p>
                    <Button
                      variant="default"
                      onClick={() => setShowFavorites(false)}
                      className="mt-4"
                    >
                      Start Browsing
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
        
        <article className="py-12 md:py-16 lg:py-20 bg-muted/30" id="popular">
          <div className="container px-4">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                {selectedSeriesId 
                  ? seriesToDisplay.find(s => s.seriesId === selectedSeriesId)?.seriesTitle 
                  : selectedCategory 
                    ? `${selectedCategory} Coloring Pages` 
                    : searchQuery
                    ? 'Search Results'
                    : "Explore Our Collection"
                }
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                {selectedSeriesId 
                  ? 'All chapters from this story series' 
                  : selectedCategory 
                    ? `Browse our collection of ${selectedCategory} free printable coloring pages - All designs ready to download and print!`
                    : searchQuery
                    ? `Found ${pagesToDisplay.length} coloring pages matching your search`
                    : 'Discover story series and curated highlights - Content refreshed daily!'
                }
              </p>
              {selectedSeriesId && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedSeriesId(null)}
                  className="mt-3 md:mt-4"
                >
                  Back to All
                </Button>
              )}
            </div>

            {/* For homepage without filters - Show all sections for SEO */}
            {!selectedSeriesId && !selectedCategory && !searchQuery ? (
              <div className="space-y-16">
                {/* Story Series Section */}
                {seriesToDisplay.length > 0 && (
                  <section className="relative" id="story-series">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 rounded-3xl -z-10" />
                    <div className="py-8 px-6 md:px-8">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-secondary to-secondary/80 rounded-xl shadow-lg">
                            <BookOpen className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold">Story Series</h3>
                            <p className="text-sm text-muted-foreground">Complete themed collections</p>
                          </div>
                        </div>
                        <span className="px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-semibold border-2 border-secondary/20">
                          {seriesToDisplay.length} Series
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-3xl">
                        📚 Discover complete story collections with multiple themed coloring pages. Each series tells a unique story through beautifully illustrated chapters.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {seriesToDisplay.map((series, index) => (
                          <div key={series.seriesId} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                            <SeriesCard
                              seriesId={series.seriesId}
                              seriesSlug={series.seriesSlug}
                              seriesTitle={series.seriesTitle}
                              seriesTotal={series.seriesTotal}
                              difficulty={series.difficulty as "easy" | "medium" | "hard"}
                              category={series.category}
                              firstImage={series.firstImage}
                              onViewSeries={() => setSelectedSeriesId(series.seriesId)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Featured Pages Section */}
                {pagesToDisplay.length > 0 && (
                  <section className="relative" id="daily-picks">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl -z-10" />
                    <div className="py-8 px-6 md:px-8">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                            <Palette className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold">Today's Picks</h3>
                            <p className="text-sm text-muted-foreground">Curated selection rotates daily</p>
                          </div>
                        </div>
                        <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold border-2 border-primary/20">
                          {pagesToDisplay.length} Pages
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-3xl">
                        🎨 Discover our hand-picked daily highlights! This selection automatically refreshes each day, showcasing different coloring pages from our entire collection. Come back tomorrow for a new selection!
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {pagesToDisplay.map((page, index) => (
                          <div key={page.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
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
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* For filtered views or when viewing specific series - Show without tabs */
              <>
                {/* Show story series first if not viewing a specific series */}
                {!selectedSeriesId && seriesToDisplay.length > 0 && (
                  <div className="mb-8 md:mb-12">
                    <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 px-4 md:px-0">📚 Story Series</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                          onViewSeries={() => setSelectedSeriesId(series.seriesId)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Show regular pages or series pages */}
                {pagesToDisplay.length > 0 && !selectedSeriesId && (selectedCategory || searchQuery) && (
                  <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 px-4 md:px-0">🎨 Coloring Pages</h3>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {isLoading ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Loading coloring pages...
                  </div>
                  ) : pagesToDisplay.length > 0 ? (
                    pagesToDisplay.map((page) => (
                      <ColoringCard
                        key={page.id}
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
                    ))
                  ) : (
                  <div className="col-span-full">
                    <CreateCTA 
                      variant="empty-state" 
                      context={searchQuery ? "search" : "category"}
                    />
                  </div>
                  )}
                </div>
              </>
            )}

            {/* Recommended Pages - Show when viewing specific series or filtered content */}
            {(selectedSeriesId || selectedCategory) && pagesToDisplay.length > 0 && (
              <div className="mt-16">
                <RecommendedPages
                  currentPageId={pagesToDisplay[0]?.id || ''}
                  category={selectedCategory || pagesToDisplay[0]?.categories?.name}
                  difficulty={pagesToDisplay[0]?.difficulty}
                />
              </div>
            )}
          </div>
        </article>
        
        <LazySection>
          <AboutSection />
        </LazySection>
        
        <LazySection>
          <FAQ />
        </LazySection>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
