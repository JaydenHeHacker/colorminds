import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const IntroSection = () => {
  const { data: stats } = useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const [pagesCount, categoriesCount] = await Promise.all([
        supabase.from('coloring_pages').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalPages: pagesCount.count || 0,
        totalCategories: categoriesCount.count || 0,
      };
    },
  });

  return (
    <section className="py-12 bg-gradient-soft border-y">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-2xl font-bold text-primary">{stats?.totalPages || '500+'}+</span>
              <span className="text-sm text-muted-foreground">Free Pages</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-2xl font-bold text-primary">{stats?.totalCategories || '10+'}+</span>
              <span className="text-sm text-muted-foreground">Categories</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-2xl font-bold text-primary">100%</span>
              <span className="text-sm text-muted-foreground">Free</span>
            </div>
          </div>
          
          <div className="space-y-4 text-left md:text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              Welcome to Color Minds - Your Ultimate Free Coloring Pages Collection
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Discover an ever-growing library of high-quality, <strong>free printable coloring pages</strong> perfect for kids, adults, teachers, and parents. 
              Whether you're looking for simple designs for toddlers or intricate patterns for advanced colorists, Color Minds offers something special for everyone.
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Our collection features <strong>animals, nature scenes, holiday themes, fantasy characters,</strong> and exclusive <strong>AI-generated story series</strong> that 
              combine creativity with storytelling. Each coloring page is carefully crafted to provide hours of relaxing, educational fun. Simply browse our categories, 
              download your favorite designs instantly, and print them at home—completely free with no sign-up required!
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Perfect for classrooms, rainy days, birthday parties, or quiet time, our <strong>printable coloring sheets</strong> help develop fine motor skills, 
              encourage creativity, and provide screen-free entertainment. Start exploring our diverse collection today and unleash your inner artist!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
