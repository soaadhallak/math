import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminTable from "../../../components/admin/AdminTable";
import FilterPanel from "../../../components/admin/FilterPanel";
import Pagination from "../../../components/admin/Pagination";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { apiService } from "../../../services/api";
import { getStoredPageSize } from "../../../lib/pagination";
import { Modal } from "../../../components/ui/modal";
import { EyeIcon, DownloadIcon } from "../../../icons";

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

function truncate(s: string | null | undefined, n = 80): string {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function MessagesList() {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
  const [readFilter, setReadFilter] = useState<"" | "true" | "false">("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedReadFilter, setDebouncedReadFilter] = useState(readFilter);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; item: Message | null }>({
    open: false,
    item: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedReadFilter(readFilter);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, readFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, readFilter]);

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, debouncedReadFilter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const isRead =
        debouncedReadFilter === "" ? undefined : debouncedReadFilter === "true";
      const res = await apiService.getMessages({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        isRead,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setItems(data);
      if (pag) setPagination(pag);
    } catch (error: any) {
      alert(error.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setReadFilter("");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await apiService.deleteMessage(deleteModal.item.id);
      setDeleteModal({ open: false, item: null });
      loadMessages();
    } catch (error: any) {
      alert(error.message || "Failed to delete message");
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const isRead =
        debouncedReadFilter === "" ? undefined : debouncedReadFilter === "true";
      const res = await apiService.getMessages({
        search: debouncedSearch.trim() || undefined,
        isRead,
      });
      const all: Message[] = Array.isArray(res) ? res : res.data;

      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Subject",
        "Message",
        "Status",
        "IP Address",
        "User Agent",
        "Received",
        "Updated",
      ];
      const rows = all.map((m) => [
        m.id,
        m.name,
        m.email,
        m.phone ?? "",
        m.subject,
        m.message,
        m.isRead ? "Read" : "New",
        m.ipAddress ?? "",
        m.userAgent ?? "",
        new Date(m.createdAt).toISOString(),
        new Date(m.updatedAt).toISOString(),
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map(csvEscape).join(","))
        .join("\r\n");

      const blob = new Blob(["﻿" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      link.href = url;
      link.download = `messages-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || "Failed to export messages");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "From",
      render: (m: Message) => (
        <div className="flex flex-col">
          <span className={`font-medium ${m.isRead ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-white/90"}`}>
            {m.name}
          </span>
          <a
            href={`mailto:${m.email}`}
            className="text-xs text-brand-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {m.email}
          </a>
          {m.phone && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{m.phone}</span>
          )}
        </div>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (m: Message) => (
        <span className={m.isRead ? "" : "font-semibold text-gray-900 dark:text-white/90"}>
          {truncate(m.subject, 60)}
        </span>
      ),
    },
    {
      key: "message",
      label: "Message",
      render: (m: Message) => (
        <span className="text-gray-600 dark:text-gray-400">{truncate(m.message, 90)}</span>
      ),
    },
    {
      key: "isRead",
      label: "Status",
      align: "center" as const,
      render: (m: Message) => (
        <Badge size="sm" color={m.isRead ? "success" : "warning"}>
          {m.isRead ? "Read" : "New"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Received",
      align: "center" as const,
      render: (m: Message) => new Date(m.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <PageMeta title="Messages | Admin" description="Contact form submissions" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Messages
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting || loading}
            startIcon={<DownloadIcon className="size-4 fill-current" />}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        <FilterPanel
          open={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
          onClear={handleClearFilters}
        >
          <div>
            <Label>Search</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, subject, message..."
            />
          </div>
          <div>
            <Label>Read status</Label>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter((e.target.value || "") as "" | "true" | "false")}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="">All</option>
              <option value="false">New (unread)</option>
              <option value="true">Read</option>
            </select>
          </div>
        </FilterPanel>

        <AdminTable
          columns={columns}
          data={items}
          loading={loading}
          onEdit={(m) => navigate(`/messages/${m.id}`)}
          editIcon={<EyeIcon className="size-5 fill-current" />}
          editTitle="View"
          onDelete={(m) => setDeleteModal({ open: true, item: m })}
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
          onClose={() => setDeleteModal({ open: false, item: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Message</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the message from &quot;{deleteModal.item?.name}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button size="sm" onClick={() => setDeleteModal({ open: false, item: null })}>
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
