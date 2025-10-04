import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface ArtworkCardProps {
  artwork: {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    likes_count: number;
    created_at: string;
    user_liked: boolean;
  };
  onLikeToggle: (artworkId: string, currentlyLiked: boolean) => void;
  isOwnArtwork?: boolean;
}

const ArtworkCard = ({ artwork, onLikeToggle, isOwnArtwork = false }: ArtworkCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("user_artwork")
        .delete()
        .eq("id", artwork.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Artwork deleted successfully",
      });
      
      // Reload page to refresh gallery
      window.location.reload();
    } catch (error: any) {
      console.error("Error deleting artwork:", error);
      toast({
        title: "Error",
        description: "Failed to delete artwork",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-muted/50">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          
          {/* Like Button Overlay */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Button
              size="icon"
              variant={artwork.user_liked ? "default" : "secondary"}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg touch-manipulation transition-all",
                artwork.user_liked && "bg-red-500 hover:bg-red-600"
              )}
              onClick={() => onLikeToggle(artwork.id, artwork.user_liked)}
            >
              <Heart
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 transition-all",
                  artwork.user_liked && "fill-current"
                )}
              />
            </Button>
          </div>

          {/* Delete Button for Own Artwork */}
          {isOwnArtwork && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <Button
                size="icon"
                variant="destructive"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg touch-manipulation"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 line-clamp-1">
            {artwork.title}
          </h3>
          
          {artwork.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
              {artwork.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Heart className="h-3 w-3 mr-1" />
              {artwork.likes_count} {artwork.likes_count === 1 ? "like" : "likes"}
            </Badge>

            <span className="text-xs text-muted-foreground">
              {new Date(artwork.created_at).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artwork</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this artwork? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ArtworkCard;
