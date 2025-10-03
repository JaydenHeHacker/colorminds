import { Card } from "@/components/ui/card";
import { 
  Rabbit, 
  Trees, 
  Heart, 
  Star, 
  Flower, 
  Fish,
  Car,
  Home
} from "lucide-react";

const categories = [
  { name: "Animals", icon: Rabbit, color: "text-primary" },
  { name: "Nature", icon: Trees, color: "text-success" },
  { name: "Love", icon: Heart, color: "text-accent" },
  { name: "Space", icon: Star, color: "text-warning" },
  { name: "Flowers", icon: Flower, color: "text-secondary" },
  { name: "Ocean", icon: Fish, color: "text-primary" },
  { name: "Vehicles", icon: Car, color: "text-success" },
  { name: "Buildings", icon: Home, color: "text-accent" },
];

export const Categories = () => {
  return (
    <section className="py-16 md:py-20" id="categories">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect coloring page from our wide range of categories
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className="group cursor-pointer overflow-hidden border-2 hover:border-primary/50 transition-smooth shadow-sm hover:shadow-colorful"
              >
                <div className="aspect-square flex flex-col items-center justify-center p-6 gradient-card">
                  <Icon className={`h-12 w-12 md:h-16 md:w-16 mb-4 transition-smooth group-hover:scale-110 ${category.color}`} />
                  <h3 className="font-semibold text-lg text-center">{category.name}</h3>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
