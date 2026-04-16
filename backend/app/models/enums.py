from enum import StrEnum


class UserRole(StrEnum):
    SYSTEM_ADMIN = "system_admin"
    PROJECT_MANAGER = "project_manager"
    DOCUMENT_CONTROLLER = "document_controller"
    SITE_ENGINEER = "site_engineer"
    APPROVER = "approver"
    VIEWER = "viewer"


class ProjectStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class DocumentStatus(StrEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REVISION_REQUIRED = "revision_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ChecklistStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    WAIVED = "waived"


class NotificationType(StrEnum):
    INFO = "info"
    WARNING = "warning"
    SUCCESS = "success"
    ERROR = "error"

