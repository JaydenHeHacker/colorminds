import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ColoringCard } from "@/components/ColoringCard";
import { CreateCTA } from "@/components/CreateCTA";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const Favorites = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: favoritePages, isLoading } = useQuery({
    queryKey: ['favorite-pages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          coloring_page_id,
          coloring_pages!inner (
            id,
            title,
            image_url,
            slug,
            difficulty,
            status,
            series_id,
            series_title,
            series_order,
            series_total,
            categories (
              name,
              slug
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('coloring_pages.status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(fav => fav.coloring_pages).filter(Boolean) || [];
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="gap-2 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-8 w-8 md:h-10 md:w-10 text-primary fill-primary" />
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">My Favorites</h1>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                All your favorite coloring pages in one place
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading your favorites...</p>
              </div>
            ) : favoritePages && favoritePages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {favoritePages.map((page: any) => (
                  <ColoringCard
                    key={page.id}
                    id={page.id}
                    slug={page.slug}
                    title={page.title}
                    image={page.image_url}
                    category={page.categories?.name || 'Uncategorized'}
                    difficulty={page.difficulty || 'medium'}
                    seriesId={page.series_id}
                    seriesTitle={page.series_title}
                    seriesOrder={page.series_order}
                    seriesTotal={page.series_total}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center py-16">
                  <Heart className="h-24 w-24 mx-auto mb-6 opacity-20" />
                  <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Start browsing coloring pages and click the heart icon to save your favorites
                  </p>
                  <Button onClick={() => navigate('/')} className="gap-2">
                    Browse Coloring Pages
                  </Button>
                </div>
                
                {/* AI Creation CTA */}
                <CreateCTA variant="inline" context="favorites" />
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Favorites;
