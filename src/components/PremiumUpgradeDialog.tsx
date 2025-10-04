import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: 'speed' | 'privacy' | 'quantity' | 'ai-polish' | 'series' | 'image-to-image';
}

const featureContent = {
  speed: {
    title: "Instant Generation with Premium",
    description: "Premium users enjoy priority processing with no waiting time",
    benefits: [
      "Generate in 5-10 seconds instead of 30-60 seconds",
      "No queue system - instant processing",
      "Priority access during peak hours",
      "Unlimited generations per day"
    ],
    savings: "Save up to 55 seconds per generation"
  },
  privacy: {
    title: "Keep Your Creations Private",
    description: "Control who can see your coloring pages",
    benefits: [
      "All creations are private by default",
      "Choose which pages to share publicly",
      "Download without watermarks",
      "Full control over your content"
    ],
    savings: "Complete privacy control"
  },
  quantity: {
    title: "Generate Multiple Images at Once",
    description: "Create variations and choose the best result",
    benefits: [
      "Generate up to 4 images simultaneously",
      "Compare different styles instantly",
      "Higher success rate for perfect results",
      "Batch download all variations"
    ],
    savings: "4x more options per generation"
  },
  'ai-polish': {
    title: "AI-Powered Prompt Enhancement",
    description: "Transform simple ideas into detailed, optimized prompts",
    benefits: [
      "AI analyzes and enhances your prompt",
      "Adds artistic details and style keywords",
      "Optimized for best coloring page results",
      "Learn from AI suggestions"
    ],
    savings: "Better results with less effort"
  },
  series: {
    title: "Create Story Series",
    description: "Generate 4-8 connected coloring pages with a cohesive narrative",
    benefits: [
      "AI creates a complete story arc across pages",
      "Each page flows naturally to the next",
      "Perfect for creating coloring books",
      "Better value - series costs less per page"
    ],
    savings: "Save credits with series generation"
  },
  'image-to-image': {
    title: "Photo to Coloring Page Conversion",
    description: "Transform your photos into beautiful coloring pages",
    benefits: [
      "Convert family photos, pet pictures, or any image",
      "Adjust line complexity for different age groups",
      "Choose from realistic, cartoon, or cute styles",
      "Control line thickness and background processing"
    ],
    savings: "Premium exclusive feature"
  }
};

export const PremiumUpgradeDialog = ({ open, onOpenChange, feature }: PremiumUpgradeDialogProps) => {
  const navigate = useNavigate();
  const content = featureContent[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/credits-store');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl">{content.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-primary mb-2">
              {content.savings}
            </p>
          </div>

          <div className="space-y-3">
            {content.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              onClick={handleUpgrade}
              className="w-full"
              size="lg"
            >
              <Zap className="mr-2 h-4 w-4" />
              Upgrade to Premium
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
