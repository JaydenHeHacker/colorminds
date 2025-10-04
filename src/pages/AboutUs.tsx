import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, Users, Palette } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-b from-background to-secondary/20 py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              About Color Minds
            </h1>
            <p className="text-xl text-muted-foreground">
              Unleashing creativity through the joy of coloring
            </p>
          </div>

          {/* Mission Statement */}
          <Card className="p-8 mb-8 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-start gap-4 mb-4">
              <Heart className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At Color Minds, we believe that creativity knows no age. Our mission is to provide a platform where everyone—from children to adults—can explore their artistic side through the timeless joy of coloring. We combine traditional coloring pages with cutting-edge AI technology to offer an unparalleled creative experience.
                </p>
              </div>
            </div>
          </Card>

          {/* What We Offer */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <Palette className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Free Coloring Pages</h3>
                <p className="text-muted-foreground">
                  Thousands of high-quality coloring pages spanning animals, holidays, characters, nature themes, and exclusive AI-generated story series—all completely free to download and print.
                </p>
              </Card>

              <Card className="p-6">
                <Sparkles className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">AI-Powered Creation</h3>
                <p className="text-muted-foreground">
                  Create custom coloring pages with our AI technology. Simply describe what you want, or upload a photo, and watch as AI transforms your ideas into beautiful coloring pages.
                </p>
              </Card>

              <Card className="p-6">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Community Gallery</h3>
                <p className="text-muted-foreground">
                  Share your colored masterpieces with our vibrant community. Get inspired by others' work, discover new coloring techniques, and connect with fellow coloring enthusiasts.
                </p>
              </Card>

              <Card className="p-6">
                <Heart className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Online Coloring Tools</h3>
                <p className="text-muted-foreground">
                  Don't have a printer? No problem! Use our online coloring tools to color directly in your browser. Save your work and share it with the community.
                </p>
              </Card>
            </div>
          </div>

          {/* Our Story */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Color Minds was born from a simple observation: coloring isn't just for kids. Adults around the world have rediscovered the therapeutic benefits of coloring—reducing stress, improving focus, and providing a creative outlet in our busy digital lives.
              </p>
              <p>
                We started with a collection of hand-curated coloring pages, carefully selected for their quality and variety. As our community grew, we listened to feedback and realized that people wanted more—more variety, more personalization, and more ways to express their creativity.
              </p>
              <p>
                That's when we integrated AI technology. Now, our platform offers both curated collections and the ability to create custom coloring pages on demand. Whether you're looking for a specific theme, want to turn a family photo into a coloring page, or need a series of connected images for a special project, Color Minds has you covered.
              </p>
            </div>
          </Card>

          {/* Values */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Our Values</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">🎨 Creativity First</h3>
                <p className="text-muted-foreground">
                  We believe everyone has an inner artist. Our platform is designed to nurture creativity and make artistic expression accessible to all.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">🌟 Quality Matters</h3>
                <p className="text-muted-foreground">
                  Every coloring page on our platform meets our high standards for clarity, detail, and printability. We never compromise on quality.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">🤝 Community Driven</h3>
                <p className="text-muted-foreground">
                  Our community shapes everything we do. We listen to feedback, implement suggestions, and create features that users actually want.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">💡 Innovation & Tradition</h3>
                <p className="text-muted-foreground">
                  We combine the timeless joy of traditional coloring with modern AI technology, creating new possibilities while respecting the art form.
                </p>
              </div>
            </div>
          </Card>

          {/* Contact CTA */}
          <div className="text-center mt-12 p-8 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border">
            <h2 className="text-2xl font-bold mb-3">Join Our Creative Community</h2>
            <p className="text-muted-foreground mb-6">
              Whether you're here to relax, create, or share, we're glad you're part of Color Minds.
            </p>
            <p className="text-sm text-muted-foreground">
              Have questions or suggestions? We'd love to hear from you!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
