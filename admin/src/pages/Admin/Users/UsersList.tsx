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
import { PlusIcon } from "../../../icons";

interface User {
  id: number;
  username: string;
  status: boolean;
  sort: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
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
    user: User | null;
  }>({
    open: false,
    user: null,
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
    loadUsers();
  }, [page, pageSize, debouncedSearch, debouncedStatusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const status =
        debouncedStatusFilter === ""
          ? undefined
          : debouncedStatusFilter === "true";
      const res = await apiService.getUsers({
        page,
        limit: pageSize,
        search: debouncedSearch.trim() || undefined,
        status,
      });
      const data = Array.isArray(res) ? res : res.data;
      const pag = Array.isArray(res) ? null : res.pagination;
      setUsers(data);
      if (pag) setPagination(pag);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load users";
      alert(msg);
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
    if (!deleteModal.user) return;

    try {
      await apiService.deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      loadUsers();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete user";
      alert(msg);
    }
  };

  const columns = [
    {
      key: "username",
      label: "Username",
      render: (user: User) => user.username,
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (user: User) => (
        <Badge size="sm" color={user.status ? "success" : "error"}>
          {user.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "sort",
      label: "Sort",
      align: "center" as const,
      render: (user: User) => user.sort,
    },
    {
      key: "createdAt",
      label: "Created At",
      align: "center" as const,
      render: (user: User) =>
        user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : "—",
    },
    {
      key: "updatedAt",
      label: "Updated At",
      align: "center" as const,
      render: (user: User) =>
        user.updatedAt
          ? new Date(user.updatedAt).toLocaleDateString()
          : "—",
    },
  ];

  return (
    <>
      <PageMeta
        title="Users | Admin"
        description="Manage users"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Users
          </h2>
          <Button
            size="sm"
            onClick={() => navigate("/users/new")}
            title="Add new user"
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
            <Label>Search username</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username"
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
          data={users}
          loading={loading}
          onEdit={(user) =>
            navigate(`/users/${user.id}/edit`)
          }
          onDelete={(user) =>
            setDeleteModal({ open: true, user })
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
          onClose={() => setDeleteModal({ open: false, user: null })}
        >
          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete User</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to delete user &quot;{deleteModal.user?.username}&quot;?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                size="sm"
                onClick={() =>
                  setDeleteModal({ open: false, user: null })
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
