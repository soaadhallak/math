import { ReactNode } from "react";
import Button from "../ui/button/Button";
import { ChevronDownIcon } from "../../icons";

interface FilterPanelProps {
  /** Whether the filter panel content is expanded */
  open: boolean;
  onToggle: () => void;
  /** Filter form content (grid of inputs) */
  children: ReactNode;
  onApply?: () => void;
  onClear?: () => void;
  /** Show Apply / Clear buttons (default true when onApply or onClear provided) */
  showActions?: boolean;
}

export default function FilterPanel({
  open,
  onToggle,
  children,
  onApply,
  onClear,
  showActions = true,
}: FilterPanelProps) {
  const hasActions = showActions && (onApply != null || onClear != null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium text-gray-800 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-gray-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
              open
                ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <ChevronDownIcon
              className={`size-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </span>
          <span>Filters</span>
        </span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          {open ? "Hide" : "Show"} options
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30 p-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
          {hasActions && (
            <div className="flex gap-2">
              {onApply != null && (
                <Button size="sm" onClick={onApply}>
                  Apply Filters
                </Button>
              )}
              {onClear != null && (
                <Button size="sm" onClick={onClear}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
