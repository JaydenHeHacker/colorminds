import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2 } from "lucide-react";

interface CreateCTAProps {
  variant?: "hero" | "inline" | "empty-state" | "sidebar";
  title?: string;
  description?: string;
  context?: string; // e.g., "search", "category", "details"
}

export const CreateCTA = ({
  variant = "inline",
  title,
  description,
  context = "general"
}: CreateCTAProps) => {
  const navigate = useNavigate();

  // Default content based on context
  const getContent = () => {
    switch (context) {
      case "search":
        return {
          title: "Can't Find What You're Looking For?",
          description: "Create your own custom coloring page with AI! Just describe what you want.",
          icon: <Wand2 className="w-8 h-8 text-primary" />
        };
      case "category":
        return {
          title: "Need Something Specific?",
          description: "Our AI can create exactly what you're imagining. Try it now!",
          icon: <Sparkles className="w-8 h-8 text-primary" />
        };
      case "details":
        return {
          title: "Love This Style?",
          description: "Create your own custom version with different themes and elements!",
          icon: <Wand2 className="w-8 h-8 text-primary" />
        };
      case "favorites":
        return {
          title: "Ready to Create Something Unique?",
          description: "Use AI to generate coloring pages that match your style preferences!",
          icon: <Sparkles className="w-8 h-8 text-primary" />
        };
      default:
        return {
          title: "Create Your Own Coloring Page",
          description: "Use AI to generate custom coloring pages in seconds!",
          icon: <Sparkles className="w-8 h-8 text-primary" />
        };
    }
  };

  const content = getContent();
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  // Hero variant (large, prominent)
  if (variant === "hero") {
    return (
      <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/20">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="flex-shrink-0">
            {content.icon}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{displayTitle}</h2>
            <p className="text-muted-foreground text-lg mb-4">{displayDescription}</p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/create')}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 min-w-[200px]"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Now
          </Button>
        </div>
      </Card>
    );
  }

  // Empty state variant (when no results)
  if (variant === "empty-state") {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <div className="flex justify-center mb-6 animate-scale-in">
          <div className="relative">
            {content.icon}
            <div className="absolute inset-0 animate-pulse opacity-30 blur-xl">
              {content.icon}
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3">{displayTitle}</h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto text-base leading-relaxed">
          {displayDescription}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/create')}
            className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-colorful transition-all hover-scale"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Try AI Creation
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover-scale"
          >
            Browse All Categories
          </Button>
        </div>
      </div>
    );
  }

  // Sidebar variant (compact)
  if (variant === "sidebar") {
    return (
      <Card className="p-4 bg-primary/5">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">{displayTitle}</h4>
            <p className="text-xs text-muted-foreground">{displayDescription}</p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => navigate('/create')}
          className="w-full"
          variant="outline"
        >
          Create Now
        </Button>
      </Card>
    );
  }

  // Inline variant (default)
  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-shrink-0">
          {content.icon}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-semibold mb-1">{displayTitle}</h3>
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
        </div>
        <Button 
          onClick={() => navigate('/create')}
          className="bg-gradient-to-r from-primary to-primary/80 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Now
        </Button>
      </div>
    </Card>
  );
};
