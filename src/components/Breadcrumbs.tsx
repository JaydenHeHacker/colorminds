import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav aria-label="Breadcrumb" className="bg-muted/30 border-b">
      <div className="container px-4 py-3">
        <Breadcrumb>
          <BreadcrumbList className="text-sm">
            {items.map((item, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem>
                  {item.isCurrentPage ? (
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={item.href || '#'}
                      className="hover:text-primary transition-colors hover-scale"
                      onClick={(e) => {
                        if (item.href?.startsWith('#')) {
                          e.preventDefault();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < items.length - 1 && <BreadcrumbSeparator className="text-muted-foreground" />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </nav>
  );
};
