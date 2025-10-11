import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { SeriesCard } from "@/components/SeriesCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Grid, List, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialMeta } from "@/components/SocialMeta";
import { StructuredData } from "@/components/StructuredData";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "series">("grid");
  const itemsPerPage = 20;

  // Fetch all categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('level', 1)
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all coloring pages
  const { data: coloringPages, isLoading } = useQuery({
    queryKey: ['browse-coloring-pages'],
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

  // Filter and sort pages
  const filteredAndSortedPages = coloringPages
    ?.filter(page => {
      const matchesSearch = !searchQuery || 
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.categories?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || page.categories?.name === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "all" || page.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Group pages by series
  const seriesGroups = new Map<string, any[]>();
  const standalonePages: any[] = [];

  filteredAndSortedPages?.forEach(page => {
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

  // Pagination
  const pagesToDisplay = viewMode === "series" ? [] : standalonePages;
  const totalPages = Math.ceil((pagesToDisplay.length + (viewMode === "series" ? seriesToDisplay.length : 0)) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const currentItems = viewMode === "series" 
    ? seriesToDisplay.slice(startIndex, endIndex)
    : pagesToDisplay.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy, viewMode]);

  // Add pagination meta tags for SEO
  useEffect(() => {
    // Remove existing pagination tags
    const existingPrev = document.querySelector('link[rel="prev"]');
    const existingNext = document.querySelector('link[rel="next"]');
    existingPrev?.remove();
    existingNext?.remove();

    if (totalPages > 1) {
      const baseUrl = `${window.location.origin}/browse`;
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
      if (sortBy !== 'newest') params.set('sort', sortBy);
      
      // Add prev link
      if (currentPage > 1) {
        const prevLink = document.createElement('link');
        prevLink.rel = 'prev';
        params.set('page', String(currentPage - 1));
        prevLink.href = `${baseUrl}?${params.toString()}`;
        document.head.appendChild(prevLink);
      }
      
      // Add next link
      if (currentPage < totalPages) {
        const nextLink = document.createElement('link');
        nextLink.rel = 'next';
        params.set('page', String(currentPage + 1));
        nextLink.href = `${baseUrl}?${params.toString()}`;
        document.head.appendChild(nextLink);
      }
    }

    return () => {
      document.querySelector('link[rel="prev"]')?.remove();
      document.querySelector('link[rel="next"]')?.remove();
    };
  }, [currentPage, totalPages, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const totalResults = viewMode === "series" 
    ? seriesToDisplay.length 
    : (filteredAndSortedPages?.length || 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SocialMeta
        title="Browse All Free Printable Coloring Pages | Color Minds"
        description={`Explore our complete collection of ${totalResults}+ free printable coloring pages for kids and adults. Filter by category, difficulty level, and more. Download and print instantly!`}
        image={coloringPages?.[0]?.image_url}
        type="website"
        keywords={[
          'free coloring pages',
          'printable coloring pages',
          'browse coloring pages',
          'coloring pages for kids',
          'adult coloring pages',
          'download coloring pages',
          'free printables'
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: selectedCategory === "all" ? "All Categories" : selectedCategory,
          description: `Browse and download ${totalResults}+ free printable coloring pages. Filter by category, difficulty, and sort to find your perfect coloring page.`,
          numberOfItems: totalResults,
          items: currentItems.slice(0, 12).map((item: any) => ({
            title: item.title || item.seriesTitle,
            image: item.image_url || item.firstImage
          }))
        }}
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 py-12 md:py-16">
          <div className="container px-4">
            <Breadcrumbs 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Browse All', isCurrentPage: true }
              ]}
            />
            <div className="text-center mt-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Browse All Coloring Pages
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore our complete collection of {totalResults} coloring pages
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-6 bg-background border-b">
          <div className="container px-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by title, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Difficulty Filter */}
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">🟢 Easy</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="hard">🔴 Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode Toggle */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "series")}>
                  <TabsList>
                    <TabsTrigger value="grid" className="gap-2">
                      <Grid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                    <TabsTrigger value="series" className="gap-2">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">Series</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Results Count */}
              <div className="text-sm text-muted-foreground text-center">
                Showing {startIndex + 1}-{Math.min(endIndex, totalResults)} of {totalResults} results
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-12 bg-muted/30">
          <div className="container px-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading coloring pages...
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-2xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedDifficulty("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {currentItems.map((page: any) => (
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
                      />
                    ))}
                  </div>
                )}

                {/* Series View */}
                {viewMode === "series" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {currentItems.map((series: any) => (
                      <SeriesCard
                        key={series.seriesId}
                        seriesId={series.seriesId}
                        seriesSlug={series.seriesSlug}
                        seriesTitle={series.seriesTitle}
                        seriesTotal={series.seriesTotal}
                        difficulty={series.difficulty as "easy" | "medium" | "hard"}
                        category={series.category}
                        firstImage={series.firstImage}
                        onViewSeries={() => {
                          window.location.href = `/series/${series.seriesSlug}`;
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}