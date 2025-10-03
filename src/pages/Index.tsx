import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { ColoringCard } from "@/components/ColoringCard";
import { SeriesCard } from "@/components/SeriesCard";
import { RecommendedPages } from "@/components/RecommendedPages";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Heart } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

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
            name
          )
        `)
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
          coloring_pages (
            *,
            categories (
              name
            )
          )
        `)
        .eq('user_id', user.id)
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
    seriesTitle: pages[0]?.series_title || '',
    seriesTotal: pages[0]?.series_total || pages.length,
    difficulty: pages[0]?.difficulty || 'medium',
    category: pages[0]?.categories?.name || 'Uncategorized',
    firstImage: pages[0]?.image_url || '',
    pages
  }));

  // Pages to display (either selected series pages or standalone pages)
  const pagesToDisplay = selectedSeriesId
    ? seriesGroups.get(selectedSeriesId) || []
    : standalonePages;

  const handlePageSelect = (pageId: string, selected: boolean) => {
    const newSelected = new Set(selectedPages);
    if (selected) {
      newSelected.add(pageId);
    } else {
      newSelected.delete(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleBatchDownload = async () => {
    if (selectedPages.size === 0) {
      toast.error("Please select coloring pages to download");
      return;
    }

    toast.info(`Downloading ${selectedPages.size} coloring pages...`);
    
    let successCount = 0;
    for (const pageId of selectedPages) {
      const page = coloringPages?.find(p => p.id === pageId);
      if (!page) continue;

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
        
        // Increment download count
        await supabase.rpc('increment_download_count', { page_id: pageId });
        
        successCount++;
        
        // Add delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${page.title}:`, error);
      }
    }

    toast.success(`Successfully downloaded ${successCount} coloring pages!`);
    setSelectedPages(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        <Categories 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        
        {/* Search Bar */}
        <section className="py-6 md:py-8 bg-background">
          <div className="container px-4">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search coloring pages by title, description, category, or series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 md:pl-10 h-11 md:h-12 text-sm md:text-base"
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

        {/* Favorites Section */}
        {user && showFavorites && (
          <section className="py-12 md:py-16 lg:py-20 bg-background" id="favorites-section">
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
                      title={page.title}
                      image={page.image_url}
                      category={page.categories?.name || 'Uncategorized'}
                      difficulty={page.difficulty as "easy" | "medium" | "hard"}
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
          </section>
        )}
        
        <section className="py-12 md:py-16 lg:py-20 bg-muted/30" id="popular">
          <div className="container px-4">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                {selectedSeriesId 
                  ? seriesToDisplay.find(s => s.seriesId === selectedSeriesId)?.seriesTitle 
                  : selectedCategory 
                    ? `${selectedCategory} Coloring Pages` 
                    : 'Popular Coloring Pages'
                }
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                {selectedSeriesId 
                  ? 'All chapters from this story series' 
                  : selectedCategory 
                    ? `Browse our collection of ${selectedCategory} themed coloring pages`
                    : 'Most popular and downloaded coloring pages'
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

            {/* Show story series first if not viewing a specific series */}
            {!selectedSeriesId && seriesToDisplay.length > 0 && (
              <div className="mb-8 md:mb-12">
                <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 px-4 md:px-0">📚 Story Series</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {seriesToDisplay.map((series) => (
                    <SeriesCard
                      key={series.seriesId}
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
            {pagesToDisplay.length > 0 && (
              <>
                {!selectedSeriesId && <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 px-4 md:px-0">🎨 Individual Pages</h3>}
                
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-center gap-2 md:gap-4 px-4 md:px-0">
                  <Button
                    onClick={() => {
                      const allIds = new Set(pagesToDisplay.map(p => p.id));
                      setSelectedPages(allIds);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={() => setSelectedPages(new Set())}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Deselect All
                  </Button>
                  <Button
                    onClick={handleBatchDownload}
                    disabled={selectedPages.size === 0}
                    size="sm"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Batch Download ({selectedPages.size})
                  </Button>
                </div>
              </>
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
                    title={page.title}
                    image={page.image_url}
                    category={page.categories?.name || 'Uncategorized'}
                    difficulty={page.difficulty as "easy" | "medium" | "hard"}
                    isSelected={selectedPages.has(page.id)}
                    onSelect={(selected) => handlePageSelect(page.id, selected)}
                  />
                ))
              ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {selectedSeriesId ? 'No pages in this series yet' : 'No coloring pages available yet. Check back soon!'}
              </div>
              )}
            </div>

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
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
