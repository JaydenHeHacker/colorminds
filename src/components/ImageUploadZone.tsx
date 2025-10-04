import { useState, useCallback } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadZoneProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onRemove: () => void;
  lineComplexity: string;
  onLineComplexityChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  lineWeight: string;
  onLineWeightChange: (value: string) => void;
  backgroundMode: string;
  onBackgroundModeChange: (value: string) => void;
  disabled?: boolean;
}

export const ImageUploadZone = ({
  onImageSelect,
  selectedImage,
  onRemove,
  lineComplexity,
  onLineComplexityChange,
  style,
  onStyleChange,
  lineWeight,
  onLineWeightChange,
  backgroundMode,
  onBackgroundModeChange,
  disabled = false,
}: ImageUploadZoneProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WEBP images only",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload images smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      onImageSelect(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [onImageSelect, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = () => {
    onRemove();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!selectedImage ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          `}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            disabled={disabled}
          />
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center gap-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Upload Your Image</p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP up to 5MB
              </p>
            </div>
          </label>
        </div>
      ) : (
        <Card className="p-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            {selectedImage.name}
          </p>
        </Card>
      )}

      {/* Conversion Options - Only show when image is selected */}
      {selectedImage && (
        <div className="space-y-6">
          {/* Line Complexity */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Line Complexity</Label>
            <RadioGroup value={lineComplexity} onValueChange={onLineComplexityChange}>
              <div className="grid grid-cols-3 gap-3">
                <label className={`
                  flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${lineComplexity === 'simple' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="simple" className="sr-only" />
                  <div className="text-4xl">🎨</div>
                  <span className="font-medium text-sm">Simple</span>
                  <span className="text-xs text-muted-foreground text-center">Ages 3-5</span>
                </label>
                
                <label className={`
                  flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${lineComplexity === 'medium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="medium" className="sr-only" />
                  <div className="text-4xl">🖍️</div>
                  <span className="font-medium text-sm">Medium</span>
                  <span className="text-xs text-muted-foreground text-center">Ages 6-8</span>
                </label>
                
                <label className={`
                  flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${lineComplexity === 'detailed' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="detailed" className="sr-only" />
                  <div className="text-4xl">✏️</div>
                  <span className="font-medium text-sm">Detailed</span>
                  <span className="text-xs text-muted-foreground text-center">Ages 9+</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Style */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Style Conversion</Label>
            <RadioGroup value={style} onValueChange={onStyleChange}>
              <div className="space-y-2">
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${style === 'original' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="original" />
                  <div className="flex-1">
                    <div className="font-medium">Keep Original</div>
                    <div className="text-xs text-muted-foreground">Preserve photo style, just convert to line art</div>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${style === 'cartoon' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="cartoon" />
                  <div className="flex-1">
                    <div className="font-medium">Cartoonify</div>
                    <div className="text-xs text-muted-foreground">Transform into cartoon style with fun proportions</div>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${style === 'cute' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="cute" />
                  <div className="flex-1">
                    <div className="font-medium">Cute & Kawaii</div>
                    <div className="text-xs text-muted-foreground">Make it adorable with big eyes and soft features</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Line Weight */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Line Thickness</Label>
            <RadioGroup value={lineWeight} onValueChange={onLineWeightChange}>
              <div className="grid grid-cols-3 gap-3">
                <label className={`
                  flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${lineWeight === 'thick' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="thick" className="sr-only" />
                  <div className="font-bold text-2xl">▬</div>
                  <span className="font-medium text-sm">Thick</span>
                  <span className="text-xs text-muted-foreground">For kids</span>
                </label>
                
                <label className={`
                  flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${lineWeight === 'medium' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="medium" className="sr-only" />
                  <div className="font-bold text-2xl">─</div>
                  <span className="font-medium text-sm">Medium</span>
                  <span className="text-xs text-muted-foreground">Balanced</span>
                </label>
                
                <label className={`
                  flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${lineWeight === 'fine' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="fine" className="sr-only" />
                  <div className="font-bold text-2xl">╌</div>
                  <span className="font-medium text-sm">Fine</span>
                  <span className="text-xs text-muted-foreground">Detailed</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Background</Label>
            <RadioGroup value={backgroundMode} onValueChange={onBackgroundModeChange}>
              <div className="space-y-2">
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${backgroundMode === 'keep' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="keep" />
                  <div className="flex-1">
                    <div className="font-medium">Keep Background</div>
                    <div className="text-xs text-muted-foreground">Include full scene with background elements</div>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${backgroundMode === 'simplify' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="simplify" />
                  <div className="flex-1">
                    <div className="font-medium">Simplify Background</div>
                    <div className="text-xs text-muted-foreground">Keep background but make it simpler</div>
                  </div>
                </label>
                
                <label className={`
                  flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                  ${backgroundMode === 'remove' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}>
                  <RadioGroupItem value="remove" />
                  <div className="flex-1">
                    <div className="font-medium">Remove Background</div>
                    <div className="text-xs text-muted-foreground">Focus only on the main subject</div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </div>
  );
};
