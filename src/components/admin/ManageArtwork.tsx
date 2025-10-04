import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  status: string;
  created_at: string;
  user_id: string;
  admin_notes: string | null;
}

const ManageArtwork = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingArtworks();
  }, []);

  const loadPendingArtworks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_artwork")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setArtworks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (artworkId: string, newStatus: "approved" | "rejected") => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("user_artwork")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", artworkId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Artwork ${newStatus}`,
      });

      setSelectedArtwork(null);
      setAdminNotes("");
      loadPendingArtworks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Artwork Moderation</h2>
        <p className="text-muted-foreground">
          Review and approve user-uploaded artworks
        </p>
      </div>

      {artworks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No pending artworks to review</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Card key={artwork.id} className="overflow-hidden">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold">{artwork.title}</h3>
                  {artwork.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {artwork.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedArtwork(artwork)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setSelectedArtwork(artwork);
                      setAdminNotes("");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Artwork</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedArtwork && (
              <>
                <img
                  src={selectedArtwork.image_url}
                  alt={selectedArtwork.title}
                  className="w-full rounded-lg"
                />
                <div>
                  <h3 className="font-semibold">{selectedArtwork.title}</h3>
                  {selectedArtwork.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedArtwork.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Admin Notes (Optional)
                  </label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this review..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleReview(selectedArtwork.id, "approved")}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleReview(selectedArtwork.id, "rejected")}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageArtwork;
