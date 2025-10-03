import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AboutSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-16 md:py-20 bg-gradient-soft border-t">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              About Our Free Coloring Pages
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Discover high-quality <strong>free printable coloring pages</strong> perfect for all ages. 
              Browse animals, holidays, Disney characters, and exclusive AI-generated story series. 
              Download instantly and print at home—completely free with no sign-up required!
            </p>
          </div>
          
          {isExpanded && (
            <div className="space-y-6 text-muted-foreground">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                  <h3 className="text-xl font-semibold text-foreground mb-3">For All Ages</h3>
                  <p className="text-base leading-relaxed">
                    Our ever-growing library features designs for everyone—from easy <strong>coloring pages for toddlers</strong> to intricate <strong>adult coloring pages</strong> for advanced colorists. 
                    Whether you need <strong>coloring pages for girls</strong>, <strong>coloring pages for boys</strong>, or <strong>coloring pages for teens</strong>, we have something special for you.
                  </p>
                </div>
                
                <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                  <h3 className="text-xl font-semibold text-foreground mb-3">Popular Themes</h3>
                  <p className="text-base leading-relaxed">
                    Browse our extensive collection featuring: <strong>animal coloring pages</strong> (cats, dogs, dinosaurs, unicorns), <strong>holiday coloring pages</strong> (Christmas, Halloween, Easter, Thanksgiving), 
                    <strong>Disney coloring pages</strong>, <strong>princess coloring pages</strong>, and beloved characters like Hello Kitty, Sonic, Pokemon, and more.
                  </p>
                </div>
                
                <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                  <h3 className="text-xl font-semibold text-foreground mb-3">Educational Benefits</h3>
                  <p className="text-base leading-relaxed">
                    Perfect for classrooms, homeschooling, rainy days, or quiet time. Our <strong>printable coloring sheets</strong> help develop fine motor skills, 
                    hand-eye coordination, color recognition, and encourage creativity while providing screen-free entertainment.
                  </p>
                </div>
                
                <div className="p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
                  <h3 className="text-xl font-semibold text-foreground mb-3">Always Free</h3>
                  <p className="text-base leading-relaxed">
                    Each <strong>free coloring page</strong> is carefully crafted to provide hours of relaxing, educational fun. 
                    Teachers and parents love our <strong>easy coloring pages</strong> for early learners and <strong>cute coloring pages</strong> that keep children engaged.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Learn More About Us
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};