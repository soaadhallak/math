import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PencilIcon, TrashBinIcon } from "../../icons";
import Checkbox from "../form/input/Checkbox";

type Align = "start" | "center" | "end";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  align?: Align;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  /** Override the default pencil icon used by the onEdit button. */
  editIcon?: React.ReactNode;
  /** Override the default "Edit" title/aria-label of the onEdit button. */
  editTitle?: string;
  actions?: boolean;
  selectable?: boolean;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
}

export default function AdminTable<T extends { id: number }>({
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  editIcon,
  editTitle = "Edit",
  actions = true,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const alignClass = (align: Align | undefined) =>
    align === "center"
      ? "text-center"
      : align === "end"
        ? "text-end"
        : "text-start";

  const selectedIdSet = new Set(selectedIds);
  const isAllSelected = data.length > 0 && data.every((item) => selectedIdSet.has(item.id));

  const toggleAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (!checked) {
      onSelectionChange([]);
      return;
    }
    onSelectionChange(data.map((item) => item.id));
  };

  const toggleRow = (id: number, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedIds, id])));
      return;
    }
    onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {selectable && (
                <TableCell
                  isHeader
                  className="px-5 py-4 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected}
                      onChange={toggleAll}
                    />
                  </div>
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  isHeader
                  className={`px-5 py-4 font-medium text-gray-500 text-theme-xs dark:text-gray-400 ${alignClass(column.align)}`}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions && (onEdit || onDelete) && (
                <TableCell
                  isHeader
                  className="px-5 py-4 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.map((item) => (
              <TableRow key={item.id}>
                {selectable && (
                  <TableCell className="px-5 py-6 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedIdSet.has(item.id)}
                        onChange={(checked) => toggleRow(item.id, checked)}
                      />
                    </div>
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`px-5 py-6 text-gray-500 text-theme-sm dark:text-gray-400 ${alignClass(column.align)}`}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </TableCell>
                ))}
                {actions && (onEdit || onDelete) && (
                  <TableCell className="px-5 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title={editTitle}
                          aria-label={editTitle}
                          className="p-1.5 rounded-lg text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20"
                        >
                          {editIcon ?? <PencilIcon className="size-5" />}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-error-500 hover:text-error-600 hover:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20"
                        >
                          <TrashBinIcon className="size-5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
