import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2 } from "lucide-react";

interface ColoringCardProps {
  title: string;
  image: string;
  category: string;
}

export const ColoringCard = ({ title, image, category }: ColoringCardProps) => {
  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-2">
            {category}
          </span>
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button size="sm" variant="outline">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
