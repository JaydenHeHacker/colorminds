import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export const Categories = ({ selectedCategory, onCategorySelect }: CategoriesProps) => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="py-12 md:py-16 lg:py-20" id="categories">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Browse by Category
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Find the perfect coloring page from our wide range of categories
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
                onClick={() => onCategorySelect(null)}
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
                 </div>
               </Card>
               {categories.map((category) => (
                 <Card
                   key={category.id}
                   onClick={() => onCategorySelect(category.name)}
                   className={cn(
                     "group cursor-pointer overflow-hidden border-2 transition-smooth shadow-sm hover:shadow-colorful active:scale-95 touch-manipulation",
                     selectedCategory === category.name
                       ? "border-primary bg-primary/5"
                       : "hover:border-primary/50"
                   )}
                 >
                   <div className="aspect-square flex flex-col items-center justify-center p-4 md:p-6 gradient-card">
                     <div className="text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4 transition-smooth group-hover:scale-110">
                       {category.icon}
                     </div>
                     <h3 className="font-semibold text-sm md:text-base lg:text-lg text-center">{category.name}</h3>
                   </div>
                 </Card>
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
