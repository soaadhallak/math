import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminTable from "../../../components/admin/AdminTable";
import FilterPanel from "../../../components/admin/FilterPanel";
import Pagination from "../../../components/admin/Pagination";
import ImagePreviewCell from "../../../components/admin/ImagePreviewCell";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { apiService } from "../../../services/api";
import { getStoredPageSize } from "../../../lib/pagination";
import { Modal } from "../../../components/ui/modal";
import { PlusIcon } from "../../../icons";

interface ProjectCategory {
  id: number;
  imageSrc?: string;
  icon?: string;
  status: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
  translations?: Array<{
    locale: string;
    field: string;
    value: string;
  }>;
  _count?: {
    projects: number;
  };
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getStoredPageSize);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedStatusFilter, setDebouncedStatusFilter] = useState(statusFilter);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    category: ProjectCategory | null;
  }>({
    open: false,
    category: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedStatusFilter(statusFilter);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, [page, pageSize, debouncedSearch, debouncedStatusFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const status =
        debouncedStatusFilter === ""
          ? undefined
          : debouncedStatusFilter === "true";
      const res = await apiService.getProjectCategories({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setCategories(data);
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;

    try {
      await apiService.deleteProjectCategory(deleteModal.category.id);
      setDeleteModal({ open: false, category: null });
      loadCategories();
    } catch (error: any) {
      alert(error.message || "Failed to delete category");
    }
  };

  const getName = (category: ProjectCategory | null | undefined): string => {
    if (category == null) return "Untitled";
    const nameTranslation = category.translations?.find(
      (t) => t.locale === "en" && t.field === "name"
    );
    return nameTranslation?.value || "Untitled";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (category: ProjectCategory) => getName(category),
    },
    {
      key: "image",
      label: "Image",
      align: "start" as const,
      render: (category: ProjectCategory) =>
        category.imageSrc ? (
          <ImagePreviewCell
            src={category.imageSrc}
            alt={getName(category)}
            thumbClassName="w-16 h-10 object-contain rounded"
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "icon",
      label: "Icon",
      render: (category: ProjectCategory) => category.icon || "-",
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (category: ProjectCategory) => (
        <Badge size="sm" color={category.status ? "success" : "error"}>
          {category.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "sort",
      label: "Sort",
      align: "center" as const,
    },
    {
      key: "projects",
      label: "Projects",
      align: "center" as const,
      render: (category: ProjectCategory) =>
        category._count?.projects || 0,
    },
    {
      key: "createdAt",
      label: "Created At",
      align: "center" as const,
      render: (category: ProjectCategory) =>
        new Date(category.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (category: ProjectCategory) =>
        new Date(category.updatedAt).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="Project Categories | Admin"
        description="Manage project categories"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Project Categories
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/categories/new")}
            title="Add new category"
          >
            <PlusIcon className="size-5" />
          </Button>
        </div>

        <FilterPanel
          open={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
          onClear={handleClearFilters}
        >
          <div>
            <Label>Search name or slug</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug"
            />
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter((e.target.value || "") as "" | "true" | "false")}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </FilterPanel>

        <AdminTable
          columns={columns}
          data={categories}
          loading={loading}
          onEdit={(category) =>
            navigate(`/categories/${category.id}/edit`)
          }
          onDelete={(category) =>
            setDeleteModal({ open: true, category })
          }
        />

        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />

        <Modal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, category: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Category</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{getName(deleteModal.category)}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() =>
                  setDeleteModal({ open: false, category: null })
                }
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                className="bg-error-500 hover:bg-error-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
