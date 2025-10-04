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
      
      // Build query
      let query = supabase
        .from("user_artwork")
        .select("*")
        .eq("is_public", true);

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
    toast({
      title: "Success",
      description: "Your artwork has been uploaded!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Community Gallery
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
              Discover amazing colored artworks from our creative community
            </p>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={() => setIsUploadOpen(true)}
                size="lg"
                className="w-full sm:w-auto h-11 sm:h-10 touch-manipulation"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Your Artwork
              </Button>

              <Select value={sortBy} onValueChange={(value: "recent" | "popular") => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
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
