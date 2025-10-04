import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Canvas as FabricCanvas, PencilBrush, Image as FabricImage } from "fabric";
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

  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    // Load the coloring page image as background
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      const scale = Math.min(800 / img.width, 600 / img.height);
      canvas.backgroundImage = new fabric.Image(img, {
        scaleX: scale,
        scaleY: scale,
      });
      canvas.renderAll();
    };

    // Initialize brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = brushSize;
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [open, imageUrl]);

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
    if (!fabricCanvas) return;
    fabricCanvas.getObjects().forEach(obj => fabricCanvas.remove(obj));
    fabricCanvas.renderAll();
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
    if (!fabricCanvas) return;
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
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5 text-primary" />
            Online Coloring - {pageTitle}
          </DialogTitle>
          <DialogDescription>
            Use the tools below to color the page online
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg">
              {/* Color Palette */}
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      activeColor === color && !isEraser
                        ? "border-primary scale-110"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>

              <div className="h-8 w-px bg-border" />

              {/* Brush Size */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm w-8">{brushSize}</span>
              </div>

              <div className="h-8 w-px bg-border" />

              {/* Tools */}
              <Button
                variant={isEraser ? "default" : "outline"}
                size="sm"
                onClick={handleEraserToggle}
              >
                <Eraser className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleUndo}>
                <Undo className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden bg-white">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
