import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, X, Printer, Sparkles, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PremiumUpgradeDialog } from "./PremiumUpgradeDialog";

export const PrintBasket = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 检查Premium状态
  useEffect(() => {
    if (user) {
      checkPremiumStatus();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-subscription');
      setIsPremium(data?.subscribed || false);
    } catch (error) {
      console.error('Error checking premium:', error);
    }
  };

  // 获取打印篮内容
  const { data: basketItems, isLoading } = useQuery({
    queryKey: ['print-basket', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('print_basket')
        .select(`
          id,
          added_at,
          coloring_pages!inner (
            id,
            title,
            image_url,
            slug,
            categories (name)
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 删除单项
  const removeMutation = useMutation({
    mutationFn: async (basketId: string) => {
      const { error } = await supabase
        .from('print_basket')
        .delete()
        .eq('id', basketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-basket'] });
      toast.success("Removed from print basket");
    },
  });

  // 清空打印篮
  const clearMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('print_basket')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-basket'] });
      toast.success("Print basket cleared");
      setIsOpen(false);
    },
  });

  // 生成批量打印PDF（Premium功能）
  const handleBatchPrint = async () => {
    if (!isPremium) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!basketItems || basketItems.length === 0) {
      toast.error("Print basket is empty");
      return;
    }

    toast.loading("Generating PDF...", { id: 'batch-print' });

    try {
      // 创建打印内容
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow pop-ups");
        return;
      }

      const pages = basketItems.map(item => item.coloring_pages);
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Batch Print - Color Minds</title>
            <style>
              @page { 
                margin: 0.5in;
                size: letter;
              }
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif; 
              }
              .page {
                page-break-after: always;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .page:last-child {
                page-break-after: auto;
              }
              img {
                max-width: 7.5in;
                max-height: 9in;
                width: 100%;
                height: auto;
                display: block;
                margin-bottom: 0.3in;
              }
              .footer {
                text-align: center;
                padding: 0.2in 0;
                border-top: 2px solid #333;
                width: 100%;
                max-width: 7.5in;
                margin-top: 0.2in;
              }
              .brand { 
                font-size: 14pt; 
                font-weight: bold; 
                color: #333; 
              }
              .url { 
                font-size: 10pt; 
                color: #666; 
              }
              @media print {
                .page { min-height: 0; }
              }
            </style>
          </head>
          <body>
            ${pages.map(page => `
              <div class="page">
                <img src="${page.image_url}" alt="${page.title}" />
                <div class="footer">
                  <div class="brand">Color Minds - ${page.title}</div>
                  <div class="url">www.colorminds.com</div>
                </div>
              </div>
            `).join('')}
          </body>
        </html>
      `);

      printWindow.document.close();
      
      // Wait for images to load
      setTimeout(() => {
        printWindow.print();
        toast.success(`Ready to print ${pages.length} pages`, { id: 'batch-print' });
      }, 1000);

      // 记录打印历史
      for (const item of basketItems) {
        await supabase
          .from('coloring_history')
          .insert({
            user_id: user.id,
            coloring_page_id: item.coloring_pages.id,
            action_type: 'print'
          });
      }

    } catch (error) {
      console.error('Print error:', error);
      toast.error("Print failed", { id: 'batch-print' });
    }
  };

  const basketCount = basketItems?.length || 0;

  if (!user) return null;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full shadow-2xl hover:shadow-colorful hover:scale-110 transition-all group"
            aria-label="Print Basket"
          >
            <div className="relative">
              <ShoppingBasket className="h-6 w-6 transition-transform group-hover:scale-110" />
              {basketCount > 0 && (
                <Badge 
                  className="absolute -top-3 -right-3 h-6 w-6 flex items-center justify-center p-0 bg-destructive text-destructive-foreground animate-pulse"
                >
                  {basketCount}
                </Badge>
              )}
            </div>
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBasket className="h-6 w-6" />
              Print Basket
              {!isPremium && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Premium提示 */}
            {!isPremium && (
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">Batch Print is a Premium Feature</p>
                    <p className="text-xs text-muted-foreground">
                      Upgrade to print all items at once and save 50% time
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => setShowUpgradeDialog(true)}
                      className="w-full"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : basketCount === 0 ? (
              <div className="text-center py-12 space-y-4">
                <ShoppingBasket className="h-16 w-16 mx-auto opacity-20" />
                <div>
                  <h3 className="font-semibold mb-2">Print Basket is Empty</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse the gallery and click the 🛒 icon to add items
                  </p>
                </div>
                <Button onClick={() => { setIsOpen(false); navigate('/'); }}>
                  Start Browsing
                </Button>
              </div>
            ) : (
              <>
                {/* 打印篮项目列表 */}
                <div className="space-y-3">
                  {basketItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-shadow group"
                    >
                      <img
                        src={item.coloring_pages.image_url}
                        alt={item.coloring_pages.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {item.coloring_pages.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.coloring_pages.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMutation.mutate(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* 操作按钮 */}
                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={handleBatchPrint}
                    className="w-full gap-2"
                    size="lg"
                    disabled={!isPremium}
                  >
                    <Printer className="h-5 w-5" />
                    {isPremium ? `Batch Print (${basketCount} pages)` : 'Premium Required'}
                  </Button>
                  <Button
                    onClick={() => clearMutation.mutate()}
                    variant="outline"
                    className="w-full"
                    disabled={clearMutation.isPending}
                  >
                    Clear Basket
                  </Button>
                </div>

                {/* Statistics */}
                <div className="text-center text-sm text-muted-foreground pt-2">
                  Total: {basketCount} pages
                  {isPremium && (
                    <p className="text-xs mt-1">
                      Save ~{basketCount * 10} seconds ⚡
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PremiumUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature="quantity"
      />
    </>
  );
};