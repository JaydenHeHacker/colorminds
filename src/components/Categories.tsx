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
    <section className="py-16 md:py-20" id="categories">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect coloring page from our wide range of categories
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading categories...
            </div>
          ) : categories && categories.length > 0 ? (
            <>
              <Card
                onClick={() => onCategorySelect(null)}
                className={cn(
                  "group cursor-pointer overflow-hidden border-2 transition-smooth shadow-sm hover:shadow-colorful",
                  selectedCategory === null
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/50"
                )}
              >
                <div className="aspect-square flex flex-col items-center justify-center p-6 gradient-card">
                  <div className="text-5xl md:text-6xl mb-4 transition-smooth group-hover:scale-110">
                    🎨
                  </div>
                  <h3 className="font-semibold text-lg text-center">All</h3>
                </div>
              </Card>
              {categories.map((category) => (
                <Card
                  key={category.id}
                  onClick={() => onCategorySelect(category.name)}
                  className={cn(
                    "group cursor-pointer overflow-hidden border-2 transition-smooth shadow-sm hover:shadow-colorful",
                    selectedCategory === category.name
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className="aspect-square flex flex-col items-center justify-center p-6 gradient-card">
                    <div className="text-5xl md:text-6xl mb-4 transition-smooth group-hover:scale-110">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg text-center">{category.name}</h3>
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
