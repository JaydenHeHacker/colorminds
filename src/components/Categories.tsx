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
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('level', 1)  // Only show top-level categories
        .order('order_position', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get page counts for each category
  const { data: categoryCounts } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('category_id');
      
      if (error) throw error;
      
      // Count pages per category
      const counts: Record<string, number> = {};
      data.forEach(page => {
        if (page.category_id) {
          counts[page.category_id] = (counts[page.category_id] || 0) + 1;
        }
      });
      
      return counts;
    },
  });

  const { data: totalPages } = useQuery({
    queryKey: ['total-pages'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <section className="py-12 md:py-16 lg:py-20" id="categories">
      <div className="container px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Browse Categories
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Find the perfect coloring page from our rich variety of categories
            </p>
          </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading categories...
            </div>
          ) : categories && categories.length > 0 ? (
            <>
                <Card
                onClick={() => {
                  onCategorySelect(null);
                  scrollToTop();
                }}
                 className={cn(
                   "group cursor-pointer overflow-hidden border-2 transition-smooth shadow-sm hover:shadow-colorful active:scale-95 touch-manipulation",
                   selectedCategory === null
                     ? "border-primary bg-primary/5"
                     : "hover:border-primary/50"
                 )}
               >
                 <div className="aspect-square flex flex-col items-center justify-center p-4 md:p-6 gradient-card">
                   <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 transition-smooth group-hover:scale-110">
                     🎨
                   </div>
                   <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center">All</h3>
                   {totalPages && (
                     <p className="text-xs text-muted-foreground mt-1">
                       {totalPages} pages
                     </p>
                   )}
                 </div>
               </Card>
                 {categories.map((category) => (
                   <Link key={category.id} to={`/category/${category.path}`}>
                     <Card
                      className={cn(
                        "group cursor-pointer overflow-hidden border-2 transition-smooth shadow-sm hover:shadow-colorful active:scale-95 touch-manipulation",
                        selectedCategory === category.name
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                    >
                      <div className="aspect-square relative overflow-hidden">
                        {category.icon?.startsWith('http') ? (
                          <>
                            <img 
                              src={category.icon} 
                              alt={category.name} 
                              className="w-full h-full object-cover transition-smooth group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                              <h3 className="font-semibold text-sm md:text-base lg:text-lg mb-1">{category.name}</h3>
                              {categoryCounts && categoryCounts[category.id] && (
                                <p className="text-xs opacity-90">
                                  {categoryCounts[category.id]} pages
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 gradient-card">
                            <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 transition-smooth group-hover:scale-110">
                              {category.icon}
                            </div>
                            <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center">{category.name}</h3>
                            {categoryCounts && categoryCounts[category.id] && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {categoryCounts[category.id]} pages
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
               ))}
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
