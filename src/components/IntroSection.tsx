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
              Free Coloring Pages for Kids and Adults - Print & Download Instantly
            </h2>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Welcome to Color Minds, your ultimate destination for <strong>free printable coloring pages for kids</strong> and adults. 
              Our ever-growing library features high-quality <strong>coloring pages printable</strong> designs—from easy <strong>coloring pages for toddlers</strong> to intricate <strong>adult coloring pages</strong> for advanced colorists. 
              Whether you need <strong>coloring pages for girls</strong>, <strong>coloring pages for boys</strong>, or <strong>coloring pages for teens</strong>, we have something special for everyone.
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Browse our extensive collection featuring popular themes: <strong>animal coloring pages</strong> (cats, dogs, dinosaurs, unicorns), <strong>holiday coloring pages</strong> (Christmas, Halloween, Easter, Thanksgiving), 
              <strong>Disney coloring pages</strong>, <strong>princess coloring pages</strong>, and beloved characters like Hello Kitty, Sonic, Pokemon, and more. 
              We also offer exclusive <strong>AI-generated story series</strong> that combine creativity with storytelling. Each <strong>free coloring page</strong> is carefully crafted to provide hours of relaxing, educational fun. 
              Simply browse, download instantly, and <strong>print coloring pages</strong> at home—completely free with no sign-up required!
            </p>
            
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Perfect for classrooms, homeschooling, rainy days, birthday parties, or quiet time, our <strong>printable coloring sheets</strong> help develop fine motor skills, 
              hand-eye coordination, color recognition, and encourage creativity while providing screen-free entertainment. Teachers and parents love our <strong>easy coloring pages</strong> for early learners 
              and <strong>cute coloring pages</strong> that keep children engaged. Start exploring today!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
