import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ColorInspirationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  pageTitle: string;
}

const COLOR_STYLES = [
  { id: "watercolor", label: "Watercolor", description: "Soft blends and transitions" },
  { id: "pencil", label: "Colored Pencil", description: "Textured and shaded" },
  { id: "marker", label: "Marker", description: "Bold and vibrant" },
  { id: "pastel", label: "Pastel", description: "Gentle and dreamy" },
  { id: "realistic", label: "Realistic", description: "Natural colors" },
  { id: "cartoon", label: "Cartoon", description: "Bright and fun" }
];

export const ColorInspirationDialog = ({ 
  open, 
  onOpenChange, 
  imageUrl,
  pageTitle 
}: ColorInspirationDialogProps) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateInspiration = async (style: string) => {
    setIsGenerating(true);
    setSelectedStyle(style);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-color-inspiration', {
        body: { imageUrl, style }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success("AI coloring inspiration generated!");
      } else {
        throw new Error("No image generated");
      }
    } catch (error: any) {
      console.error('Error generating inspiration:', error);
      
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("Insufficient credits. Please add more credits.");
      } else {
        toast.error("Failed to generate inspiration. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedStyle(null);
    setGeneratedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Coloring Inspiration
          </DialogTitle>
          <DialogDescription>
            Get creative coloring ideas for "{pageTitle}" with different styles
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Style Selection */}
            {!generatedImage && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {COLOR_STYLES.map((style) => (
                  <Button
                    key={style.id}
                    variant={selectedStyle === style.id ? "default" : "outline"}
                    className="h-auto flex-col items-start p-4 gap-1"
                    onClick={() => handleGenerateInspiration(style.id)}
                    disabled={isGenerating}
                  >
                    <span className="font-semibold">{style.label}</span>
                    <span className="text-xs opacity-80 font-normal">
                      {style.description}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating {selectedStyle} style inspiration...
                </p>
              </div>
            )}

            {/* Generated Result */}
            {generatedImage && !isGenerating && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img 
                    src={generatedImage} 
                    alt={`${selectedStyle} coloring inspiration`}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setGeneratedImage(null);
                      setSelectedStyle(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Another Style
                  </Button>
                  <Button 
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
