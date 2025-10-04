import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/Pagination";

export default function Community() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 24;

  useEffect(() => {
    loadCommunityGenerations();
  }, [currentPage]);

  const loadCommunityGenerations = async () => {
    // Get total count
    const { count } = await supabase
      .from("ai_generations")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true)
      .eq("status", "completed");
    
    setTotalCount(count || 0);

    // Get paginated data
    const { data, error } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("is_public", true)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .range(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage - 1);

    if (!error && data) {
      // Fetch profiles for all generations
      const userIds = [...new Set(data.map(g => g.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);
      
      // Merge profile data with generations
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const enrichedData = data.map(gen => ({
        ...gen,
        profile: profileMap.get(gen.user_id)
      }));
      
      setGenerations(enrichedData);
    }

    if (error) {
      console.error("Error loading community generations:", error);
      toast({
        title: "Failed to load",
        description: "Unable to load community creations",
        variant: "destructive",
      });
      setGenerations([]);
    }
    setLoading(false);
  };

  const handlePageChange = (selectedItem: { selected: number }) => {
    setCurrentPage(selectedItem.selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUserDisplayName = (gen: any) => {
    if (gen.profile?.email) {
      return gen.profile.email.split('@')[0];
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const pageCount = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">AI Gallery</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse AI-generated coloring page templates created by our community. 
            Download and print any design you like!
          </p>
        </div>

        {/* Notice */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">About AI Gallery</p>
              <p className="text-muted-foreground">
                These are AI-generated coloring page templates. Free users' creations are automatically shared with the community. 
                <span className="text-primary font-medium"> Upgrade to Premium</span> to keep your creations private.
              </p>
            </div>
          </div>
        </Card>

        {/* Generations Grid */}
        {generations.length === 0 ? (
          <Card className="p-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No community creations yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first creator and share your work!
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generations.map((gen) => (
                <Card 
                  key={gen.id} 
                  className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/ai-coloring-page/${gen.id}`)}
                >
                  {/* Image */}
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {gen.image_url ? (
                      <img
                        src={gen.image_url}
                        alt={gen.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-sm line-clamp-2 mb-2">{gen.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>By {getUserDisplayName(gen)}</span>
                      <span>
                        {new Date(gen.created_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <Pagination
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}
