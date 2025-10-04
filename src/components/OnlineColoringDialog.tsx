import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Download, Undo, Trash2, ZoomIn, ZoomOut, Move, RotateCcw } from "lucide-react";
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
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas and load background image
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    
    if (!ctx) {
      console.error("Failed to get canvas context");
      return;
    }

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Create a separate drawing layer canvas
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = canvas.width;
    drawingCanvas.height = canvas.height;
    drawingLayerRef.current = drawingCanvas;
    
    // Set drawing settings
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    setContext(ctx);

    // Load background image
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      backgroundImageRef.current = img;
      renderCanvas(ctx, canvas, img, drawingCanvas, zoom, panOffset);
      toast.success("Canvas ready! Scroll to zoom, drag to pan");
    };
    
    img.onerror = () => {
      toast.error("Failed to load image. Please try again.");
    };
    
    img.src = imageUrl;

    // Cleanup
    return () => {
      setContext(null);
      backgroundImageRef.current = null;
      drawingLayerRef.current = null;
    };
  }, [open, imageUrl]);

  // Render canvas with zoom and pan
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    drawingCanvas: HTMLCanvasElement,
    currentZoom: number,
    offset: { x: number; y: number }
  ) => {
    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply zoom and pan transformations
    ctx.translate(offset.x, offset.y);
    ctx.scale(currentZoom, currentZoom);
    
    // Calculate image position to center it
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2 / currentZoom;
    const y = (canvas.height - img.height * scale) / 2 / currentZoom;
    
    // Draw background image
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    
    // Draw the drawing layer on top
    ctx.drawImage(drawingCanvas, 0, 0);
    
    // Restore context state
    ctx.restore();
  };

  // Re-render when zoom or pan changes
  useEffect(() => {
    if (!context || !canvasRef.current || !backgroundImageRef.current || !drawingLayerRef.current) return;
    renderCanvas(context, canvasRef.current, backgroundImageRef.current, drawingLayerRef.current, zoom, panOffset);
  }, [zoom, panOffset]);

  const handleColorChange = (color: string) => {
    setActiveColor(color);
    setIsEraser(false);
  };

  const handleEraserToggle = () => {
    setIsEraser(!isEraser);
  };

  const handlePanToggle = () => {
    setIsPanning(!isPanning);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    toast.success("View reset!");
  };

  const handleClear = () => {
    if (!drawingLayerRef.current || !context || !canvasRef.current || !backgroundImageRef.current) return;
    
    const drawCtx = drawingLayerRef.current.getContext("2d");
    if (drawCtx) {
      drawCtx.clearRect(0, 0, drawingLayerRef.current.width, drawingLayerRef.current.height);
      renderCanvas(context, canvasRef.current, backgroundImageRef.current, drawingLayerRef.current, zoom, panOffset);
      toast.success("Canvas cleared!");
    }
  };

  const handleUndo = () => {
    // Note: Simple undo not implemented, would need history tracking
    toast.info("Undo not available. Use Clear to start over.");
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready');
      return;
    }
    
    try {
      // Create a temporary canvas for export at original zoom
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasRef.current.width;
      exportCanvas.height = canvasRef.current.height;
      const exportCtx = exportCanvas.getContext('2d');
      
      if (exportCtx && backgroundImageRef.current && drawingLayerRef.current) {
        renderCanvas(exportCtx, exportCanvas, backgroundImageRef.current, drawingLayerRef.current, 1, { x: 0, y: 0 });
        
        const dataURL = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${pageTitle}-colored.png`;
        link.href = dataURL;
        link.click();
        toast.success("Image downloaded!");
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.5), 5);
    setZoom(newZoom);
  };

  // Drawing functions
  const getTransformedCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Transform screen coordinates to canvas coordinates considering zoom and pan
    const x = (clientX - rect.left - panOffset.x) / zoom;
    const y = (clientY - rect.top - panOffset.y) / zoom;
    
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingLayerRef.current) return;
    
    if (isPanning) {
      // Start panning
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }
    
    // Start drawing
    setIsDrawing(true);
    const drawCtx = drawingLayerRef.current.getContext("2d");
    if (!drawCtx) return;
    
    const { x, y } = getTransformedCoords(e);
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingLayerRef.current) return;
    
    if (isPanning) {
      // Pan
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - lastPanPoint.x;
      const dy = clientY - lastPanPoint.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }
    
    if (!isDrawing) return;
    
    // Draw
    const drawCtx = drawingLayerRef.current.getContext("2d");
    if (!drawCtx) return;
    
    const { x, y } = getTransformedCoords(e);
    drawCtx.strokeStyle = isEraser ? "#ffffff" : activeColor;
    drawCtx.lineWidth = brushSize / zoom; // Adjust brush size for zoom
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
    
    // Render to main canvas
    if (context && canvasRef.current && backgroundImageRef.current) {
      renderCanvas(context, canvasRef.current, backgroundImageRef.current, drawingLayerRef.current, zoom, panOffset);
    }
  };

  const stopDrawing = () => {
    if (isPanning) {
      return;
    }
    
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (drawingLayerRef.current) {
      const drawCtx = drawingLayerRef.current.getContext("2d");
      if (drawCtx) {
        drawCtx.closePath();
      }
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
                  title="Eraser"
                >
                  <Eraser className="h-4 w-4" />
                </Button>

                <Button
                  variant={isPanning ? "default" : "outline"}
                  size="sm"
                  onClick={handlePanToggle}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Pan Mode"
                >
                  <Move className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomIn}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleZoomOut}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetView}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Reset View"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Undo"
                  disabled
                >
                  <Undo className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Clear All"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Zoom info */}
            <div className="text-xs text-muted-foreground text-center">
              Zoom: {Math.round(zoom * 100)}% | Mouse wheel to zoom, drag to pan
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden bg-white touch-manipulation">
              <canvas 
                ref={canvasRef}
                className="max-w-full"
                style={{ cursor: isPanning ? 'move' : 'crosshair' }}
                onWheel={handleWheel}
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
