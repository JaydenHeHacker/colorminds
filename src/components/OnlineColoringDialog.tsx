import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, Eraser, Download, Undo, Trash2, ZoomIn, ZoomOut, Move } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Canvas as FabricCanvas, PencilBrush, util, FabricImage, Point } from "fabric";

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
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    // Setup brush
    const brush = new PencilBrush(canvas);
    brush.color = activeColor;
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    // Load background image
    util.loadImage(imageUrl, { crossOrigin: "anonymous" })
      .then((img) => {
        const scale = Math.min(canvas.width! / img.width, canvas.height! / img.height);
        const fabricImg = new FabricImage(img, {
          scaleX: scale,
          scaleY: scale,
          left: (canvas.width! - img.width * scale) / 2,
          top: (canvas.height! - img.height * scale) / 2,
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = fabricImg;
        canvas.renderAll();
        toast.success("Canvas ready! Use mouse wheel to zoom, drag to pan");
      })
      .catch(() => {
        toast.error("Failed to load image");
      });

    // Mouse wheel zoom
    canvas.on("mouse:wheel", (opt) => {
      const evt = opt.e as WheelEvent;
      const delta = evt.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      
      if (newZoom > 5) newZoom = 5;
      if (newZoom < 0.5) newZoom = 0.5;
      
      canvas.zoomToPoint(new Point(evt.offsetX, evt.offsetY), newZoom);
      setZoom(newZoom);
      evt.preventDefault();
      evt.stopPropagation();
    });

    // Pan with space key or middle mouse
    let isDragging = false;
    let lastPosX = 0;
    let lastPosY = 0;

    canvas.on("mouse:down", (opt) => {
      const evt = opt.e as MouseEvent;
      if (isPanning || evt.button === 1) { // Middle mouse or pan mode
        isDragging = true;
        canvas.selection = false;
        canvas.isDrawingMode = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on("mouse:move", (opt) => {
      if (isDragging) {
        const evt = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform!;
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
      }
    });

    canvas.on("mouse:up", () => {
      isDragging = false;
      canvas.selection = true;
      if (!isPanning) {
        canvas.isDrawingMode = true;
      }
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [open, imageUrl]);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;

    fabricCanvas.isDrawingMode = !isPanning;
    fabricCanvas.freeDrawingBrush.color = isEraser ? "#ffffff" : activeColor;
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }, [fabricCanvas, activeColor, brushSize, isEraser, isPanning]);

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
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom * 1.2, 5);
    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom / 1.2, 0.5);
    fabricCanvas.setZoom(newZoom);
    setZoom(newZoom);
  };

  const handleResetView = () => {
    if (!fabricCanvas) return;
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoom(1);
    toast.success("View reset!");
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    objects.forEach((obj) => {
      if (obj !== fabricCanvas.backgroundImage) {
        fabricCanvas.remove(obj);
      }
    });
    toast.success("Canvas cleared!");
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      fabricCanvas.renderAll();
    }
  };

  const handleDownload = () => {
    if (!fabricCanvas) {
      toast.error('Canvas not ready');
      return;
    }
    
    try {
      // Reset zoom and pan for clean export
      const currentZoom = fabricCanvas.getZoom();
      const currentVpt = fabricCanvas.viewportTransform?.slice();
      
      fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      fabricCanvas.setZoom(1);
      
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      
      // Restore view
      fabricCanvas.setZoom(currentZoom);
      if (currentVpt) {
        fabricCanvas.setViewportTransform(currentVpt as [number, number, number, number, number, number]);
      }
      
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
                  onClick={handleUndo}
                  className="flex-1 sm:flex-initial h-9 sm:h-8 touch-manipulation"
                  title="Undo"
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
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
