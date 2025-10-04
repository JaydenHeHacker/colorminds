import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ArtworkCard from "@/components/ArtworkCard";
import UploadArtworkDialog from "@/components/UploadArtworkDialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  user_liked: boolean;
}

const UserGallery = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("popular");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadArtworks();
    checkUser();
  }, [sortBy]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Build query - only approved artworks visible to public
      let query = supabase
        .from("user_artwork")
        .select("*");

      // Sort by selection
      if (sortBy === "popular") {
        query = query.order("likes_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data: artworkData, error: artworkError } = await query;

      if (artworkError) throw artworkError;

      // Check which artworks the current user has liked
      if (user && artworkData) {
        const artworkIds = artworkData.map((a) => a.id);
        const { data: likesData } = await supabase
          .from("artwork_likes")
          .select("artwork_id")
          .eq("user_id", user.id)
          .in("artwork_id", artworkIds);

        const likedIds = new Set(likesData?.map((l) => l.artwork_id) || []);

        setArtworks(
          artworkData.map((artwork) => ({
            ...artwork,
            user_liked: likedIds.has(artwork.id),
          }))
        );
      } else {
        setArtworks(
          (artworkData || []).map((artwork) => ({
            ...artwork,
            user_liked: false,
          }))
        );
      }
    } catch (error: any) {
      console.error("Error loading artworks:", error);
      toast({
        title: "Error",
        description: "Failed to load artworks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (artworkId: string, currentlyLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like artworks",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("artwork_likes")
          .delete()
          .eq("artwork_id", artworkId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("artwork_likes")
          .insert({ artwork_id: artworkId, user_id: user.id });

        if (error) throw error;
      }

      // Update local state
      setArtworks(artworks.map(artwork => 
        artwork.id === artworkId
          ? {
              ...artwork,
              likes_count: currentlyLiked ? artwork.likes_count - 1 : artwork.likes_count + 1,
              user_liked: !currentlyLiked,
            }
          : artwork
      ));
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    loadArtworks();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Color Showcase
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg">
                  See how others brought coloring pages to life with their creativity and colors
                </p>
              </div>
              
              <Button
                onClick={() => setIsUploadOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4">
              <Select value={sortBy} onValueChange={(value: "recent" | "popular") => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Upload Button */}
              <Button
                onClick={() => setIsUploadOpen(true)}
                variant="outline"
                size="sm"
                className="sm:hidden"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!loading && artworks.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-4">
                No artworks yet. Be the first to share your creation!
              </p>
              <Button onClick={() => setIsUploadOpen(true)} size="lg">
                <Upload className="mr-2 h-4 w-4" />
                Upload Artwork
              </Button>
            </div>
          )}

          {/* Gallery Grid */}
          {!loading && artworks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {artworks.map((artwork) => (
                <ArtworkCard
                  key={artwork.id}
                  artwork={artwork}
                  onLikeToggle={handleLikeToggle}
                  isOwnArtwork={artwork.user_id === currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <UploadArtworkDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default UserGallery;
