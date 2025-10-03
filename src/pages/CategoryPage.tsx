import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ColoringCard } from "@/components/ColoringCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { StructuredData } from "@/components/StructuredData";
import { SocialMeta } from "@/components/SocialMeta";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Invalid category slug');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: coloringPages, isLoading: isPagesLoading } = useQuery({
    queryKey: ['category-pages', category?.id],
    queryFn: async () => {
      if (!category?.id) return [];
      
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('category_id', category.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!category?.id,
  });

  useEffect(() => {
    if (category) {
      document.title = `${category.name} Coloring Pages - Free Printables | Color Minds`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `Discover free printable ${category.name.toLowerCase()} coloring pages for kids and adults. ${category.description || ''} Download and print high-quality designs.`
        );
      }
    }
  }, [category]);

  if (isCategoryLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Category Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = isPagesLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <SocialMeta
        title={`${category.name} Coloring Pages - Free Printables`}
        description={`Discover ${coloringPages?.length || 0} free printable ${category.name.toLowerCase()} coloring pages. ${category.description || ''} Download and print high-quality designs for kids and adults.`}
        image={coloringPages?.[0]?.image_url}
        type="website"
        keywords={[
          category.name,
          'coloring pages',
          'printable',
          'free',
          'kids',
          'adults',
          'download'
        ]}
      />
      
      <StructuredData
        type="CollectionPage"
        data={{
          category: category.name,
          description: category.description,
          numberOfItems: coloringPages?.length || 0,
          items: coloringPages?.map(page => ({
            title: page.title,
            image: page.image_url
          }))
        }}
      />
      
      <main className="flex-1">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: category.name, isCurrentPage: true },
          ]}
        />

        <section className="container px-4 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Category Header */}
            <header className="mb-8 md:mb-12 text-center">
              {category.icon && (
                <div className="text-6xl mb-4">{category.icon}</div>
              )}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {category.name} Coloring Pages
              </h1>
              {category.description && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                  {category.description}
                </p>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                {coloringPages?.length || 0} free printable coloring pages available
              </div>
            </header>

            {/* Coloring Pages Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : coloringPages && coloringPages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {coloringPages.map((page) => (
                  <ColoringCard
                    key={page.id}
                    id={page.id}
                    slug={page.slug}
                    title={page.title}
                    image={page.image_url}
                    category={category.name}
                    difficulty={page.difficulty as "easy" | "medium" | "hard"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No coloring pages found in this category yet.
                </p>
                <Button onClick={() => navigate('/')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Browse All Categories
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
