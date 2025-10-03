import { Button } from "@/components/ui/button";
import { Download, Palette } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const { data: stats } = useQuery({
    queryKey: ['site-stats'],
    queryFn: async () => {
      const [pagesCount, categoriesCount] = await Promise.all([
        supabase.from('coloring_pages').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalPages: pagesCount.count || 0,
        totalCategories: categoriesCount.count || 0,
      };
    },
  });

  const scrollToCategories = () => {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPopular = () => {
    document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-12 md:py-20 lg:py-24">
      <div className="absolute inset-0 gradient-soft opacity-50" />
      
      <div className="container relative z-10 px-4">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Free Printable Coloring Pages
              <span className="block bg-clip-text text-transparent gradient-rainbow">
                for Kids & Adults
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl">
              Discover thousands of <strong>free printable coloring pages</strong> perfect for all ages. Download instantly and print at home—featuring animals, holidays, fantasy characters, and exclusive AI-generated story series!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button 
                size="lg" 
                className="gap-2 shadow-colorful w-full sm:w-auto"
                onClick={scrollToCategories}
              >
                <Download className="h-5 w-5" />
                Browse Collection
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 w-full sm:w-auto"
                onClick={scrollToPopular}
              >
                <Palette className="h-5 w-5" />
                Popular Pages
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="text-xl md:text-2xl font-bold text-primary">{stats?.totalPages || '500+'}+</span>
                <span className="text-xs md:text-sm text-muted-foreground">Pages</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="text-xl md:text-2xl font-bold text-primary">{stats?.totalCategories || '10+'}+</span>
                <span className="text-xs md:text-sm text-muted-foreground">Categories</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <span className="text-xl md:text-2xl font-bold text-primary">100%</span>
                <span className="text-xs md:text-sm text-muted-foreground">Free</span>
              </div>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="aspect-video rounded-3xl overflow-hidden shadow-colorful">
              <img
                src={heroBanner}
                alt="Colorful coloring pages and art supplies"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
