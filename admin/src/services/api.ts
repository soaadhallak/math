import { ADMIN_PAGE_SIZE } from "../lib/pagination.js";

/** API/website origin (from .env VITE_API_BASE_URL). Use for document URLs, image URLs, etc. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/** Maximum image upload size: 10 MB (must match backend limit) */
export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed image extensions (must match backend) */
const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".svg",
  ".webp",
  ".bmp",
  ".ico",
  ".avif",
];

/** Maximum document upload size: 10 MB (must match backend limit) */
export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Allowed document extensions for Document uploads */
const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".odt",
  ".rtf",
  ".md",
];

/** Allowed file extensions for Documents endpoint uploads (documents + images). */
const ALLOWED_DOCUMENT_UPLOAD_EXTENSIONS = [
  ...ALLOWED_DOCUMENT_EXTENSIONS,
  ...ALLOWED_IMAGE_EXTENSIONS,
];

/** Returns true if the file has an allowed image extension. */
export function isAllowedImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Returns true if the file is an SVG (required for service montages). */
export function isAllowedSvgFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".svg");
}

/** Returns true if the file has an allowed document extension. */
export function isAllowedDocumentFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/** Returns true if the file can be uploaded to Documents endpoint (images + documents). */
export function isAllowedDocumentUploadFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ALLOWED_DOCUMENT_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  [key: string]: any;
}

class ApiService {
  private baseURL: string;
  private credentials: RequestCredentials;
  private sessionLostHandler: (() => void) | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.credentials = "include"; // Include cookies for session
  }

  /** Register a callback to run when the server returns 401/403 (session lost). Used for auto logout and redirect. */
  setSessionLostHandler(handler: () => void): void {
    this.sessionLostHandler = handler;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      credentials: this.credentials,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      let data: any = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON body (e.g. empty or HTML error page)
      }

      const isSessionLost =
        (response.status === 401 || response.status === 403) &&
        !endpoint.includes("/api/auth/login");

      if (!response.ok) {
        if (isSessionLost) {
          this.sessionLostHandler?.();
        }
        const message = data.message || data.error || "Request failed";
        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth
  async login(
    username: string,
    password: string,
    rememberMe: boolean = true,
  ): Promise<ApiResponse> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, rememberMe }),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request("/api/auth/logout", {
      method: "POST",
    });
  }

  async checkAuth(): Promise<ApiResponse> {
    return this.request("/api/auth/check");
  }

  // Services
  async getServices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: boolean;
    showOnHome?: boolean;
  }): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    if (params?.status !== undefined)
      searchParams.set("status", String(params.status));
    if (params?.showOnHome !== undefined)
      searchParams.set("showOnHome", String(params.showOnHome));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    if (query) return this.request(`/api/services${query}`);
    return this.request("/api/services");
  }

  async getServiceBySlug(slug: string): Promise<any> {
    return this.request(`/api/services/${slug}`);
  }

  async getServiceById(id: number): Promise<any> {
    return this.request(`/api/services/admin/${id}`);
  }

  async createService(data: any): Promise<any> {
    return this.request("/api/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateService(id: number, data: any): Promise<any> {
    return this.request(`/api/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: number): Promise<ApiResponse> {
    return this.request(`/api/services/${id}`, {
      method: "DELETE",
    });
  }

  // Project Categories
  async getProjectCategories(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: boolean;
  }): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    if (params?.status !== undefined)
      searchParams.set("status", String(params.status));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    if (query) return this.request(`/api/project-categories${query}`);
    return this.request("/api/project-categories");
  }

  async getProjectCategoryById(id: number): Promise<any> {
    return this.request(`/api/project-categories/${id}`);
  }

  async createProjectCategory(data: any): Promise<any> {
    return this.request("/api/project-categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProjectCategory(id: number, data: any): Promise<any> {
    return this.request(`/api/project-categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProjectCategory(id: number): Promise<ApiResponse> {
    return this.request(`/api/project-categories/${id}`, {
      method: "DELETE",
    });
  }

  // Projects
  async getProjects(
    categoryId?: number,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: boolean;
    },
  ): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (categoryId != null) searchParams.set("categoryId", String(categoryId));
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    if (params?.status !== undefined)
      searchParams.set("status", String(params.status));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request(`/api/projects${query}`);
  }

  async getProjectBySlug(slug: string): Promise<any> {
    return this.request(`/api/projects/${slug}`);
  }

  async getProjectById(id: number): Promise<any> {
    return this.request(`/api/projects/admin/${id}`);
  }

  async createProject(data: any): Promise<any> {
    return this.request("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: number, data: any): Promise<any> {
    return this.request(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: number): Promise<ApiResponse> {
    return this.request(`/api/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Reference Logos
  async getReferenceLogos(
    status?: boolean,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: boolean;
    },
  ): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.status !== undefined)
      searchParams.set("status", String(params.status));
    else if (status !== undefined) searchParams.set("status", String(status));
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request(`/api/reference-logos${query}`);
  }

  async getReferenceLogoById(id: number): Promise<any> {
    return this.request(`/api/reference-logos/${id}`);
  }

  async createReferenceLogo(data: any): Promise<any> {
    return this.request("/api/reference-logos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateReferenceLogo(id: number, data: any): Promise<any> {
    return this.request(`/api/reference-logos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteReferenceLogo(id: number): Promise<ApiResponse> {
    return this.request(`/api/reference-logos/${id}`, {
      method: "DELETE",
    });
  }

  // Users (CRUD)
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: boolean;
  }): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    if (params?.status !== undefined)
      searchParams.set("status", String(params.status));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    if (query) return this.request(`/api/users${query}`);
    return this.request("/api/users");
  }

  async getUserById(id: number): Promise<any> {
    return this.request(`/api/users/${id}`);
  }

  async createUser(data: any): Promise<any> {
    return this.request("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: any): Promise<any> {
    return this.request(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<ApiResponse> {
    return this.request(`/api/users/${id}`, {
      method: "DELETE",
    });
  }

  // User Logs (read-only)
  async getUserLogs(params?: {
    userId?: number;
    username?: string;
    endpoint?: string;
    httpMethod?: string;
    statusCode?: number;
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    executionTimeMin?: number;
    executionTimeMax?: number;
  }): Promise<{ logs: any[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    return this.request(`/api/user-logs${query ? `?${query}` : ""}`);
  }

  async getUserLogById(id: number): Promise<any> {
    return this.request(`/api/user-logs/${id}`);
  }

  // Documents
  async getDocuments(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    if (query) return this.request(`/api/documents${query}`);
    return this.request("/api/documents");
  }

  async getDocumentById(id: number): Promise<any> {
    return this.request(`/api/documents/${id}`);
  }

  async createDocument(data: any): Promise<any> {
    return this.request("/api/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDocument(id: number, data: any): Promise<any> {
    return this.request(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: number): Promise<ApiResponse> {
    return this.request(`/api/documents/${id}`, {
      method: "DELETE",
    });
  }

  async deleteDocuments(ids: number[]): Promise<ApiResponse> {
    return this.request("/api/documents/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async uploadDocumentAsset(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseURL}/api/documents/upload`, {
      method: "POST",
      credentials: this.credentials,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Upload failed");
    }

    return response.json();
  }

  // File Upload
  async uploadFile(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.baseURL}/api/upload/single`, {
      method: "POST",
      credentials: this.credentials,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Upload failed");
    }

    const result = await response.json();
    // Return the path from the file object
    return result.file?.path || result.path || result;
  }

  // Messages (contact form)
  async getMessages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isRead?: boolean;
  }): Promise<
    | any[]
    | {
        data: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
  > {
    const searchParams = new URLSearchParams();
    if (params?.isRead !== undefined)
      searchParams.set("isRead", String(params.isRead));
    if (params?.page != null || params?.limit != null) {
      searchParams.set("page", String(params.page ?? 1));
      searchParams.set("limit", String(params.limit ?? ADMIN_PAGE_SIZE));
    }
    if (params?.search != null && params.search.trim() !== "")
      searchParams.set("search", params.search.trim());
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return this.request(`/api/messages${query}`);
  }

  async getMessageById(id: number): Promise<any> {
    return this.request(`/api/messages/${id}`);
  }

  async markMessageRead(id: number, isRead: boolean = true): Promise<any> {
    return this.request(`/api/messages/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ isRead }),
    });
  }

  async deleteMessage(id: number): Promise<ApiResponse> {
    return this.request(`/api/messages/${id}`, {
      method: "DELETE",
    });
  }

  async uploadFiles(files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${this.baseURL}/api/upload/multiple`, {
      method: "POST",
      credentials: this.credentials,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || error.error || "Upload failed");
    }

    return response.json();
  }
}

export const apiService = new ApiService();
