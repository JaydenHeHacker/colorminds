import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColoringCard } from "./ColoringCard";
import { Loader2 } from "lucide-react";

interface RecommendedPagesProps {
  currentPageId: string;
  category?: string;
  difficulty?: string;
}

export const RecommendedPages = ({ currentPageId, category, difficulty }: RecommendedPagesProps) => {
  const { data: recommendedPages, isLoading } = useQuery({
    queryKey: ['recommended-pages', currentPageId, category, difficulty],
    queryFn: async () => {
      // Fetch similar pages based on category and difficulty
      let query = supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('status', 'published')
        .neq('id', currentPageId)
        .limit(4);

      // Prioritize same category
      if (category) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      // Also match difficulty if provided
      if (difficulty && (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard')) {
        query = query.eq('difficulty', difficulty);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If we have less than 4 results, fetch more without strict filtering
      if (data && data.length < 4) {
        const { data: moreData } = await supabase
          .from('coloring_pages')
          .select(`
            *,
            categories (
              name,
              slug
            )
          `)
          .eq('status', 'published')
          .neq('id', currentPageId)
          .limit(4 - data.length)
          .order('download_count', { ascending: false });
        
        if (moreData) {
          return [...data, ...moreData];
        }
      }
      
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recommendedPages || recommendedPages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold">You Might Also Like</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedPages.map((page) => (
          <ColoringCard
            key={page.id}
            id={page.id}
            slug={page.slug}
            title={page.title}
            image={page.image_url}
            category={page.categories?.name || 'Uncategorized'}
            difficulty={page.difficulty as "easy" | "medium" | "hard"}
            seriesId={page.series_id}
            seriesTitle={page.series_title}
            seriesOrder={page.series_order}
            seriesTotal={page.series_total}
          />
        ))}
      </div>
    </div>
  );
};
