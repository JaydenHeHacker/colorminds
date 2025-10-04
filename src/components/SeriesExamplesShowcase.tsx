import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SeriesExample {
  series_slug: string;
  series_title: string;
  pages: {
    image_url: string;
    series_order: number;
  }[];
  page_count: number;
}

export const SeriesExamplesShowcase = () => {
  const navigate = useNavigate();

  // Fetch series examples from database
  const { data: seriesExamples, isLoading } = useQuery({
    queryKey: ['series-examples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select('series_slug, series_title, image_url, series_order')
        .not('series_slug', 'is', null)
        .eq('status', 'published')
        .order('series_slug')
        .order('series_order');

      if (error) throw error;

      // Group by series and take first 3 pages of each series
      const seriesMap = new Map<string, SeriesExample>();
      
      data?.forEach((page) => {
        if (!seriesMap.has(page.series_slug)) {
          seriesMap.set(page.series_slug, {
            series_slug: page.series_slug,
            series_title: page.series_title,
            pages: [],
            page_count: 0,
          });
        }
        
        const series = seriesMap.get(page.series_slug)!;
        series.page_count++;
        
        // Only keep first 4 pages for preview
        if (series.pages.length < 4) {
          series.pages.push({
            image_url: page.image_url,
            series_order: page.series_order,
          });
        }
      });

      return Array.from(seriesMap.values()).slice(0, 6); // Show top 6 series
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!seriesExamples || seriesExamples.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Real Series Examples from Our Community
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/series')}
          className="text-primary hover:text-primary/80"
        >
          View All Series
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {seriesExamples.map((series) => (
            <CarouselItem key={series.series_slug} className="md:basis-1/2 lg:basis-1/3">
              <Card 
                className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-background/50"
                onClick={() => navigate(`/series/${series.series_slug}`)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm line-clamp-2 flex-1">
                      {series.series_title}
                    </h5>
                    <Badge variant="secondary" className="shrink-0">
                      {series.page_count} pages
                    </Badge>
                  </div>

                  {/* Image Preview Grid - Show story progression */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {series.pages.map((page, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-md overflow-hidden bg-muted border border-border/50 group"
                      >
                        <img
                          src={page.image_url}
                          alt={`Page ${page.series_order}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                          <span className="text-white text-xs font-medium">
                            #{page.series_order}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Click to view full series</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4" />
        <CarouselNext className="-right-4" />
      </Carousel>

      <div className="mt-4 pt-4 border-t border-primary/10">
        <p className="text-xs text-muted-foreground text-center">
          ✨ Premium users can create series like these with AI-powered story generation
        </p>
      </div>
    </Card>
  );
};
