import Button from "../ui/button/Button";
import { PAGE_SIZE_OPTIONS, setStoredPageSize } from "../../lib/pagination";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** For user-logs API which uses pageSize instead of limit */
export interface PaginationMetaPageSize {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginationProps {
  pagination: PaginationMeta | PaginationMetaPageSize;
  onPageChange: (page: number) => void;
  /** Current page size (rows per page). If provided with onPageSizeChange, shows a "Per page" dropdown. */
  pageSize?: number;
  /** Called when user changes page size. Save to state and reset to page 1. Pagination saves to localStorage. */
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

const limitKey = "limit";
const pageSizeKey = "pageSize";

function getLimit(p: PaginationMeta | PaginationMetaPageSize): number {
  return (p as PaginationMeta)[limitKey] ?? (p as PaginationMetaPageSize)[pageSizeKey] ?? 20;
}

/** Build page numbers + ellipsis for display (e.g. 1, ..., 4, 5, 6, ..., 25) */
function getPageItems(
  totalPages: number,
  current: number,
  siblingCount = 2
): (number | "ellipsis")[] {
  const set = new Set<number>([1, totalPages]);
  for (let i = -siblingCount; i <= siblingCount; i++) {
    const p = current + i;
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = Array.from(set).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({
  pagination,
  onPageChange,
  pageSize: pageSizeProp,
  onPageSizeChange,
  className = "",
}: PaginationProps) {
  const { page, total, totalPages } = pagination;
  const limit = getLimit(pagination);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const showPageNav = totalPages > 1;
  const showBar = showPageNav || (onPageSizeChange != null && total >= 0);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = Number(e.target.value);
    if (!PAGE_SIZE_OPTIONS.includes(size as (typeof PAGE_SIZE_OPTIONS)[number])) return;
    setStoredPageSize(size);
    onPageSizeChange?.(size);
  };

  if (!showBar) return null;

  const pageItems = getPageItems(totalPages, page);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {from} to {to} of {total} entries
        </div>
        {onPageSizeChange != null && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="pagination-page-size"
              className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap"
            >
              Per page
            </label>
            <select
              id="pagination-page-size"
              value={pageSizeProp ?? limit}
              onChange={handlePageSizeChange}
              className="h-9 rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-brand-600"
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {showPageNav && (
        <nav
          className="flex items-center gap-1.5"
          aria-label="Pagination"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            title="Previous page"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {pageItems.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 min-w-[2.25rem] items-center justify-center px-2 text-gray-400 dark:text-gray-500"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  title={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                    item === page
                      ? "bg-brand-500 text-white shadow-sm hover:bg-brand-600"
                      : "bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            title="Next page"
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
