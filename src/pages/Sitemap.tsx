import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SocialMeta } from "@/components/SocialMeta";
import { Link } from "react-router-dom";
import { Loader2, FolderTree, FileText, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

const Sitemap = () => {
  // Fetch all categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['sitemap-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('level', { ascending: true })
        .order('order_position', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all series
  const { data: series, isLoading: isSeriesLoading } = useQuery({
    queryKey: ['sitemap-series'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('series_id, series_slug, series_title')
        .eq('status', 'published')
        .not('series_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique series
      const uniqueSeries = new Map();
      data.forEach(page => {
        if (page.series_id && !uniqueSeries.has(page.series_id)) {
          uniqueSeries.set(page.series_id, {
            id: page.series_id,
            slug: page.series_slug,
            title: page.series_title
          });
        }
      });
      
      return Array.from(uniqueSeries.values());
    },
  });

  // Fetch sample coloring pages for each category
  const { data: pagesByCategory, isLoading: isPagesLoading } = useQuery({
    queryKey: ['sitemap-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('id, slug, title, category_id')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by category
      const byCategory = new Map();
      data.forEach(page => {
        if (!byCategory.has(page.category_id)) {
          byCategory.set(page.category_id, []);
        }
        if (byCategory.get(page.category_id).length < 10) {
          byCategory.get(page.category_id).push(page);
        }
      });
      
      return byCategory;
    },
  });

  const isLoading = isCategoriesLoading || isSeriesLoading || isPagesLoading;

  // Organize categories by level
  const topLevelCategories = categories?.filter(cat => cat.level === 1 || !cat.parent_id) || [];
  
  const getSubcategories = (parentId: string) => {
    return categories?.filter(cat => cat.parent_id === parentId) || [];
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SocialMeta
        title="HTML Sitemap - All Free Printable Coloring Pages | Color Minds"
        description="Complete sitemap of all our free printable coloring pages organized by categories and series. Browse our entire collection and find the perfect coloring page."
        type="website"
      />
      
      <Header />
      
      <main className="flex-1">
        <Breadcrumbs 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Sitemap', isCurrentPage: true }
          ]}
        />

        <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 py-12 md:py-16">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto">
              <FolderTree className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Sitemap
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Navigate through our complete collection of free printable coloring pages. Browse by category or explore our story series.
              </p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </section>
        ) : (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container px-4">
              {/* Main Pages */}
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Main Pages
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <li>
                    <Link to="/" className="text-primary hover:underline font-medium">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/browse" className="text-primary hover:underline font-medium">
                      Browse All Coloring Pages
                    </Link>
                  </li>
                  <li>
                    <Link to="/popular" className="text-primary hover:underline font-medium">
                      Popular Pages
                    </Link>
                  </li>
                  <li>
                    <Link to="/series" className="text-primary hover:underline font-medium">
                      All Story Series
                    </Link>
                  </li>
                  <li>
                    <Link to="/about-us" className="text-primary hover:underline font-medium">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact-us" className="text-primary hover:underline font-medium">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </Card>

              {/* Categories */}
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FolderTree className="h-6 w-6 text-primary" />
                  Coloring Page Categories
                </h2>
                <div className="space-y-6">
                  {topLevelCategories.map((category) => {
                    const subcategories = getSubcategories(category.id);
                    const categoryPages = pagesByCategory?.get(category.id) || [];
                    
                    return (
                      <div key={category.id} className="border-l-2 border-primary/30 pl-4">
                        <h3 className="text-xl font-semibold mb-3">
                          <Link 
                            to={`/category/${category.path}`}
                            className="text-primary hover:underline flex items-center gap-2"
                          >
                            {category.icon && !category.icon.startsWith('http') && (
                              <span className="text-2xl">{category.icon}</span>
                            )}
                            {category.name} Coloring Pages
                          </Link>
                        </h3>
                        
                        {/* Subcategories */}
                        {subcategories.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Subcategories:</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {subcategories.map((sub) => (
                                <li key={sub.id}>
                                  <Link 
                                    to={`/category/${sub.path}`}
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {sub.icon && !sub.icon.startsWith('http') && (
                                      <span className="mr-1">{sub.icon}</span>
                                    )}
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Sample pages */}
                        {categoryPages.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Featured pages:</h4>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {categoryPages.map((page) => (
                                <li key={page.id}>
                                  <Link 
                                    to={`/coloring-page/${page.slug}`}
                                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                  >
                                    {page.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Series */}
              {series && series.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    Story Series Collections
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {series.map((s: any) => (
                      <li key={s.id}>
                        <Link 
                          to={`/series/${s.slug}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Sitemap;
