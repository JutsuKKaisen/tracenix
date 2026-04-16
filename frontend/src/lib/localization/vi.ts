const VN_LOCALE = "vi-VN";
const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Tổng quan",
  projects: "Dự án",
  documents: "Hồ sơ",
  approvals: "Phê duyệt",
  checklist: "Danh mục tuân thủ",
  activity: "Nhật ký thao tác",
  notifications: "Thông báo",
  users: "Người dùng",
  settings: "Cài đặt",
  login: "Login",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  draft: "Bản nháp",
  submitted: "Đã gửi duyệt",
  under_review: "Đang xem xét",
  revision_required: "Cần chỉnh sửa",
  approved: "Đã phê duyệt",
  rejected: "Từ chối",
  archived: "Lưu trữ",
};

export const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  pending: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  overdue: "Quá hạn",
  waived: "Miễn áp dụng",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Đang triển khai",
  completed: "Hoàn thành",
  on_hold: "Tạm dừng",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  system_admin: "Quản trị hệ thống",
  project_manager: "Quản lý dự án",
  document_controller: "Điều phối hồ sơ",
  site_engineer: "Kỹ sư hiện trường",
  approver: "Phê duyệt",
  viewer: "Theo dõi",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  login: "đã đăng nhập",
  user_create: "đã tạo người dùng",
  user_update: "đã cập nhật người dùng",
  project_create: "đã tạo dự án",
  project_update: "đã cập nhật dự án",
  document_create: "đã tạo hồ sơ",
  document_update: "đã cập nhật hồ sơ",
  document_version_upload: "đã tải phiên bản mới",
  document_submit: "đã gửi duyệt hồ sơ",
  document_review: "đã nhận hồ sơ để xem xét",
  document_approve: "đã phê duyệt hồ sơ",
  document_reject: "đã từ chối hồ sơ",
  document_request_revision: "đã yêu cầu chỉnh sửa hồ sơ",
  document_archive: "đã lưu trữ hồ sơ",
  checklist_item_create: "đã tạo hạng mục tuân thủ",
  checklist_item_update: "đã cập nhật hạng mục tuân thủ",
};

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

export function formatDateVN(input: Date | string | number): string {
  return new Intl.DateTimeFormat(VN_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: VN_TIME_ZONE,
  }).format(toDate(input));
}

export function formatTimeVN(input: Date | string | number): string {
  return new Intl.DateTimeFormat(VN_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: VN_TIME_ZONE,
  }).format(toDate(input));
}

export function formatDateTimeVN(input: Date | string | number): string {
  return `${formatDateVN(input)} ${formatTimeVN(input)}`;
}

export function formatCurrencyVND(value: number): string {
  return new Intl.NumberFormat(VN_LOCALE, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumberVN(value: number): string {
  return new Intl.NumberFormat(VN_LOCALE).format(value);
}
