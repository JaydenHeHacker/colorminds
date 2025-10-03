import { Button } from "@/components/ui/button";
import { Download, Palette } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 gradient-soft opacity-50" />
      
      <div className="container relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Free Printable
              <span className="block bg-clip-text text-transparent gradient-rainbow">
                Coloring Pages
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Discover thousands of free printable coloring pages for kids and adults. 
              Download instantly and start coloring today!
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2 shadow-colorful">
                <Download className="h-5 w-5" />
                Browse Collection
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Palette className="h-5 w-5" />
                Popular Pages
              </Button>
            </div>
          </div>
          
          <div className="relative lg:block">
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
