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

interface Project {
  id: number;
  slug: string;
  imageSrc: string;
  icon?: string;
  status: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
  projectCategoryId: number;
  projectCategory?: {
    translations?: Array<{
      locale: string;
      field: string;
      value: string;
    }>;
  };
  translations?: Array<{
    locale: string;
    field: string;
    value: string;
  }>;
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
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
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedStatusFilter, setDebouncedStatusFilter] = useState(statusFilter);
  const [debouncedSelectedCategory, setDebouncedSelectedCategory] =
    useState<number | "">(selectedCategory);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    project: Project | null;
  }>({
    open: false,
    project: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, search, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedStatusFilter(statusFilter);
      setDebouncedSelectedCategory(selectedCategory);
    }, 400);

    return () => clearTimeout(timeout);
  }, [selectedCategory, search, statusFilter]);

  useEffect(() => {
    loadProjects();
  }, [debouncedSelectedCategory, page, pageSize, debouncedSearch, debouncedStatusFilter]);

  const loadCategories = async () => {
    try {
      const data = await apiService.getProjectCategories();
      setCategories(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch (error: any) {
      console.error("Failed to load categories", error);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const categoryId = debouncedSelectedCategory
        ? Number(debouncedSelectedCategory)
        : undefined;
      const status =
        debouncedStatusFilter === ""
          ? undefined
          : debouncedStatusFilter === "true";
      const res = await apiService.getProjects(categoryId, {
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setProjects(data);
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSelectedCategory("");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.project) return;

    try {
      await apiService.deleteProject(deleteModal.project.id);
      setDeleteModal({ open: false, project: null });
      loadProjects();
    } catch (error: any) {
      alert(error.message || "Failed to delete project");
    }
  };

  const getName = (project: Project | null | undefined): string => {
    if (!project) return "Untitled";
    const nameTranslation = project.translations?.find(
      (t) => t.locale === "en" && t.field === "name"
    );
    return nameTranslation?.value || "Untitled";
  };

  const getCategoryName = (project: Project | null | undefined): string => {
    if (!project) return "Uncategorized";
    const categoryName = project.projectCategory?.translations?.find(
      (t) => t.locale === "en" && t.field === "name"
    );
    return categoryName?.value || "Uncategorized";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (project: Project) => getName(project),
    },
    {
      key: "image",
      label: "Image",
      render: (project: Project) =>
        project.imageSrc ? (
          <ImagePreviewCell
            src={project.imageSrc}
            alt={getName(project)}
            thumbClassName="w-20 h-12 object-cover rounded"
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "category",
      label: "Category",
      render: (project: Project) => getCategoryName(project),
    },
    {
      key: "slug",
      label: "Slug",
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (project: Project) => (
        <Badge size="sm" color={project.status ? "success" : "error"}>
          {project.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "sort",
      label: "Sort",
      align: "center" as const,
    },
    {
      key: "createdAt",
      label: "Created At",
      align: "center" as const,
      render: (project: Project) =>
        new Date(project.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (project: Project) =>
        new Date(project.updatedAt).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="Projects | Admin"
        description="Manage projects"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Projects
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/projects/new")}
            title="Add new project"
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
            <Label>Category</Label>
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? parseInt(e.target.value) : ""
                )
              }
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">All Categories</option>
              {categories.map((cat: any) => {
                const name =
                  cat.translations?.find(
                    (t: any) => t.locale === "en" && t.field === "name"
                  )?.value || "Untitled";
                return (
                  <option key={cat.id} value={cat.id}>
                    {name}
                  </option>
                );
              })}
            </select>
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
          data={projects}
          loading={loading}
          onEdit={(project) => navigate(`/projects/${project.id}/edit`)}
          onDelete={(project) =>
            setDeleteModal({ open: true, project })
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
          onClose={() => setDeleteModal({ open: false, project: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Project</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete "{deleteModal.project ? getName(deleteModal.project) : ""}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() => setDeleteModal({ open: false, project: null })}
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
