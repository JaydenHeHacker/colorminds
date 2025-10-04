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
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            AI Coloring Inspiration
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Get creative coloring ideas for "{pageTitle}" with different styles
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4 sm:space-y-6 p-1">
            {/* Style Selection */}
            {!generatedImage && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                {COLOR_STYLES.map((style) => (
                  <Button
                    key={style.id}
                    variant={selectedStyle === style.id ? "default" : "outline"}
                    className="h-auto flex-col items-start p-3 sm:p-4 gap-0.5 sm:gap-1 text-left touch-manipulation"
                    onClick={() => handleGenerateInspiration(style.id)}
                    disabled={isGenerating}
                  >
                    <span className="font-semibold text-xs sm:text-sm">{style.label}</span>
                    <span className="text-[10px] sm:text-xs opacity-80 font-normal">
                      {style.description}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-3 sm:gap-4">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                  Generating {selectedStyle} style inspiration...
                </p>
              </div>
            )}

            {/* Generated Result */}
            {generatedImage && !isGenerating && (
              <div className="space-y-3 sm:space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img 
                    src={generatedImage} 
                    alt={`${selectedStyle} coloring inspiration`}
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={() => {
                      setGeneratedImage(null);
                      setSelectedStyle(null);
                    }}
                    variant="outline"
                    className="flex-1 h-11 sm:h-10 touch-manipulation"
                  >
                    Try Another Style
                  </Button>
                  <Button 
                    onClick={handleClose}
                    className="flex-1 h-11 sm:h-10 touch-manipulation"
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
