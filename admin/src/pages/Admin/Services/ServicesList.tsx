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

interface Service {
  id: number;
  slug: string;
  imageSrc: string;
  icon?: string;
  status: boolean;
  showOnHome?: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
  translations?: Array<{
    locale: string;
    field: string;
    value: string;
  }>;
}

export default function ServicesList() {
  const [services, setServices] = useState<Service[]>([]);
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
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null,
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
    loadServices();
  }, [page, pageSize, debouncedSearch, debouncedStatusFilter]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const status =
        debouncedStatusFilter === ""
          ? undefined
          : debouncedStatusFilter === "true";
      const res = await apiService.getServices({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setServices(data);
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load services");
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
    if (!deleteModal.service) return;

    try {
      await apiService.deleteService(deleteModal.service.id);
      setDeleteModal({ open: false, service: null });
      loadServices();
    } catch (error: any) {
      alert(error.message || "Failed to delete service");
    }
  };

  const getName = (service: Service | null | undefined): string => {
    if (!service) return "Untitled";
    const nameTranslation = service.translations?.find(
      (t) => t.locale === "en" && t.field === "name"
    );
    return nameTranslation?.value || "Untitled";
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (service: Service) => getName(service),
    },
    {
      key: "image",
      label: "Image",
      render: (service: Service) =>
        service.imageSrc ? (
          <ImagePreviewCell
            src={service.imageSrc}
            alt={getName(service)}
            thumbClassName="w-20 h-12 object-cover rounded"
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "slug",
      label: "Slug",
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (service: Service) => (
        <Badge size="sm" color={service.status ? "success" : "error"}>
          {service.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "showOnHome",
      label: "Homepage",
      align: "center" as const,
      render: (service: Service) =>
        service.showOnHome ? (
          <Badge size="sm" color="info">
            Vision
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
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
      render: (service: Service) =>
        new Date(service.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (service: Service) =>
        new Date(service.updatedAt).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="Services Management | Admin"
        description="Manage services"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Services
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/services/new")}
            title="Add new service"
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
          data={services}
          loading={loading}
          onEdit={(service) => navigate(`/services/${service.id}/edit`)}
          onDelete={(service) =>
            setDeleteModal({ open: true, service })
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
          onClose={() => setDeleteModal({ open: false, service: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Service</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{getName(deleteModal.service)}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() => setDeleteModal({ open: false, service: null })}
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
