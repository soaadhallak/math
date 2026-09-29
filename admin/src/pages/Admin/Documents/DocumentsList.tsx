import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminTable from "../../../components/admin/AdminTable";
import FilterPanel from "../../../components/admin/FilterPanel";
import Pagination from "../../../components/admin/Pagination";
import Button from "../../../components/ui/button/Button";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { apiService, API_BASE_URL } from "../../../services/api";
import { getStoredPageSize } from "../../../lib/pagination";
import { Modal } from "../../../components/ui/modal";
import { PlusIcon } from "../../../icons";
import { CopyIcon } from "../../../icons";

interface DocumentItem {
  id: number;
  name: string;
  src: string;
  sort: number;
  createdAt: string;
  updatedAt: string | null;
}

export default function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(getStoredPageSize);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    document: DocumentItem | null;
    mode: "single" | "bulk";
  }>({
    open: false,
    document: null,
    mode: "single",
  });
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    loadDocuments();
  }, [page, pageSize, debouncedSearch]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiService.getDocuments({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setDocuments(data);
      setSelectedDocumentIds((prev) =>
        prev.filter((id) => data.some((doc: DocumentItem) => doc.id === id))
      );
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
  };

  const handleDelete = async () => {
    try {
      if (deleteModal.mode === "bulk") {
        if (selectedDocumentIds.length === 0) return;
        await apiService.deleteDocuments(selectedDocumentIds);
        setSelectedDocumentIds([]);
      } else {
        if (!deleteModal.document) return;
        await apiService.deleteDocument(deleteModal.document.id);
      }
      setDeleteModal({ open: false, document: null, mode: "single" });
      loadDocuments();
    } catch (error: any) {
      alert(error.message || "Failed to delete document");
    }
  };

  const buildUrl = (src: string): string => {
    const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
    return `${API_BASE_URL}${normalizedSrc}`;
  };

  const handleCopy = async (doc: DocumentItem) => {
    const url = buildUrl(doc.src);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(doc.id);
      setTimeout(() => {
        setCopiedId((current) => (current === doc.id ? null : current));
      }, 2000);
    } catch {
      alert("Failed to copy URL to clipboard");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "url",
      label: "URL",
      render: (doc: DocumentItem) => {
        const url = buildUrl(doc.src);
        const isCopied = copiedId === doc.id;
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              {url}
            </a>
            <div className="relative flex shrink-0 group">
              <button
                type="button"
                onClick={() => handleCopy(doc)}
                aria-label={isCopied ? "Copied!" : "Copy URL"}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-500 hover:bg-brand-500/5 dark:border-gray-700 dark:text-gray-400 dark:hover:text-brand-400 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
              >
                <CopyIcon className="size-4" />
              </button>
              <span
                role="tooltip"
                className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-xs font-medium whitespace-nowrap rounded bg-gray-800 text-white shadow-sm transition-opacity duration-150 pointer-events-none z-10 dark:bg-gray-700 ${
                  isCopied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isCopied ? "Copied!" : "Copy URL"}
              </span>
            </div>
          </div>
        );
      },
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
      render: (doc: DocumentItem) =>
        new Date(doc.createdAt).toLocaleDateString(),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (doc: DocumentItem) =>
        doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "—",
    },
  ];

  return (
    <>
      <PageMeta
        title="Documents | Admin"
        description="Manage uploaded documents"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Documents
          </h2>
          <div className="flex items-center gap-2">
            {selectedDocumentIds.length > 0 && (
              <Button
                size="sm"
                onClick={() =>
                  setDeleteModal({ open: true, document: null, mode: "bulk" })
                }
                className="bg-error-500 hover:bg-error-600"
                title={`Delete ${selectedDocumentIds.length} selected document(s)`}
              >
                Delete Selected ({selectedDocumentIds.length})
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate("/documents/new")}
              title="Add new document"
            >
              <PlusIcon className="size-5" />
            </Button>
          </div>
        </div>

        <FilterPanel
          open={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
          onClear={handleClearFilters}
        >
          <div>
            <Label>Search name</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by document name"
            />
          </div>
        </FilterPanel>

        <AdminTable
          columns={columns}
          data={documents}
          loading={loading}
          selectable
          selectedIds={selectedDocumentIds}
          onSelectionChange={setSelectedDocumentIds}
          onEdit={(doc) => navigate(`/documents/${doc.id}/edit`)}
          onDelete={(doc) =>
            setDeleteModal({ open: true, document: doc, mode: "single" })
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
          onClose={() =>
            setDeleteModal({ open: false, document: null, mode: "single" })
          }
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {deleteModal.mode === "bulk"
                ? "Delete Selected Documents"
                : "Delete Document"}
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {deleteModal.mode === "bulk"
                ? `Are you sure you want to delete ${selectedDocumentIds.length} selected document(s)? This action cannot be undone.`
                : `Are you sure you want to delete "${deleteModal.document?.name}"? This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() =>
                  setDeleteModal({ open: false, document: null, mode: "single" })
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

