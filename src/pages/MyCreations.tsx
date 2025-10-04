import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Image as ImageIcon, BookOpen, Eye, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  created_at: string;
  status: string;
  is_public: boolean;
  cost_type: string;
  categories: {
    name: string;
  };
}

export default function MyCreations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'single' | 'series'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadGenerations();
    }
  }, [user, filter]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to log in to view your creations",
        variant: "destructive",
      });
      navigate("/auth?redirect=/my-creations");
      return;
    }
    setUser(user);
  };

  const loadGenerations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from("ai_generations")
        .select(`
          id,
          prompt,
          image_url,
          created_at,
          status,
          is_public,
          cost_type,
          categories (name)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter by type if needed
      let filteredData = data || [];
      if (filter === 'single') {
        // Single images don't have series in their prompt
        filteredData = filteredData.filter(g => !g.prompt.includes('Scene'));
      } else if (filter === 'series') {
        // Series images have Scene in their prompt
        filteredData = filteredData.filter(g => g.prompt.includes('Scene'));
      }

      setGenerations(filteredData);
    } catch (error: any) {
      console.error("Error loading generations:", error);
      toast({
        title: "Failed to load",
        description: "Unable to load your creations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("ai_generations")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;

      toast({
        title: "Deleted successfully",
        description: "Your creation has been deleted",
      });

      setGenerations(generations.filter(g => g.id !== deletingId));
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast({
        title: "Failed to delete",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleVisibility = async (id: string, currentPublic: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_generations")
        .update({ is_public: !currentPublic })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentPublic ? "Made private" : "Made public",
        description: currentPublic 
          ? "Your creation is now private" 
          : "Your creation is now visible in community",
      });

      setGenerations(generations.map(g => 
        g.id === id ? { ...g, is_public: !currentPublic } : g
      ));
    } catch (error: any) {
      console.error("Error updating visibility:", error);
      toast({
        title: "Failed to update",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-primary" />
              My AI Creations
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage all your AI-generated coloring pages
            </p>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">
                All ({generations.length})
              </TabsTrigger>
              <TabsTrigger value="single">
                <ImageIcon className="w-4 h-4 mr-2" />
                Single
              </TabsTrigger>
              <TabsTrigger value="series">
                <BookOpen className="w-4 h-4 mr-2" />
                Series
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {generations.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No creations yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating amazing coloring pages with AI
              </p>
              <Button onClick={() => navigate("/create")}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Now
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generations.map((gen) => (
                <Card 
                  key={gen.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div 
                    className="relative aspect-square bg-muted"
                    onClick={() => navigate(`/my-creations/${gen.id}`)}
                  >
                    <img
                      src={gen.image_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 text-sm flex-1">
                        {gen.prompt}
                      </h3>
                      <Badge variant="outline" className="shrink-0">
                        {gen.categories.name}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(gen.created_at), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <Badge variant={gen.cost_type === 'monthly_quota' ? 'default' : 'secondary'} className="text-xs">
                        {gen.cost_type === 'monthly_quota' ? 'Quota' : 'Credits'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggleVisibility(gen.id, gen.is_public)}
                      >
                        {gen.is_public ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(gen.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your creation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
