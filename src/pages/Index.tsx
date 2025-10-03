import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { ColoringCard } from "@/components/ColoringCard";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        <Categories />
        
        <section className="py-16 md:py-20 bg-muted/30" id="popular">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Popular Coloring Pages
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our most loved and downloaded coloring pages
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Loading coloring pages...
                </div>
              ) : coloringPages && coloringPages.length > 0 ? (
                coloringPages.map((page) => (
                  <ColoringCard
                    key={page.id}
                    title={page.title}
                    image={page.image_url}
                    category={page.categories?.name || 'Uncategorized'}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No coloring pages available yet. Check back soon!
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
