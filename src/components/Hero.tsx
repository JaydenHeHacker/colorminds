import { Button } from "@/components/ui/button";
import { Download, Palette } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export const Hero = () => {
  const scrollToCategories = () => {
    document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPopular = () => {
    document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden py-12 md:py-20 lg:py-28">
      <div className="absolute inset-0 gradient-soft opacity-50" />
      
      <div className="container relative z-10 px-4">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Unleash Your Creativity with
              <span className="block bg-clip-text text-transparent gradient-rainbow">
                Color Minds
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl">
              Explore thousands of free creative coloring pages for kids and adults. AI-generated story series, instant download and print!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Button 
                size="lg" 
                className="gap-2 shadow-colorful w-full sm:w-auto"
                onClick={scrollToCategories}
              >
                <Download className="h-5 w-5" />
                Browse Collection
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 w-full sm:w-auto"
                onClick={scrollToPopular}
              >
                <Palette className="h-5 w-5" />
                Popular Pages
              </Button>
            </div>
          </div>
          
          <div className="relative hidden md:block">
            <div className="aspect-video rounded-3xl overflow-hidden shadow-colorful">
              <img
                src={heroBanner}
                alt="Colorful coloring pages and art supplies"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
