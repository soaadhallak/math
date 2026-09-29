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

interface ReferenceLogo {
  id: number;
  name: string;
  url: string | null;
  imageSrc: string;
  alt: string;
  sort: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ReferenceLogosList() {
  const [logos, setLogos] = useState<ReferenceLogo[]>([]);
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
    logo: ReferenceLogo | null;
  }>({
    open: false,
    logo: null,
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
    loadLogos();
  }, [page, pageSize, debouncedSearch, debouncedStatusFilter]);

  const loadLogos = async () => {
    try {
      setLoading(true);
      const status =
        debouncedStatusFilter === ""
          ? undefined
          : debouncedStatusFilter === "true";
      const res = await apiService.getReferenceLogos(undefined, {
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setLogos(data);
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load reference logos");
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
    if (!deleteModal.logo) return;

    try {
      await apiService.deleteReferenceLogo(deleteModal.logo.id);
      setDeleteModal({ open: false, logo: null });
      loadLogos();
    } catch (error: any) {
      alert(error.message || "Failed to delete reference logo");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "image",
      label: "Image",
      render: (logo: ReferenceLogo) => (
        <ImagePreviewCell
          src={logo.imageSrc}
          alt={logo.alt}
          thumbClassName="w-16 h-10 object-contain"
        />
      ),
    },
    {
      key: "alt",
      label: "Alt",
    },
    {
      key: "url",
      label: "URL",
      render: (logo: ReferenceLogo) =>
        logo.url ? (
          <a
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:underline truncate max-w-[200px] block"
          >
            {logo.url}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (logo: ReferenceLogo) => (
        <Badge size="sm" color={logo.status ? "success" : "error"}>
          {logo.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "sort",
      label: "Sort",
    },
    {
      key: "createdAt",
      label: "Created At",
      align: "center" as const,
      render: (logo: ReferenceLogo) =>
        new Date(logo.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (logo: ReferenceLogo) =>
        new Date(logo.updatedAt).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="Reference Logos | Admin"
        description="Manage reference logos"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Reference Logos
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/reference-logos/new")}
            title="Add new logo"
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
            <Label>Search name or alt</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or alt"
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
          data={logos}
          loading={loading}
          onEdit={(logo) => navigate(`/reference-logos/${logo.id}/edit`)}
          onDelete={(logo) => setDeleteModal({ open: true, logo })}
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
          onClose={() => setDeleteModal({ open: false, logo: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Reference Logo</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete &quot;{deleteModal.logo?.name}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() => setDeleteModal({ open: false, logo: null })}
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
