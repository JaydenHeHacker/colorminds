import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { ColoringCard } from "@/components/ColoringCard";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const { data: coloringPages, isLoading } = useQuery({
    queryKey: ['coloring-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Filter coloring pages by selected category
  const filteredPages = selectedCategory
    ? coloringPages?.filter(page => page.categories?.name === selectedCategory)
    : coloringPages;

  const handlePageSelect = (pageId: string, selected: boolean) => {
    const newSelected = new Set(selectedPages);
    if (selected) {
      newSelected.add(pageId);
    } else {
      newSelected.delete(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleBatchDownload = async () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要下载的涂色页");
      return;
    }

    toast.info(`开始下载 ${selectedPages.size} 张涂色页...`);
    
    let successCount = 0;
    for (const pageId of selectedPages) {
      const page = coloringPages?.find(p => p.id === pageId);
      if (!page) continue;

      try {
        const response = await fetch(page.image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        successCount++;
        
        // Add delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download ${page.title}:`, error);
      }
    }

    toast.success(`成功下载 ${successCount} 张涂色页！`);
    setSelectedPages(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Hero />
        
        <Categories 
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        
        <section className="py-16 md:py-20 bg-muted/30" id="popular">
          <div className="container">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                {selectedCategory ? `${selectedCategory} Coloring Pages` : 'Popular Coloring Pages'}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {selectedCategory 
                  ? `Browse our collection of ${selectedCategory.toLowerCase()} themed coloring pages`
                  : 'Our most loved and downloaded coloring pages'
                }
              </p>
            </div>

            {filteredPages && filteredPages.length > 0 && (
              <div className="mb-6 flex justify-center gap-4">
                <Button
                  onClick={() => {
                    const allIds = new Set(filteredPages.map(p => p.id));
                    setSelectedPages(allIds);
                  }}
                  variant="outline"
                >
                  全选
                </Button>
                <Button
                  onClick={() => setSelectedPages(new Set())}
                  variant="outline"
                >
                  取消全选
                </Button>
                <Button
                  onClick={handleBatchDownload}
                  disabled={selectedPages.size === 0}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  批量下载 ({selectedPages.size})
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Loading coloring pages...
                </div>
              ) : filteredPages && filteredPages.length > 0 ? (
                filteredPages.map((page) => (
                  <ColoringCard
                    key={page.id}
                    title={page.title}
                    image={page.image_url}
                    category={page.categories?.name || 'Uncategorized'}
                    difficulty={page.difficulty as "easy" | "medium" | "hard"}
                    isSelected={selectedPages.has(page.id)}
                    onSelect={(selected) => handlePageSelect(page.id, selected)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No coloring pages available yet. Check back soon!
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
