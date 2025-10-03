import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SeriesCardProps {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesTotal: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  firstImage: string;
  onViewSeries?: () => void;
}

export const SeriesCard = ({ 
  seriesId,
  seriesSlug,
  seriesTitle, 
  seriesTotal, 
  difficulty, 
  category, 
  firstImage,
  onViewSeries 
}: SeriesCardProps) => {
  const difficultyConfig = {
    easy: { label: "Easy", icon: "🟢", color: "bg-green-500/10 text-green-700 border-green-200" },
    medium: { label: "Medium", icon: "🟡", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    hard: { label: "Hard", icon: "🔴", color: "bg-red-500/10 text-red-700 border-red-200" }
  };

  const config = difficultyConfig[difficulty];

  return (
    <Link to={`/series/${seriesSlug}`}>
      <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful active:scale-98 touch-manipulation">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={firstImage}
            alt={`${seriesTitle} - Cover`}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1">
            <Book className="h-3 w-3" />
            <span className="hidden xs:inline">{seriesTotal} Chapters</span>
            <span className="xs:hidden">{seriesTotal}</span>
          </div>
        </div>
        
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          <div>
            <div className="flex gap-1.5 md:gap-2 mb-2 flex-wrap">
              <span className="inline-block px-2 py-0.5 md:py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {category}
              </span>
              <span className={`inline-block px-2 py-0.5 md:py-1 text-xs font-medium rounded-full border ${config.color}`}>
                {config.icon} {config.label}
              </span>
            </div>
            <h3 className="font-semibold text-base md:text-lg line-clamp-2 mb-1">{seriesTitle}</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Story Series · {seriesTotal} chapters</p>
          </div>
          
          <div className="flex items-center justify-between text-sm text-primary font-medium">
            <span>View Series</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
};
