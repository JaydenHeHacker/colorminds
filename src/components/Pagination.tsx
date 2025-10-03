import ReactPaginate from 'react-paginate';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (selectedItem: { selected: number }) => void;
}

export const Pagination = ({ pageCount, currentPage, onPageChange }: PaginationProps) => {
  if (pageCount <= 1) return null;

  return (
    <div className="flex justify-center mt-12">
      <ReactPaginate
        previousLabel={
          <div className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </div>
        }
        nextLabel={
          <div className="flex items-center gap-1">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        }
        pageCount={pageCount}
        onPageChange={onPageChange}
        forcePage={currentPage}
        pageRangeDisplayed={3}
        marginPagesDisplayed={1}
        containerClassName="flex items-center gap-2"
        pageClassName="hidden sm:block"
        pageLinkClassName="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
        previousClassName="flex"
        previousLinkClassName="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1"
        nextClassName="flex"
        nextLinkClassName="px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1"
        breakClassName="hidden sm:block"
        breakLinkClassName="px-3 py-2"
        activeClassName="font-bold"
        activeLinkClassName="bg-primary text-primary-foreground border-primary hover:bg-primary"
        disabledClassName="opacity-50 cursor-not-allowed"
        disabledLinkClassName="hover:bg-transparent cursor-not-allowed"
      />
    </div>
  );
};