import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Download, Undo, Trash2, ZoomIn, ZoomOut, Maximize, Move } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      // Load background image
      console.log('Loading background image from:', imageUrl);
      const img = new Image();
      
      // Try loading without CORS first
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
        
        // Save initial state
        saveToHistory(ctx, canvas);
        
        toast.success("Canvas ready! Start coloring!");
      };
      
      img.onerror = (error) => {
        console.error("Failed to load background image:", error);
        console.error("Image URL:", imageUrl);
        
        // Try again with CORS if first attempt failed
        if (!img.crossOrigin) {
          console.log("Retrying with CORS enabled...");
          const img2 = new Image();
          img2.crossOrigin = "anonymous";
          
          img2.onload = () => {
            console.log("Background image loaded with CORS");
            backgroundImageRef.current = img2;
            
            const scale = Math.min(canvas.width / img2.width, canvas.height / img2.height);
            const x = (canvas.width - img2.width * scale) / 2;
            const y = (canvas.height - img2.height * scale) / 2;
            
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img2, x, y, img2.width * scale, img2.height * scale);
            
            saveToHistory(ctx, canvas);
            toast.success("Canvas ready! Start coloring!");
          };
          
          img2.onerror = () => {
            console.error("Failed to load image even with CORS");
            toast.error("Failed to load image. Please try again later.");
          };
          
          img2.src = imageUrl;
        } else {
          toast.error("Failed to load image. Please try again later.");
        }
      };
      
      img.src = imageUrl;
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
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (isPanning) {
      setLastPanPoint({ x, y });
      return;
    }
    
    setIsDrawing(true);
    const canvasX = (x - panOffset.x) / zoom;
    const canvasY = (y - panOffset.y) / zoom;
    
    context.beginPath();
    context.moveTo(canvasX, canvasY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (isPanning) {
      const dx = x - lastPanPoint.x;
      const dy = y - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x, y });
      return;
    }
    
    if (!isDrawing) return;
    
    const canvasX = (x - panOffset.x) / zoom;
    const canvasY = (y - panOffset.y) / zoom;
    
    context.strokeStyle = isEraser ? "#ffffff" : activeColor;
    context.lineWidth = brushSize;
    context.lineTo(canvasX, canvasY);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (context && canvasRef.current && isDrawing) {
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

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.1, zoom * delta), 5);
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoom);
    
    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom * 0.8, 0.1);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success("Entered fullscreen mode");
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
        toast.error("Failed to enter fullscreen");
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        toast.success("Exited fullscreen mode");
      });
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
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onOpenChange(false);
  };

  // Render canvas with zoom and pan
  useEffect(() => {
    if (!canvasRef.current || !context) return;
    
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Save current drawing
    tempCtx.drawImage(canvas, 0, 0);
    
    // Clear and redraw with transform
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan
    context.translate(panOffset.x, panOffset.y);
    context.scale(zoom, zoom);
    
    // Draw background image
    if (backgroundImageRef.current) {
      const img = backgroundImageRef.current;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / zoom - img.width * scale) / 2;
      const y = (canvas.height / zoom - img.height * scale) / 2;
      context.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
    
    // Draw previous strokes
    context.drawImage(tempCanvas, 0, 0);
    
    context.restore();
  }, [zoom, panOffset, context]);

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
          <div className="space-y-3 sm:space-y-4" ref={containerRef}>
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
                  variant={isPanning ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPanning(!isPanning)}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Pan mode"
                >
                  <Move className="h-4 w-4" />
                </Button>

                <Button
                  variant={isEraser ? "default" : "outline"}
                  size="sm"
                  onClick={handleEraserToggle}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                >
                  <Eraser className="h-4 w-4" />
                </Button>

                <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomIn}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomOut}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetView}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation text-xs"
                  title="Reset view"
                >
                  1:1
                </Button>

                <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />

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

                <div className="h-6 sm:h-8 w-px bg-border hidden sm:block" />

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleFullscreen}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Fullscreen"
                >
                  <Maximize className="h-4 w-4" />
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
                className="max-w-full"
                style={{ cursor: isPanning ? 'grab' : 'crosshair' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onWheel={handleWheel}
              />
            </div>
            
            {/* Zoom indicator */}
            <div className="text-xs text-muted-foreground text-center">
              Zoom: {Math.round(zoom * 100)}% | Use mouse wheel to zoom, drag to pan
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
