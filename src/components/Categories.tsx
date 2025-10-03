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

  // Get sample images for "All" card
  const { data: sampleImages } = useQuery({
    queryKey: ['sample-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('image_url')
        .limit(4);
      
      if (error) throw error;
      return data.map(page => page.image_url);
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
    <section className="py-12 md:py-16 lg:py-20 relative overflow-hidden" id="categories">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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
                   "category-card group cursor-pointer overflow-hidden border-2 transition-all duration-500 hover:shadow-glow active:scale-95 touch-manipulation backdrop-blur-sm",
                   selectedCategory === null
                     ? "border-primary bg-primary/10 shadow-colorful scale-105"
                     : "shadow-soft hover:border-primary/60 hover:-translate-y-2"
                 )}
               >
                 <div className="aspect-square relative overflow-hidden">
                   {sampleImages && sampleImages.length >= 4 ? (
                     <>
                       <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                         {sampleImages.slice(0, 4).map((url, idx) => (
                           <div key={idx} className="relative overflow-hidden">
                             <img 
                               src={url} 
                               alt={`Sample ${idx + 1}`}
                               className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                             />
                           </div>
                         ))}
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-primary/80 group-hover:via-primary/40 transition-all duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                         <div className="text-3xl md:text-4xl mb-2 transition-all duration-300 group-hover:scale-110 filter drop-shadow-lg">
                           🎨
                         </div>
                         <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center drop-shadow-lg">All</h3>
                         {totalPages && (
                           <p className="text-xs opacity-90 mt-1 drop-shadow">
                             {totalPages} pages
                           </p>
                         )}
                       </div>
                     </>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center p-4 md:p-6 gradient-card relative">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                       <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 filter drop-shadow-lg relative z-10">
                         🎨
                       </div>
                       <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center relative z-10 group-hover:text-primary transition-colors">All</h3>
                       {totalPages && (
                         <p className="text-xs text-muted-foreground mt-1 relative z-10 group-hover:text-primary/80 transition-colors">
                           {totalPages} pages
                         </p>
                       )}
                     </div>
                   )}
                 </div>
               </Card>
                  {categories.map((category, index) => (
                   <Link 
                     key={category.id} 
                     to={`/category/${category.path}`}
                     className="animate-fade-in"
                     style={{ animationDelay: `${index * 0.05}s` }}
                   >
                     <Card
                      className={cn(
                        "category-card group cursor-pointer overflow-hidden border-2 transition-all duration-500 hover:shadow-glow active:scale-95 touch-manipulation backdrop-blur-sm h-full",
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
                              alt={category.name} 
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-125 group-hover:rotate-2" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent group-hover:from-primary/80 group-hover:via-primary/40 transition-all duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white transform transition-transform duration-300 group-hover:translate-y-0">
                              <h3 className="font-semibold text-sm md:text-base lg:text-lg mb-1 drop-shadow-lg">{category.name}</h3>
                              {categoryCounts && categoryCounts[category.id] && (
                                <p className="text-xs opacity-90 drop-shadow">
                                  {categoryCounts[category.id]} pages
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 gradient-card relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 filter drop-shadow-lg relative z-10">
                              {category.icon}
                            </div>
                            <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center relative z-10 group-hover:text-primary transition-colors">{category.name}</h3>
                            {categoryCounts && categoryCounts[category.id] && (
                              <p className="text-xs text-muted-foreground mt-1 relative z-10 group-hover:text-primary/80 transition-colors">
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
