import {
  AuditLog,
  ChecklistItem,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  DashboardSummary,
  DocumentActionRequest,
  DocumentCreate,
  DocumentEntity,
  DocumentVersion,
  LoginRequest,
  Notification,
  Project,
  ProjectCreate,
  TokenResponse,
  User,
  UserCreate,
  WorkflowAction,
} from "@/types";

const DEFAULT_API_BASE_URL = "/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
  isFormData?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  const resolvedBaseUrl = /^https?:\/\//.test(baseUrl)
    ? baseUrl
    : typeof window !== "undefined"
      ? `${window.location.origin}${baseUrl}`
      : `http://localhost${baseUrl}`;
  const url = new URL(`${resolvedBaseUrl}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") {
        errorMessage = payload.detail;
      } else if (Array.isArray(payload?.detail) && payload.detail.length > 0) {
        errorMessage = payload.detail[0]?.msg || errorMessage;
      }
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        errorMessage = fallbackText;
      }
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body, query, signal, isFormData = false } = options;
  const headers = new Headers();

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    signal,
  });

  return parseResponse<T>(response);
}

export const api = {
  login: (payload: LoginRequest) => apiRequest<TokenResponse>("/auth/login", { method: "POST", body: payload }),
  me: (token: string) => apiRequest<User>("/auth/me", { token }),

  listUsers: (token: string) => apiRequest<User[]>("/users", { token }),
  createUser: (token: string, payload: UserCreate) => apiRequest<User>("/users", { method: "POST", token, body: payload }),

  listProjects: (token: string) => apiRequest<Project[]>("/projects", { token }),
  getProject: (token: string, projectId: string) => apiRequest<Project>(`/projects/${projectId}`, { token }),
  createProject: (token: string, payload: ProjectCreate) =>
    apiRequest<Project>("/projects", { method: "POST", token, body: payload }),

  listCategories: (token: string) =>
    apiRequest<{ id: string; name: string; code: string; description: string | null; is_active: boolean }[]>(
      "/document-categories",
      { token }
    ),

  listDocuments: (
    token: string,
    params?: { project_id?: string; current_status?: string | null }
  ) => apiRequest<DocumentEntity[]>("/documents", { token, query: params }),
  getDocument: (token: string, documentId: string) => apiRequest<DocumentEntity>(`/documents/${documentId}`, { token }),
  createDocument: (token: string, payload: DocumentCreate) =>
    apiRequest<DocumentEntity>("/documents", { method: "POST", token, body: payload }),
  uploadDocumentVersion: (token: string, documentId: string, file: File, changeNote?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (changeNote) {
      formData.append("change_note", changeNote);
    }
    return apiRequest<DocumentVersion>(`/documents/${documentId}/versions`, {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    });
  },
  listDocumentVersions: (token: string, documentId: string) =>
    apiRequest<DocumentVersion[]>(`/documents/${documentId}/versions`, { token }),
  listWorkflowActions: (token: string, documentId: string) =>
    apiRequest<WorkflowAction[]>(`/documents/${documentId}/workflow-actions`, { token }),
  transitionDocument: (token: string, documentId: string, action: string, payload: DocumentActionRequest) =>
    apiRequest<DocumentEntity>(`/documents/${documentId}/${action}`, { method: "POST", token, body: payload }),
  getVersionDownloadUrl: (documentId: string, versionId: string) =>
    `${getApiBaseUrl()}/documents/${documentId}/versions/${versionId}/download`,

  listChecklistItems: (token: string, params?: { project_id?: string; status?: string | null }) =>
    apiRequest<ChecklistItem[]>("/checklist-items", { token, query: params }),
  createChecklistItem: (token: string, payload: ChecklistItemCreate) =>
    apiRequest<ChecklistItem>("/checklist-items", { method: "POST", token, body: payload }),
  updateChecklistItem: (token: string, checklistId: string, payload: ChecklistItemUpdate) =>
    apiRequest<ChecklistItem>(`/checklist-items/${checklistId}`, { method: "PATCH", token, body: payload }),

  dashboardSummary: (token: string) => apiRequest<DashboardSummary>("/dashboard/summary", { token }),

  listNotifications: (token: string) => apiRequest<Notification[]>("/notifications", { token }),
  markNotificationAsRead: (token: string, notificationId: string) =>
    apiRequest<Notification>(`/notifications/${notificationId}/read`, { method: "PATCH", token }),

  listAuditLogs: (token: string, limit = 200) =>
    apiRequest<AuditLog[]>("/audit-logs", { token, query: { limit } }),
};
