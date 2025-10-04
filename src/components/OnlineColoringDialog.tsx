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
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [activeColor, setActiveColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
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

      // Load background image with CORS
      console.log('Loading background image from:', imageUrl);
      const img = new Image();
      img.crossOrigin = "anonymous"; // Set CORS before src
      
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
        
        toast.success("Canvas ready! Start coloring!");
      };
      
      img.onerror = (error) => {
        console.error("Failed to load background image:", error);
        console.error("Image URL:", imageUrl);
        toast.error("Failed to load image. Please try again later.");
      };
      
      img.src = imageUrl;
    }, 100); // 100ms delay to wait for DOM

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      setContext(null);
      backgroundImageRef.current = null;
    };
  }, [open, imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    
    if (isPanning) {
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }
    
    setIsDrawing(true);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (isPanning) {
      const dx = clientX - lastPanPoint.x;
      const dy = clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }
    
    if (!isDrawing) return;
    
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    
    context.strokeStyle = isEraser ? "#ffffff" : activeColor;
    context.lineWidth = brushSize / zoom; // Adjust brush size for zoom
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing && !isPanning) return;
    setIsDrawing(false);
    if (context) {
      context.closePath();
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
    
    toast.success("Canvas cleared!");
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!canvasWrapperRef.current) return;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(0.5, zoom * delta), 5);
    
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new pan offset to zoom towards mouse position
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
    const newZoom = Math.max(zoom * 0.8, 0.5);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    toast.success("View reset");
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
            <div 
              ref={canvasWrapperRef}
              className="border rounded-lg overflow-hidden bg-white relative"
              style={{ 
                cursor: isPanning ? 'grab' : 'crosshair',
                touchAction: 'none'
              }}
              onWheel={handleWheel}
            >
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  transition: isPanning || isDrawing ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <canvas 
                  ref={canvasRef}
                  className="max-w-full block"
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
            
            {/* Zoom indicator */}
            <div className="text-xs text-muted-foreground text-center">
              Zoom: {Math.round(zoom * 100)}% | Scroll to zoom · {isPanning ? 'Drag to pan' : 'Click pan button to enable panning'}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
