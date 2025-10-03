import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { ColoringCard } from "@/components/ColoringCard";
import { Footer } from "@/components/Footer";
import unicornImage from "@/assets/coloring-unicorn.jpg";
import dinosaurImage from "@/assets/coloring-dinosaur.jpg";
import butterflyImage from "@/assets/coloring-butterfly.jpg";
import oceanImage from "@/assets/coloring-ocean.jpg";

const coloringPages = [
  {
    id: 1,
    title: "Magical Unicorn with Stars",
    image: unicornImage,
    category: "Animals"
  },
  {
    id: 2,
    title: "Friendly Dinosaur Adventure",
    image: dinosaurImage,
    category: "Animals"
  },
  {
    id: 3,
    title: "Beautiful Butterfly Garden",
    image: butterflyImage,
    category: "Nature"
  },
  {
    id: 4,
    title: "Underwater Ocean Scene",
    image: oceanImage,
    category: "Ocean"
  },
  {
    id: 5,
    title: "Magical Unicorn with Stars",
    image: unicornImage,
    category: "Animals"
  },
  {
    id: 6,
    title: "Friendly Dinosaur Adventure",
    image: dinosaurImage,
    category: "Animals"
  },
  {
    id: 7,
    title: "Beautiful Butterfly Garden",
    image: butterflyImage,
    category: "Nature"
  },
  {
    id: 8,
    title: "Underwater Ocean Scene",
    image: oceanImage,
    category: "Ocean"
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        <Categories />
        
        <section className="py-16 md:py-20 bg-muted/30" id="popular">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Popular Coloring Pages
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our most loved and downloaded coloring pages
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {coloringPages.map((page) => (
                <ColoringCard
                  key={page.id}
                  title={page.title}
                  image={page.image}
                  category={page.category}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
