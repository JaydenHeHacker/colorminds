import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubCategory {
  id: string;
  name: string;
  path: string;
  icon?: string;
  coloring_pages?: Array<{ count: number }>;
}

interface CategorySidebarProps {
  category: {
    id: string;
    name: string;
    path: string;
    icon?: string;
  };
  subCategories: SubCategory[];
  totalCount: number;
}

export const CategorySidebar = ({ category, subCategories, totalCount }: CategorySidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname.replace('/category/', '');

  const isActive = (path: string) => currentPath === path;
  
  // Check if this is the "All" root category
  const isAllCategory = category.path === 'all';

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-20">
        <div className="bg-card rounded-lg border p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Categories</h3>
          
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <nav className="space-y-1">
              {/* Parent Category - All */}
              <Link
                to={`/category/${category.path}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm",
                  isActive(category.path)
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {category.icon && (
                    category.icon.startsWith('http') ? (
                      <img src={category.icon} alt="" className="w-5 h-5 object-cover rounded flex-shrink-0" />
                    ) : (
                      <span className="text-lg flex-shrink-0">{category.icon}</span>
                    )
                  )}
                  <span className="truncate">{isAllCategory ? 'All' : `All ${category.name}`}</span>
                </div>
                <span className="text-xs opacity-70 ml-2 flex-shrink-0">{totalCount}</span>
              </Link>

              {/* Subcategories */}
              {subCategories && subCategories.length > 0 && (
                <div className="mt-2 space-y-1">
                  {subCategories.map((subCat) => (
                    <Link
                      key={subCat.id}
                      to={`/category/${subCat.path}`}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 pl-8 rounded-lg transition-colors text-sm group",
                        isActive(subCat.path)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {subCat.icon && (
                          subCat.icon.startsWith('http') ? (
                            <img src={subCat.icon} alt="" className="w-4 h-4 object-cover rounded flex-shrink-0" />
                          ) : (
                            <span className="text-base flex-shrink-0">{subCat.icon}</span>
                          )
                        )}
                        <span className="truncate">{subCat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs opacity-70">
                          {subCat.coloring_pages?.[0]?.count || 0}
                        </span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </ScrollArea>
        </div>
      </div>
    </aside>
  );
};