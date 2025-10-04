import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import * as fabric from "fabric";
import { Paintbrush, Eraser, Download, Undo, Redo, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OnlineColoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  pageTitle: string;
}

const COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  "#FFC0CB", "#A52A2A", "#808080", "#FFD700", "#4B0082"
];

export const OnlineColoringDialog = ({ 
  open, 
  onOpenChange, 
  imageUrl,
  pageTitle 
}: OnlineColoringDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (!open || !canvasRef.current || fabricCanvas) return;

    console.log('Initializing canvas...');
    
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    console.log('Canvas created successfully');
    
    // Enable drawing mode first to initialize the brush
    canvas.isDrawingMode = true;
    
    // Now initialize brush properties
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
      console.log('Brush initialized with color:', activeColor, 'size:', brushSize);
      console.log('Drawing mode enabled:', canvas.isDrawingMode);
    } else {
      console.error('Brush not available after enabling drawing mode');
    }

    // Load the coloring page image as background
    const loadImage = async () => {
      try {
        console.log('Loading image with FabricImage.fromURL...');
        
        const fabricImg = await FabricImage.fromURL(imageUrl);
        
        console.log('Fabric image loaded:', fabricImg.width, 'x', fabricImg.height);
        
        const scale = Math.min(800 / (fabricImg.width || 800), 600 / (fabricImg.height || 600));
        fabricImg.set({
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false
        });
        
        canvas.backgroundImage = fabricImg;
        canvas.renderAll();
        
        console.log('Canvas ready!');
        toast.success('Canvas ready! Start coloring!');
      } catch (err) {
        console.error('Error loading image:', err);
        toast.error('Failed to load coloring page image');
      }
    };

    loadImage();
    setFabricCanvas(canvas);
  }, [open, imageUrl, activeColor, brushSize, fabricCanvas]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!open && fabricCanvas) {
      console.log('Disposing canvas on dialog close');
      fabricCanvas.dispose();
      setFabricCanvas(null);
    }
  }, [open, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;

    if (isEraser) {
      fabricCanvas.freeDrawingBrush.color = "#ffffff";
    } else {
      fabricCanvas.freeDrawingBrush.color = activeColor;
    }
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }, [activeColor, brushSize, isEraser, fabricCanvas]);

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    setIsEraser(false);
  };

  const handleEraserToggle = () => {
    setIsEraser(!isEraser);
  };

  const handleClear = () => {
    if (!fabricCanvas) {
      console.error('Canvas not initialized');
      return;
    }
    console.log('Clearing canvas, objects count:', fabricCanvas.getObjects().length);
    fabricCanvas.getObjects().forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
    toast.success("Canvas cleared!");
  };

  const handleUndo = () => {
    if (!fabricCanvas) {
      console.error('Canvas not initialized');
      return;
    }
    const objects = fabricCanvas.getObjects();
    console.log('Undoing, objects count:', objects.length);
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };

  const handleDownload = () => {
    if (!fabricCanvas) {
      console.error('Canvas not initialized');
      toast.error('Canvas not ready');
      return;
    }
    console.log('Downloading canvas as PNG');
    try {
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      const link = document.createElement('a');
      link.download = `${pageTitle}-colored.png`;
      link.href = dataURL;
      link.click();
      toast.success("Image downloaded!");
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Paintbrush className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Online Coloring - {pageTitle}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Use the tools below to color the page online
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-3 sm:space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted rounded-lg">
              {/* Color Palette */}
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all touch-manipulation ${
                      activeColor === color && !isEraser
                        ? "border-primary scale-110"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>

              <div className="h-6 sm:h-8 w-px bg-border" />

              {/* Brush Size */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 sm:flex-initial">
                <span className="text-xs sm:text-sm whitespace-nowrap">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-16 sm:w-24 touch-manipulation"
                />
                <span className="text-xs sm:text-sm w-6 sm:w-8">{brushSize}</span>
              </div>

              <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />

              {/* Tools */}
              <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                <Button
                  variant={isEraser ? "default" : "outline"}
                  size="sm"
                  onClick={handleEraserToggle}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                >
                  <Eraser className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                >
                  <Undo className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden bg-white touch-manipulation">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
