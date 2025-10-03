import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ChevronRight } from "lucide-react";
import { useState } from "react";

interface SeriesCardProps {
  seriesTitle: string;
  seriesTotal: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  firstImage: string;
  onViewSeries: () => void;
}

export const SeriesCard = ({ 
  seriesTitle, 
  seriesTotal, 
  difficulty, 
  category, 
  firstImage,
  onViewSeries 
}: SeriesCardProps) => {
  const difficultyConfig = {
    easy: { label: "简单", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "中等", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "困难", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[difficulty];

  return (
    <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={firstImage}
          alt={`${seriesTitle} - Cover`}
          className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <Book className="h-3 w-3" />
          {seriesTotal} 章节
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex gap-2 mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {category}
            </span>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{seriesTitle}</h3>
          <p className="text-sm text-muted-foreground">故事系列 · {seriesTotal}个章节</p>
        </div>
        
        <Button
          onClick={onViewSeries}
          className="w-full gap-2"
          variant="outline"
        >
          查看系列
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
