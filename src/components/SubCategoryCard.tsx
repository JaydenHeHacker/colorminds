import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubCategoryCardProps {
  id: string;
  name: string;
  slug: string;
  path: string;
  description?: string;
  icon?: string;
  itemCount?: number;
}

export const SubCategoryCard = ({
  name,
  path,
  description,
  icon,
  itemCount = 0,
}: SubCategoryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer hover-scale transition-smooth hover:shadow-colorful"
      onClick={() => navigate(`/category/${path}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && <span className="text-3xl">{icon}</span>}
              <h3 className="text-lg font-semibold group-hover:text-primary transition-smooth">
                {name}
              </h3>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
};