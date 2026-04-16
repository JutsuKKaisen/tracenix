export type UserRole = 
  | "system_admin"
  | "project_manager"
  | "document_controller"
  | "site_engineer"
  | "approver"
  | "viewer";

export type DocumentStatus = 
  | "draft"
  | "submitted"
  | "under_review"
  | "revision_required"
  | "approved"
  | "rejected"
  | "archived";

export type ChecklistStatus = 
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "waived";

export type ProjectStatus = "active" | "completed" | "on_hold";

export type NotificationType = "info" | "warning" | "success" | "error";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface DocumentEntity {
  id: string;
  project_id: string;
  category_id: string;
  title: string;
  document_code: string;
  description: string;
  current_status: DocumentStatus;
  current_version_id: string | null;
  assignee_user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_version?: DocumentVersion | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  change_note: string | null;
  is_current: boolean;
}

export interface WorkflowAction {
  id: string;
  document_id: string;
  from_status: DocumentStatus;
  to_status: DocumentStatus;
  action_type: string;
  actor_user_id: string;
  comment: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  project_id: string;
  category_id: string;
  title: string;
  description: string;
  required: boolean;
  due_date: string | null;
  status: ChecklistStatus;
  related_document_id: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardSummary {
  total_documents: number;
  documents_by_status: Record<DocumentStatus, number>;
  total_checklist_items: number;
  overdue_checklist_count: number;
  approved_documents_count: number;
  revision_required_count: number;
  pending_review_count: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserCreate {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

export interface ProjectCreate {
  code: string;
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
}

export interface DocumentCreate {
  project_id: string;
  category_id: string;
  title: string;
  document_code: string;
  description?: string | null;
  assignee_user_id?: string | null;
}

export interface DocumentActionRequest {
  comment?: string | null;
}

export interface ChecklistItemCreate {
  project_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  required?: boolean;
  due_date?: string | null;
  status?: ChecklistStatus;
  related_document_id?: string | null;
  owner_user_id?: string | null;
}

export interface ChecklistItemUpdate {
  category_id?: string;
  title?: string;
  description?: string | null;
  required?: boolean;
  due_date?: string | null;
  status?: ChecklistStatus;
  related_document_id?: string | null;
  owner_user_id?: string | null;
}
