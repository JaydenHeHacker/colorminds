import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const Categories = ({ selectedCategory, onCategorySelect }: CategoriesProps) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Get "All" category
      const { data: allCategory, error: allError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', 'all')
        .maybeSingle();
      
      if (allError) throw allError;
      if (!allCategory) return [];
      
      // Get its direct children
      const { data: children, error: childrenError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', allCategory.id)
        .order('order_position', { ascending: true })
        .order('name', { ascending: true });
      
      if (childrenError) throw childrenError;
      
      // Return All category first, then its children
      return [allCategory, ...(children || [])];
    },
  });

  // Get page counts for each category (including All)
  const { data: categoryCounts } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      // Get all categories with their paths
      const { data: allCategories, error: catError } = await supabase
        .from('categories')
        .select('id, parent_id');
      
      if (catError) throw catError;
      
      // Build a map of category IDs to their descendants
      const getDescendants = (categoryId: string): string[] => {
        const descendants = [categoryId];
        const children = allCategories?.filter(c => c.parent_id === categoryId) || [];
        children.forEach(child => {
          descendants.push(...getDescendants(child.id));
        });
        return descendants;
      };
      
      // Get all published pages
      const { data: pages, error: pagesError } = await supabase
        .from('coloring_pages')
        .select('category_id')
        .eq('status', 'published');
      
      if (pagesError) throw pagesError;
      
      // Count pages for each category (including descendants)
      const counts: Record<string, number> = {};
      
      allCategories?.forEach(category => {
        const categoryAndDescendants = getDescendants(category.id);
        counts[category.id] = pages?.filter(page => 
          page.category_id && categoryAndDescendants.includes(page.category_id)
        ).length || 0;
      });
      
      return counts;
    },
  });

  // Get total count for "All" category
  const { data: totalPages } = useQuery({
    queryKey: ['total-pages'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 relative overflow-hidden" id="categories">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Browse Free Coloring Pages by Category
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
            Choose from animals, holidays, characters, educational themes, and more - All carefully organized for easy discovery!
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading categories...
            </div>
          ) : categories && categories.length > 0 ? (
            <>
              {categories.map((category, index) => {
                // Use totalPages for "All" category, otherwise use category count
                const pageCount = category.slug === 'all' 
                  ? totalPages 
                  : (categoryCounts?.[category.id] || 0);
                
                return (
                  <Link 
                    key={category.id} 
                    to={`/category/${category.path}`}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Card
                      className={cn(
                        "category-card group cursor-pointer overflow-hidden border-2 transition-all duration-500 hover:shadow-glow active:scale-95 touch-manipulation backdrop-blur-sm h-full min-h-[120px] sm:min-h-[140px]",
                        selectedCategory === category.name
                          ? "border-primary bg-primary/10 shadow-colorful scale-105"
                          : "shadow-soft hover:border-primary/60 hover:-translate-y-2"
                      )}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        {category.icon?.startsWith('http') ? (
                          <>
                            <img 
                              src={category.icon} 
                              alt={`Free printable ${category.name.toLowerCase()} coloring pages - ${pageCount} designs available for kids and adults to download and print`}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-primary/80 group-hover:via-primary/40 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 text-white transform transition-transform duration-300 group-hover:translate-y-0">
                              <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg mb-0.5 sm:mb-1 drop-shadow-lg line-clamp-2">{category.name}</h3>
                              {pageCount > 0 && (
                                <p className="text-[10px] sm:text-xs opacity-90 drop-shadow">
                                  {pageCount} pages
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 gradient-card relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-1.5 sm:mb-2 md:mb-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 filter drop-shadow-lg relative z-10">
                              {category.icon}
                            </div>
                            <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg text-center relative z-10 group-hover:text-primary transition-colors line-clamp-2">{category.name}</h3>
                            {pageCount > 0 && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 relative z-10 group-hover:text-primary/80 transition-colors">
                                {pageCount} pages
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No categories available
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
