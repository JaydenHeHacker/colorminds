import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Download, Undo, Trash2 } from "lucide-react";
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
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize canvas and load background image
  useEffect(() => {
    console.log('useEffect triggered, open:', open, 'canvasRef.current:', !!canvasRef.current);
    
    if (!open) {
      console.log('Dialog not open, skipping initialization');
      return;
    }
    
    // Add a small delay to ensure canvas element is mounted
    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) {
        console.log('Canvas ref still not available after delay');
        return;
      }

      console.log('Starting canvas initialization...');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      
      if (!ctx) {
        console.error("Failed to get canvas context");
        return;
      }

      console.log('Canvas context obtained successfully');

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;
      
      // Set initial drawing settings
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      setContext(ctx);

      // Load background image via fetch to handle CORS properly
      console.log('Loading background image from:', imageUrl);
      
      // Use fetch to load image with proper CORS handling
      fetch(imageUrl)
        .then(response => {
          console.log('Fetch response status:', response.status);
          console.log('Fetch response headers:', {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'content-type': response.headers.get('content-type')
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          console.log('Image blob loaded, size:', blob.size);
          const img = new Image();
          const objectUrl = URL.createObjectURL(blob);
          
          img.onload = () => {
            console.log("Background image loaded successfully, size:", img.width, 'x', img.height);
            backgroundImageRef.current = img;
            
            // Calculate scale to fit canvas
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;
            
            // Draw background image
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            
            // Clean up object URL
            URL.revokeObjectURL(objectUrl);
            
            // Save initial state
            saveToHistory(ctx, canvas);
            
            toast.success("Canvas ready! Start coloring!");
          };
          
          img.onerror = () => {
            console.error("Failed to load image from blob");
            URL.revokeObjectURL(objectUrl);
            toast.error("Failed to load image from blob");
          };
          
          img.src = objectUrl;
        })
        .catch(error => {
          console.error("Failed to fetch background image:", error);
          console.error("Image URL:", imageUrl);
          toast.error("Failed to load image. CORS or network error.");
        });
    }, 100); // 100ms delay to wait for DOM

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      setContext(null);
      setDrawingHistory([]);
      backgroundImageRef.current = null;
    };
  }, [open, imageUrl]);

  const saveToHistory = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory(prev => [...prev, imageData]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    context.strokeStyle = isEraser ? "#ffffff" : activeColor;
    context.lineWidth = brushSize;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (context && canvasRef.current) {
      context.closePath();
      saveToHistory(context, canvasRef.current);
    }
  };

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    setIsEraser(false);
  };

  const handleEraserToggle = () => {
    setIsEraser(!isEraser);
  };

  const handleClear = () => {
    if (!context || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const img = backgroundImageRef.current;
    
    // Clear canvas
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw background image if available
    if (img) {
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;
      context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
    
    setDrawingHistory([]);
    saveToHistory(context, canvas);
    toast.success("Canvas cleared!");
  };

  const handleUndo = () => {
    if (!context || !canvasRef.current || drawingHistory.length <= 1) return;
    
    const newHistory = [...drawingHistory];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];
    
    if (previousState) {
      context.putImageData(previousState, 0, 0);
      setDrawingHistory(newHistory);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready');
      return;
    }
    
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
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
                  disabled={drawingHistory.length <= 1}
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
              <canvas 
                ref={canvasRef}
                className="max-w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
