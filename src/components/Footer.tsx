import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/40 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent gradient-rainbow">
              ColoringFun
            </h3>
            <p className="text-sm text-muted-foreground">
              Free printable coloring pages for everyone. Download, print, and enjoy!
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Animals</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Nature</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Holidays</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Characters</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Coloring Tips</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Print Guide</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">About Us</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Terms of Use</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border/40 pt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Made with <Heart className="h-4 w-4 text-accent fill-accent" /> for coloring enthusiasts
          </p>
        </div>
      </div>
    </footer>
  );
};
