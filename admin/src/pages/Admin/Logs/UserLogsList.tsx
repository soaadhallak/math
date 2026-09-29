import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import AdminTable from "../../../components/admin/AdminTable";
import FilterPanel from "../../../components/admin/FilterPanel";
import Pagination from "../../../components/admin/Pagination";
import { getStoredPageSize } from "../../../lib/pagination";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Badge from "../../../components/ui/badge/Badge";
import { apiService } from "../../../services/api";

/** Convert dd/mm/yyyy to YYYY-MM-DD for API, or null if invalid */
function ddMmYyyyToIso(s: string): string | null {
  if (!s || typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return null;
  const [d, m, y] = trimmed.split("/").map(Number);
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface UserLog {
  id: number;
  userId?: number;
  endpoint: string;
  httpMethod: string;
  ipAddress?: string;
  responseStatusCode: number;
  userAgent?: string;
  executionTimeMs: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}

export default function UserLogsList() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(getStoredPageSize);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filters (start/end date stored as dd/mm/yyyy)
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [httpMethod, setHttpMethod] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [executionTimeMin, setExecutionTimeMin] = useState("");
  const [executionTimeMax, setExecutionTimeMax] = useState("");

  useEffect(() => {
    loadLogs();
  }, [
    pagination.page,
    pageSize,
    userId,
    username,
    endpoint,
    httpMethod,
    statusCode,
    startDate,
    endDate,
    ipAddress,
    executionTimeMin,
    executionTimeMax,
  ]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: pagination.page,
        pageSize,
      };
      const uid = parseInt(userId, 10);
      if (userId !== "" && !isNaN(uid)) params.userId = uid;
      if (username.trim()) params.username = username.trim();
      if (endpoint.trim()) params.endpoint = endpoint.trim();
      if (httpMethod) params.httpMethod = httpMethod;
      const code = parseInt(statusCode, 10);
      if (statusCode !== "" && !isNaN(code)) params.statusCode = code;
      const startIso = ddMmYyyyToIso(startDate);
      if (startIso) params.startDate = startIso;
      const endIso = ddMmYyyyToIso(endDate);
      if (endIso) params.endDate = endIso;
      if (ipAddress.trim()) params.ipAddress = ipAddress.trim();
      const minMs = parseInt(executionTimeMin, 10);
      if (executionTimeMin !== "" && !isNaN(minMs)) params.executionTimeMin = minMs;
      const maxMs = parseInt(executionTimeMax, 10);
      if (executionTimeMax !== "" && !isNaN(maxMs)) params.executionTimeMax = maxMs;

      const response = await apiService.getUserLogs(params);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    loadLogs();
  };

  const handleClearFilters = () => {
    setUserId("");
    setUsername("");
    setEndpoint("");
    setHttpMethod("");
    setStatusCode("");
    setStartDate("");
    setEndDate("");
    setIpAddress("");
    setExecutionTimeMin("");
    setExecutionTimeMax("");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const getStatusColor = (statusCode: number): "success" | "warning" | "error" => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 400 && statusCode < 500) return "warning";
    if (statusCode >= 500) return "error";
    return "success";
  };

  const columns = [
    {
      key: "user",
      label: "User",
      render: (log: UserLog) => log.user?.username || "Anonymous",
    },
    {
      key: "endpoint",
      label: "Endpoint",
    },
    {
      key: "method",
      label: "Method",
      render: (log: UserLog) => (
        <Badge size="sm" color="success">
          {log.httpMethod}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (log: UserLog) => (
        <Badge size="sm" color={getStatusColor(log.responseStatusCode)}>
          {log.responseStatusCode}
        </Badge>
      ),
    },
    {
      key: "ip",
      label: "IP Address",
      render: (log: UserLog) => log.ipAddress || "-",
    },
    {
      key: "time",
      label: "Execution Time",
      render: (log: UserLog) => `${log.executionTimeMs}ms`,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (log: UserLog) =>
        new Date(log.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <PageMeta
        title="User Logs | Admin"
        description="View user activity logs"
      />
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          User Logs
        </h2>

        <FilterPanel
          open={showFilters}
          onToggle={() => setShowFilters((v) => !v)}
          onApply={handleFilter}
          onClear={handleClearFilters}
        >
          <div>
            <Label>User ID</Label>
                  <Input
                    type="number"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Filter by user ID"
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Filter by username"
                  />
                </div>
                <div>
                  <Label>Endpoint</Label>
                  <Input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="Filter by endpoint"
                  />
                </div>
                <div>
                  <Label>HTTP Method</Label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <Input
                    type="number"
                    value={statusCode}
                    onChange={(e) => setStatusCode(e.target.value)}
                    placeholder="Filter by status code"
                  />
                </div>
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Search by IP"
                  />
                </div>
                <div>
                  <Label>Execution time (ms) — Min</Label>
                  <Input
                    type="number"
                    min="0"
                    value={executionTimeMin}
                    onChange={(e) => setExecutionTimeMin(e.target.value)}
                    placeholder="Min ms"
                  />
                </div>
                <div>
                  <Label>Execution time (ms) — Max</Label>
                  <Input
                    type="number"
                    min="0"
                    value={executionTimeMax}
                    onChange={(e) => setExecutionTimeMax(e.target.value)}
                    placeholder="Max ms"
                  />
                </div>
                <div>
                  <Label>Start Date (dd/mm/yyyy)</Label>
                  <Input
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
          <div>
            <Label>End Date (dd/mm/yyyy)</Label>
            <Input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="dd/mm/yyyy"
            />
          </div>
        </FilterPanel>

        {/* Table */}
        <AdminTable columns={columns} data={logs} loading={loading} actions={false} />

        <Pagination
          pagination={pagination}
          onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        />
      </div>
    </>
  );
}
