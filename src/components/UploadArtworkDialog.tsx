import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2 } from "lucide-react";

interface UploadArtworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UploadArtworkDialog = ({ open, onOpenChange, onSuccess }: UploadArtworkDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your artwork",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication required",
          description: "Please log in to upload artwork",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Upload to R2 using edge function
      const fileExt = file.name.split('.').pop();
      const fileName = `user-artwork-${user.id}-${Date.now()}.${fileExt}`;
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            
            const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-r2', {
              body: {
                file: base64Data,
                fileName,
                contentType: file.type,
              },
            });

            if (uploadError) throw uploadError;

            // Save artwork metadata to database
            const { error: dbError } = await supabase
              .from('user_artwork')
              .insert({
                user_id: user.id,
                title: title.trim(),
                description: description.trim() || null,
                image_url: uploadData.url,
              });

            if (dbError) throw dbError;

            // Reset form
            setTitle("");
            setDescription("");
            setFile(null);
            setPreview("");
            
            onSuccess();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(reader.error);
      });

    } catch (error: any) {
      console.error("Error uploading artwork:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload artwork. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Upload Your Artwork</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Share your colored masterpiece with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm sm:text-base">Artwork Image *</Label>
            {preview ? (
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setFile(null);
                    setPreview("");
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors bg-muted/20"
              >
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2 sm:mb-3" />
                <span className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                  Click to upload image<br />
                  (max 5MB, JPG/PNG)
                </span>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm sm:text-base">Title *</Label>
            <Input
              id="title"
              placeholder="Give your artwork a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={100}
              className="h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm sm:text-base">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your artwork..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              maxLength={500}
              rows={3}
              className="resize-none text-sm sm:text-base"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 sm:h-12 text-base sm:text-lg touch-manipulation"
            disabled={uploading || !title.trim() || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Artwork
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadArtworkDialog;
