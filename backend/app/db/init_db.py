from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.core.config import get_settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine
from app.models.audit_log import AuditLog
from app.models.checklist_item import ChecklistItem
from app.models.document import Document
from app.models.document_category import DocumentCategory
from app.models.document_version import DocumentVersion
from app.models.enums import (
    ChecklistStatus,
    DocumentStatus,
    NotificationType,
    ProjectStatus,
    UserRole,
)
from app.models.notification import Notification
from app.models.project import Project
from app.models.user import User
from app.models.workflow_action import WorkflowAction


def create_schema() -> None:
    Base.metadata.create_all(bind=engine)


def ensure_upload_root() -> None:
    settings = get_settings()
    Path(settings.upload_root).mkdir(parents=True, exist_ok=True)


def _timestamp(days_ago: int, hour: int = 9, minute: int = 0) -> datetime:
    target = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return target.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _slugify(value: str) -> str:
    lowered = value.lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", lowered)
    return normalized.strip("-")


def _ensure_seed_file(upload_root: Path, relative_path: str, title: str, version_number: int) -> int:
    absolute_path = upload_root / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    if not absolute_path.exists():
        content = (
            f"TRACENIX DEMO FILE\n"
            f"Title: {title}\n"
            f"Version: v{version_number}\n"
            f"Generated at: {datetime.now(timezone.utc).isoformat()}\n"
        ).encode("utf-8")
        absolute_path.write_bytes(content)
    return absolute_path.stat().st_size


def _get_or_create_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    role: UserRole,
    password: str,
    is_active: bool,
    created_at: datetime,
) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user:
        return user

    user = User(
        full_name=full_name,
        email=email,
        hashed_password=get_password_hash(password),
        role=role,
        is_active=is_active,
        created_at=created_at,
    )
    db.add(user)
    db.flush()
    return user


def _get_or_create_category(
    db: Session,
    *,
    code: str,
    name: str,
    description: str,
) -> DocumentCategory:
    category = db.scalar(select(DocumentCategory).where(DocumentCategory.code == code))
    if category:
        return category

    category = DocumentCategory(name=name, code=code, description=description, is_active=True)
    db.add(category)
    db.flush()
    return category


def _get_or_create_project(
    db: Session,
    *,
    code: str,
    name: str,
    description: str,
    status: ProjectStatus,
    start_date: date | None,
    end_date: date | None,
    created_at: datetime,
    updated_at: datetime,
) -> Project:
    project = db.scalar(select(Project).where(Project.code == code))
    if project:
        return project

    project = Project(
        code=code,
        name=name,
        description=description,
        status=status,
        start_date=start_date,
        end_date=end_date,
        created_at=created_at,
        updated_at=updated_at,
    )
    db.add(project)
    db.flush()
    return project


def _version_count_for_status(status: DocumentStatus) -> int:
    if status == DocumentStatus.ARCHIVED:
        return 4
    if status in (DocumentStatus.APPROVED, DocumentStatus.REVISION_REQUIRED):
        return 3
    if status in (DocumentStatus.UNDER_REVIEW, DocumentStatus.REJECTED):
        return 2
    return 1


def _build_document_payload(
    kind: str,
    *,
    material: str,
    system: str,
    zone: str,
    week: int,
) -> tuple[str, str]:
    if kind == "material":
        return (
            f"Hồ sơ nghiệm thu vật liệu đầu vào - {material}",
            "Tập hồ sơ tổng hợp chứng chỉ CO/CQ, biên bản kiểm tra kích thước và nghiệm thu vật tư đầu vào.",
        )
    if kind == "shopdrawing":
        return (
            f"Đề nghị phê duyệt bản vẽ shopdrawing {system}",
            "Bản vẽ phối hợp liên bộ môn kiến trúc - kết cấu - MEP để triển khai thi công thực tế tại hiện trường.",
        )
    if kind == "quality":
        return (
            f"Hồ sơ chất lượng hạng mục {zone}",
            "Báo cáo nghiệm thu nội bộ, checklist ITP, nhật ký thi công và hình ảnh hiện trường theo từng công đoạn.",
        )
    if kind == "acceptance":
        return (
            f"Biên bản nghiệm thu lắp đặt {system}",
            "Biên bản nghiệm thu lắp đặt có xác nhận của tư vấn giám sát và đại diện nhà thầu phụ chuyên ngành.",
        )
    if kind == "safety":
        return (
            f"Biên bản kiểm tra an toàn lao động tuần {week}",
            "Kết quả kiểm tra PPE, huấn luyện an toàn, nhật ký toolbox meeting và các hành động khắc phục tại chỗ.",
        )
    if kind == "site_report":
        return (
            f"Nhật ký thi công {zone}",
            "Nhật ký thi công hằng ngày, cập nhật nhân lực - máy móc - vật tư - điều kiện thời tiết và khối lượng thực hiện.",
        )
    if kind == "certificate":
        return (
            f"Chứng chỉ xuất xưởng {material}",
            "Tài liệu chứng nhận xuất xứ và kiểm định chất lượng lô vật tư theo yêu cầu hồ sơ mời thầu.",
        )
    if kind == "issue":
        return (
            f"Báo cáo sai lệch hiện trường {zone}",
            "Báo cáo NCR kèm nguyên nhân, ảnh hiện trường, phương án khắc phục và thời hạn đóng lỗi.",
        )
    if kind == "fire":
        return (
            f"Biên bản kiểm tra PCCC nội bộ {zone}",
            "Biên bản kiểm tra thiết bị chữa cháy, tín hiệu báo cháy và thử nghiệm vận hành hệ thống liên động.",
        )
    if kind == "handover":
        return (
            f"Biên bản bàn giao hồ sơ hoàn công {zone}",
            "Bộ hồ sơ hoàn công, danh mục bản vẽ as-built và biên bản bàn giao sang bộ phận vận hành.",
        )
    if kind == "compliance":
        return (
            f"Danh mục vật tư cần bổ sung chứng chỉ - {zone}",
            "Danh sách vật tư thiếu chứng chỉ hoặc tài liệu kỹ thuật để hoàn thiện hồ sơ tuân thủ trước nghiệm thu.",
        )
    return (
        f"Bản vẽ hoàn công {zone}",
        "Bản vẽ hoàn công cập nhật cao độ và vị trí lắp đặt thực tế sau thi công.",
    )


def _workflow_steps_for_status(
    *,
    status: DocumentStatus,
    submitter_id: str,
    reviewer_id: str,
) -> list[tuple[DocumentStatus, DocumentStatus, str, str, str]]:
    base_steps = [
        (
            DocumentStatus.DRAFT,
            DocumentStatus.SUBMITTED,
            "submit",
            submitter_id,
            "Đề nghị tiếp nhận hồ sơ để xem xét theo quy trình phê duyệt.",
        ),
    ]

    if status == DocumentStatus.DRAFT:
        return []
    if status == DocumentStatus.SUBMITTED:
        return base_steps

    review_step = (
        DocumentStatus.SUBMITTED,
        DocumentStatus.UNDER_REVIEW,
        "review",
        reviewer_id,
        "Đã nhận hồ sơ và bắt đầu kiểm tra tính đầy đủ của tài liệu đính kèm.",
    )
    if status == DocumentStatus.UNDER_REVIEW:
        return base_steps + [review_step]
    if status == DocumentStatus.APPROVED:
        return base_steps + [
            review_step,
            (
                DocumentStatus.UNDER_REVIEW,
                DocumentStatus.APPROVED,
                "approve",
                reviewer_id,
                "Hồ sơ đáp ứng yêu cầu kỹ thuật và đầy đủ chứng chỉ vật tư theo quy định.",
            ),
        ]
    if status == DocumentStatus.REJECTED:
        return base_steps + [
            review_step,
            (
                DocumentStatus.UNDER_REVIEW,
                DocumentStatus.REJECTED,
                "reject",
                reviewer_id,
                "Từ chối do thiếu chứng chỉ xuất xưởng thép hộp mạ kẽm và biên bản đo điện trở cách điện.",
            ),
        ]
    if status == DocumentStatus.REVISION_REQUIRED:
        return base_steps + [
            review_step,
            (
                DocumentStatus.UNDER_REVIEW,
                DocumentStatus.REVISION_REQUIRED,
                "request_revision",
                reviewer_id,
                "Yêu cầu chỉnh sửa: cập nhật shopdrawing theo cao độ thực tế và bổ sung bản tính tải trọng.",
            ),
        ]
    if status == DocumentStatus.ARCHIVED:
        return base_steps + [
            review_step,
            (
                DocumentStatus.UNDER_REVIEW,
                DocumentStatus.APPROVED,
                "approve",
                reviewer_id,
                "Đã phê duyệt hồ sơ hoàn công sau khi đối chiếu bản vẽ và biên bản nghiệm thu.",
            ),
            (
                DocumentStatus.APPROVED,
                DocumentStatus.ARCHIVED,
                "archive",
                reviewer_id,
                "Hồ sơ đã bàn giao đầy đủ, chuyển sang trạng thái lưu trữ phục vụ truy xuất.",
            ),
        ]
    return []


def _seed_users(db: Session, settings) -> dict[str, User]:
    users_by_email: dict[str, User] = {}

    users_by_email[settings.seed_admin_email] = _get_or_create_user(
        db,
        full_name=settings.seed_admin_full_name,
        email=settings.seed_admin_email,
        role=UserRole.SYSTEM_ADMIN,
        password=settings.seed_admin_password,
        is_active=True,
        created_at=_timestamp(480, 8, 30),
    )

    seed_users = [
        ("Nguyễn Minh Anh", "nguyen.minh.anh@tracenix.vn", UserRole.PROJECT_MANAGER, True, _timestamp(420, 8, 10)),
        ("Trần Quốc Bảo", "tran.quoc.bao@minhphat.vn", UserRole.DOCUMENT_CONTROLLER, True, _timestamp(400, 9, 0)),
        ("Lê Hoàng Nam", "le.hoang.nam@ankhang.vn", UserRole.SITE_ENGINEER, True, _timestamp(390, 9, 20)),
        ("Phạm Thu Trang", "pham.thu.trang@tracenix.vn", UserRole.APPROVER, True, _timestamp(380, 9, 40)),
        ("Võ Thanh Tùng", "vo.thanh.tung@thanhdat.vn", UserRole.APPROVER, True, _timestamp(370, 10, 0)),
        ("Bùi Hải Yến", "bui.hai.yen@truongson.vn", UserRole.DOCUMENT_CONTROLLER, True, _timestamp(360, 10, 20)),
        ("Đỗ Đức Huy", "do.duc.huy@phuckhang.vn", UserRole.SITE_ENGINEER, True, _timestamp(350, 10, 40)),
        ("Nguyễn Khánh Linh", "nguyen.khanh.linh@bqldongnam.gov.vn", UserRole.PROJECT_MANAGER, True, _timestamp(340, 11, 0)),
        ("Trương Gia Hân", "truong.gia.han@tanviet.vn", UserRole.VIEWER, True, _timestamp(330, 11, 20)),
        ("Hồ Quốc Việt", "ho.quoc.viet@logisticsbn.vn", UserRole.SITE_ENGINEER, True, _timestamp(320, 11, 40)),
        ("Dương Thanh Hà", "duong.thanh.ha@pcccservice.vn", UserRole.APPROVER, True, _timestamp(310, 13, 15)),
        ("Nguyễn Hữu Phúc", "nguyen.huu.phuc@cadivi-distributor.vn", UserRole.VIEWER, True, _timestamp(300, 14, 0)),
        ("Trần Ngọc Lan", "tran.ngoc.lan@tracenix.vn", UserRole.SYSTEM_ADMIN, True, _timestamp(290, 14, 45)),
        ("Lưu Gia Khánh", "luu.gia.khanh@namviet.vn", UserRole.DOCUMENT_CONTROLLER, True, _timestamp(280, 15, 30)),
    ]

    for full_name, email, role, is_active, created_at in seed_users:
        users_by_email[email] = _get_or_create_user(
            db=db,
            full_name=full_name,
            email=email,
            role=role,
            password="Demo@12345",
            is_active=is_active,
            created_at=created_at,
        )

    return users_by_email


def _seed_categories(db: Session) -> dict[str, DocumentCategory]:
    category_seeds = [
        ("METHOD", "Biện pháp thi công", "Biện pháp thi công và phương án triển khai theo từng hạng mục."),
        ("ITP", "Kế hoạch kiểm tra và thử nghiệm", "Inspection Test Plan cho từng công tác kiểm soát chất lượng."),
        ("RFI", "Yêu cầu nghiệm thu", "Request for Inspection trước khi chuyển bước thi công."),
        ("MATERIAL", "Phê duyệt vật tư", "Hồ sơ phê duyệt vật tư, chứng chỉ CO/CQ và kết quả thí nghiệm."),
        ("SHOP", "Shopdrawing", "Bản vẽ shopdrawing phục vụ thi công và phối hợp bộ môn."),
        ("QAQC", "Hồ sơ chất lượng", "Biên bản nghiệm thu nội bộ, checklist và hồ sơ QA/QC."),
        ("ACCP", "Nghiệm thu lắp đặt", "Biên bản nghiệm thu lắp đặt hệ thống và thiết bị."),
        ("HSE", "An toàn lao động", "Hồ sơ kiểm tra an toàn, toolbox meeting, biên bản HSE."),
        ("SITE", "Nhật ký hiện trường", "Nhật ký thi công, báo cáo tiến độ và điều phối hiện trường."),
        ("CERT", "Chứng chỉ và kiểm định", "Chứng chỉ xuất xưởng, kiểm định thiết bị và tài liệu pháp lý."),
        ("FIRE", "PCCC", "Hồ sơ thử nghiệm, kiểm tra và nghiệm thu hệ thống phòng cháy chữa cháy."),
        ("ISSUE", "Sai lệch và NCR", "Issue log, NCR và biện pháp khắc phục phòng ngừa."),
        ("HANDOVER", "Hoàn công và bàn giao", "Hồ sơ hoàn công, bàn giao và lưu trữ sau nghiệm thu."),
        ("COMPLY", "Tuân thủ pháp lý", "Hồ sơ tuân thủ pháp lý, kiểm tra nội bộ và báo cáo hiện trường."),
    ]

    categories_by_code: dict[str, DocumentCategory] = {}
    for code, name, description in category_seeds:
        categories_by_code[code] = _get_or_create_category(
            db=db,
            code=code,
            name=name,
            description=description,
        )
    return categories_by_code


def _seed_projects(db: Session) -> dict[str, Project]:
    project_seeds = [
        (
            "PRJ-VSIP-BD-01",
            "Dự án Nhà xưởng KCN VSIP Bình Dương",
            "Chủ đầu tư: Công ty Cổ phần Xây dựng Minh Phát. Địa điểm: KCN VSIP Bình Dương, TP. Thuận An, Bình Dương. "
            "Trọng tâm hồ sơ: vật tư đầu vào, shopdrawing MEP, nghiệm thu lắp đặt.",
            ProjectStatus.ACTIVE,
            date(2025, 1, 15),
            date(2026, 9, 30),
            _timestamp(230, 9, 0),
            _timestamp(1, 15, 30),
        ),
        (
            "PRJ-BN-LOG-02",
            "Dự án Trung tâm Logistics Bắc Ninh",
            "Chủ đầu tư: Công ty Cổ phần Hạ tầng Nam Việt. Địa điểm: KCN Yên Phong, Bắc Ninh. "
            "Phạm vi: kho cao tầng, hệ thống PCCC và kiểm soát chất lượng hồ sơ bàn giao vận hành.",
            ProjectStatus.ACTIVE,
            date(2025, 3, 1),
            date(2026, 12, 15),
            _timestamp(220, 9, 15),
            _timestamp(2, 16, 0),
        ),
        (
            "PRJ-LA-COLD-03",
            "Dự án Kho lạnh Long An",
            "Chủ đầu tư: Công ty TNHH Kỹ thuật An Khang. Địa điểm: Bến Lức, Long An. "
            "Hạng mục chính: panel cách nhiệt, hệ thống lạnh trung tâm và hồ sơ kiểm định thiết bị nâng.",
            ProjectStatus.ACTIVE,
            date(2025, 2, 10),
            date(2026, 10, 20),
            _timestamp(210, 9, 30),
            _timestamp(3, 14, 30),
        ),
        (
            "PRJ-YP-HQ-04",
            "Dự án Tòa nhà điều hành KCN Yên Phong",
            "Đơn vị quản lý: Ban Quản lý Dự án KCN Đông Nam. Địa điểm: KCN Yên Phong, Bắc Ninh. "
            "Tình trạng tạm dừng do chờ phê duyệt điều chỉnh thiết kế kiến trúc mặt đứng.",
            ProjectStatus.ON_HOLD,
            date(2024, 11, 5),
            date(2026, 8, 5),
            _timestamp(240, 10, 0),
            _timestamp(12, 11, 0),
        ),
        (
            "PRJ-Q7-RENO-05",
            "Dự án Cải tạo văn phòng Quận 7",
            "Chủ đầu tư: Công ty Cổ phần Công nghiệp Tân Việt. Địa điểm: Quận 7, TP. Hồ Chí Minh. "
            "Phạm vi: cải tạo nội thất, điện nhẹ, PCCC, hồ sơ hoàn công từng tầng.",
            ProjectStatus.ACTIVE,
            date(2025, 6, 15),
            date(2026, 4, 30),
            _timestamp(180, 10, 15),
            _timestamp(4, 9, 45),
        ),
        (
            "PRJ-DN-FOOD-06",
            "Dự án Nhà máy chế biến thực phẩm Đồng Nai",
            "Tổng thầu: Công ty TNHH Xây dựng và Cơ điện Phúc Khang. Địa điểm: KCN Amata Biên Hòa, Đồng Nai. "
            "Trọng tâm: GMP hồ sơ sạch, kiểm soát vật tư inox, nghiệm thu khu chế biến.",
            ProjectStatus.ACTIVE,
            date(2025, 4, 20),
            date(2026, 11, 20),
            _timestamp(170, 10, 30),
            _timestamp(2, 10, 20),
        ),
        (
            "PRJ-HP-MEP-07",
            "Dự án Hệ thống MEP xưởng sản xuất Hải Phòng",
            "Đơn vị thi công: Công ty TNHH Cơ điện Thành Đạt. Địa điểm: KCN Đình Vũ, Hải Phòng. "
            "Dự án đã hoàn thành giai đoạn bàn giao hồ sơ hoàn công và lưu trữ.",
            ProjectStatus.COMPLETED,
            date(2024, 7, 10),
            date(2025, 12, 30),
            _timestamp(300, 8, 0),
            _timestamp(18, 17, 10),
        ),
        (
            "PRJ-AMATA-08",
            "Dự án Mở rộng kho vận KCN Amata Biên Hòa",
            "Chủ đầu tư: Công ty Cổ phần Vật liệu Trường Sơn. Địa điểm: KCN Amata Biên Hòa, Đồng Nai. "
            "Hạng mục chính: kết cấu thép, mái tôn PU, đèn LED nhà xưởng và hồ sơ nghiệm thu đồng bộ.",
            ProjectStatus.ACTIVE,
            date(2025, 5, 30),
            date(2026, 12, 25),
            _timestamp(160, 11, 10),
            _timestamp(1, 13, 35),
        ),
        (
            "PRJ-SHTP-09",
            "Dự án Nhà máy linh kiện Khu Công nghệ cao TP. Hồ Chí Minh",
            "Chủ đầu tư: Công ty Cổ phần Công nghiệp Tân Việt. Địa điểm: Khu Công nghệ cao TP. Hồ Chí Minh, Thủ Đức. "
            "Phạm vi quản lý tập trung vào hồ sơ MEP, kiểm định thiết bị và checklist tuân thủ an toàn điện.",
            ProjectStatus.ACTIVE,
            date(2025, 8, 1),
            date(2027, 1, 15),
            _timestamp(120, 11, 30),
            _timestamp(5, 16, 10),
        ),
        (
            "PRJ-QN-PORT-10",
            "Dự án Trung tâm phân phối Cảng Cái Lân Quảng Ninh",
            "Chủ đầu tư: Công ty Cổ phần Hạ tầng Nam Việt. Địa điểm: TP. Hạ Long, Quảng Ninh. "
            "Dự án đang tạm dừng để cập nhật phương án giao thông nội bộ và phân kỳ đầu tư.",
            ProjectStatus.ON_HOLD,
            date(2025, 9, 15),
            date(2027, 3, 30),
            _timestamp(110, 12, 0),
            _timestamp(20, 14, 15),
        ),
    ]

    projects_by_code: dict[str, Project] = {}
    for code, name, description, status, start_date, end_date, created_at, updated_at in project_seeds:
        projects_by_code[code] = _get_or_create_project(
            db=db,
            code=code,
            name=name,
            description=description,
            status=status,
            start_date=start_date,
            end_date=end_date,
            created_at=created_at,
            updated_at=updated_at,
        )
    return projects_by_code


def _seed_documents(
    db: Session,
    *,
    categories_by_code: dict[str, DocumentCategory],
    projects_by_code: dict[str, Project],
    users_by_email: dict[str, User],
    upload_root: Path,
) -> dict[str, Document]:
    materials = [
        "thép hộp mạ kẽm",
        "thép hình H",
        "xi măng PCB40",
        "tôn cách nhiệt PU",
        "cáp điện Cadivi",
        "ống nhựa Bình Minh",
        "sơn chống thấm",
        "cửa chống cháy",
        "đèn LED nhà xưởng",
        "máy bơm nước",
        "thang máng cáp",
        "bê tông thương phẩm",
        "van công nghiệp",
        "thiết bị phòng cháy chữa cháy",
        "tủ điện phân phối",
        "cáp tín hiệu chống nhiễu",
        "quạt hút công nghiệp",
        "panel cách nhiệt",
    ]
    systems = [
        "hệ MEP khu nhà xưởng A",
        "hệ thống điện động lực tầng kỹ thuật",
        "hệ thống cấp thoát nước khu kho",
        "hệ thống thông gió và hút khói",
        "hệ thống PCCC khu đóng gói",
        "hệ thống tủ điện phân phối MSB",
        "hệ thống cáp tín hiệu chống nhiễu",
    ]
    zones = [
        "khu vực kho thành phẩm",
        "khu vực nhà xưởng A",
        "khu đóng gói",
        "khu văn phòng điều hành",
        "khu xuất hàng",
        "trạm bơm PCCC",
        "khu vực mái",
        "kho nguyên liệu",
        "khu vực bãi xe nâng",
        "khu phụ trợ cơ điện",
    ]
    blueprint_kinds = [
        ("material", "MATERIAL", "MAT"),
        ("shopdrawing", "SHOP", "SD"),
        ("quality", "QAQC", "QA"),
        ("acceptance", "ACCP", "NT"),
        ("safety", "HSE", "HSE"),
        ("site_report", "SITE", "NK"),
        ("certificate", "CERT", "CERT"),
        ("issue", "ISSUE", "NCR"),
        ("fire", "FIRE", "PCCC"),
        ("handover", "HANDOVER", "HC"),
        ("compliance", "COMPLY", "CP"),
        ("as_built", "HANDOVER", "AB"),
    ]
    status_cycle = [
        DocumentStatus.APPROVED,
        DocumentStatus.UNDER_REVIEW,
        DocumentStatus.SUBMITTED,
        DocumentStatus.REVISION_REQUIRED,
        DocumentStatus.DRAFT,
        DocumentStatus.ARCHIVED,
        DocumentStatus.REJECTED,
        DocumentStatus.APPROVED,
    ]
    version_notes = [
        "Phiên bản nộp ban đầu.",
        "Bổ sung số liệu đo đạc và cập nhật bản vẽ phối hợp.",
        "Hiệu chỉnh theo biên bản họp kỹ thuật và ý kiến tư vấn giám sát.",
        "Phiên bản hoàn công phục vụ bàn giao và lưu trữ.",
    ]

    controllers = [
        users_by_email["tran.quoc.bao@minhphat.vn"],
        users_by_email["bui.hai.yen@truongson.vn"],
        users_by_email["luu.gia.khanh@namviet.vn"],
    ]
    assignees = [
        users_by_email["le.hoang.nam@ankhang.vn"],
        users_by_email["do.duc.huy@phuckhang.vn"],
        users_by_email["ho.quoc.viet@logisticsbn.vn"],
    ]
    reviewers = [
        users_by_email["pham.thu.trang@tracenix.vn"],
        users_by_email["vo.thanh.tung@thanhdat.vn"],
        users_by_email["duong.thanh.ha@pcccservice.vn"],
    ]

    documents_by_code: dict[str, Document] = {}
    sequence = 1
    sorted_project_codes = sorted(projects_by_code.keys())

    for project_index, project_code in enumerate(sorted_project_codes):
        project = projects_by_code[project_code]
        project_token = project_code.replace("PRJ-", "")

        for slot in range(5):
            kind, category_code, prefix = blueprint_kinds[(project_index + slot) % len(blueprint_kinds)]
            category = categories_by_code.get(category_code) or categories_by_code["MATERIAL"]
            material = materials[(sequence + slot) % len(materials)]
            system = systems[(sequence + project_index) % len(systems)]
            zone = zones[(sequence + project_index + slot) % len(zones)]
            week = 10 + ((sequence + slot) % 12)

            title, description = _build_document_payload(
                kind,
                material=material,
                system=system,
                zone=zone,
                week=week,
            )
            document_code = f"{prefix}-{project_token}-{sequence:03d}"
            status = status_cycle[(sequence + project_index) % len(status_cycle)]
            creator = controllers[(sequence + project_index) % len(controllers)]
            assignee = assignees[(sequence + slot) % len(assignees)]
            reviewer = reviewers[(sequence + project_index + slot) % len(reviewers)]

            created_days_ago = max(6, 120 - (sequence * 2))
            updated_days_ago = max(0, created_days_ago - (sequence % 6 + 1))
            created_at = _timestamp(created_days_ago, 8 + (sequence % 7), (sequence * 7) % 60)
            updated_at = _timestamp(updated_days_ago, 9 + (sequence % 6), (sequence * 11) % 60)

            document = db.scalar(select(Document).where(Document.document_code == document_code))
            if not document:
                document = Document(
                    project_id=project.id,
                    category_id=category.id,
                    title=title,
                    document_code=document_code,
                    description=description,
                    current_status=status,
                    assignee_user_id=assignee.id,
                    created_by=creator.id,
                    created_at=created_at,
                    updated_at=updated_at,
                )
                db.add(document)
                db.flush()
            else:
                document.project_id = project.id
                document.category_id = category.id
                document.title = title
                document.description = description
                document.current_status = status
                document.assignee_user_id = assignee.id
                document.created_by = creator.id
                document.updated_at = updated_at

            version_count = _version_count_for_status(status)
            latest_version: DocumentVersion | None = None
            for version_number in range(1, version_count + 1):
                version = db.scalar(
                    select(DocumentVersion).where(
                        DocumentVersion.document_id == document.id,
                        DocumentVersion.version_number == version_number,
                    )
                )
                relative_path = (
                    f"seed/{_slugify(project.code)}/{_slugify(document.document_code)}/"
                    f"{_slugify(document.document_code)}_v{version_number}.pdf"
                )
                file_name = f"{document.document_code.replace('/', '-')}_v{version_number}.pdf"
                file_size = _ensure_seed_file(upload_root, relative_path, title, version_number)
                uploaded_at = created_at + timedelta(days=version_number)
                if uploaded_at > updated_at:
                    uploaded_at = updated_at - timedelta(hours=max(1, version_count - version_number))

                if not version:
                    version = DocumentVersion(
                        document_id=document.id,
                        version_number=version_number,
                        file_path=relative_path,
                        file_name=file_name,
                        mime_type="application/pdf",
                        file_size=file_size,
                        uploaded_by=creator.id if version_number == 1 else assignee.id,
                        uploaded_at=uploaded_at,
                        change_note=version_notes[min(version_number - 1, len(version_notes) - 1)],
                        is_current=False,
                    )
                    db.add(version)
                    db.flush()
                latest_version = version

            if latest_version:
                all_versions = db.scalars(
                    select(DocumentVersion).where(DocumentVersion.document_id == document.id)
                ).all()
                for version in all_versions:
                    version.is_current = version.id == latest_version.id
                document.current_version_id = latest_version.id

            steps = _workflow_steps_for_status(
                status=status,
                submitter_id=creator.id,
                reviewer_id=reviewer.id,
            )
            for step_index, (from_status, to_status, action_type, actor_user_id, comment) in enumerate(steps):
                existing_action = db.scalar(
                    select(WorkflowAction).where(
                        WorkflowAction.document_id == document.id,
                        WorkflowAction.from_status == from_status,
                        WorkflowAction.to_status == to_status,
                        WorkflowAction.action_type == action_type,
                    )
                )
                if existing_action:
                    continue

                action_created_at = updated_at - timedelta(hours=(len(steps) - step_index) * 6)
                workflow_action = WorkflowAction(
                    document_id=document.id,
                    from_status=from_status,
                    to_status=to_status,
                    action_type=action_type,
                    actor_user_id=actor_user_id,
                    comment=comment,
                    created_at=action_created_at,
                )
                db.add(workflow_action)

            documents_by_code[document_code] = document
            sequence += 1

    db.flush()
    return documents_by_code


def _seed_checklist_items(
    db: Session,
    *,
    projects_by_code: dict[str, Project],
    categories_by_code: dict[str, DocumentCategory],
    documents_by_code: dict[str, Document],
    users_by_email: dict[str, User],
) -> list[ChecklistItem]:
    checklist_templates = [
        ("Rà soát chứng chỉ vật tư {material}", "CERT"),
        ("Nghiệm thu lắp đặt {system}", "ACCP"),
        ("Kiểm tra an toàn lao động tuần {week}", "HSE"),
        ("Đối chiếu shopdrawing và hiện trường {zone}", "SHOP"),
        ("Hoàn thiện hồ sơ bàn giao hoàn công {zone}", "HANDOVER"),
        ("Kiểm tra danh mục vật tư thiếu chứng chỉ {zone}", "COMPLY"),
    ]
    materials = [
        "thép hộp mạ kẽm",
        "cáp điện Cadivi",
        "ống nhựa Bình Minh",
        "tôn cách nhiệt PU",
        "cửa chống cháy",
        "panel cách nhiệt",
        "quạt hút công nghiệp",
    ]
    systems = [
        "hệ thống điện động lực",
        "hệ thống PCCC",
        "hệ thống HVAC",
        "hệ thống cấp thoát nước",
        "hệ thống tủ điện phân phối",
    ]
    zones = [
        "khu nhà xưởng A",
        "khu kho thành phẩm",
        "khu đóng gói",
        "khu văn phòng điều hành",
        "trạm bơm PCCC",
        "khu vực xuất hàng",
    ]
    status_cycle = [
        ChecklistStatus.COMPLETED,
        ChecklistStatus.IN_PROGRESS,
        ChecklistStatus.PENDING,
        ChecklistStatus.OVERDUE,
        ChecklistStatus.WAIVED,
    ]
    owners = [
        users_by_email["le.hoang.nam@ankhang.vn"],
        users_by_email["do.duc.huy@phuckhang.vn"],
        users_by_email["ho.quoc.viet@logisticsbn.vn"],
        users_by_email["tran.quoc.bao@minhphat.vn"],
    ]

    documents_by_project: dict[str, list[Document]] = {}
    for document in documents_by_code.values():
        documents_by_project.setdefault(document.project_id, []).append(document)

    checklist_items: list[ChecklistItem] = []
    item_sequence = 1
    for project_code in sorted(projects_by_code.keys()):
        project = projects_by_code[project_code]
        linked_documents = sorted(
            documents_by_project.get(project.id, []),
            key=lambda item: item.updated_at,
            reverse=True,
        )

        for slot in range(4):
            template, category_code = checklist_templates[(item_sequence + slot) % len(checklist_templates)]
            material = materials[(item_sequence + slot) % len(materials)]
            system = systems[(item_sequence + slot) % len(systems)]
            zone = zones[(item_sequence + slot) % len(zones)]
            week = 10 + ((item_sequence + slot) % 10)
            title = template.format(material=material, system=system, zone=zone, week=week)
            status = status_cycle[(item_sequence + slot) % len(status_cycle)]

            due_date: date | None
            if status == ChecklistStatus.OVERDUE:
                due_date = date.today() - timedelta(days=3 + ((item_sequence + slot) % 6))
            elif status == ChecklistStatus.COMPLETED:
                due_date = date.today() - timedelta(days=1 + ((item_sequence + slot) % 3))
            elif status == ChecklistStatus.IN_PROGRESS:
                due_date = date.today() + timedelta(days=4 + ((item_sequence + slot) % 5))
            elif status == ChecklistStatus.PENDING:
                due_date = date.today() + timedelta(days=7 + ((item_sequence + slot) % 7))
            else:
                due_date = date.today() + timedelta(days=14 + ((item_sequence + slot) % 10))

            related_document_id = None
            if linked_documents:
                related_document_id = linked_documents[(item_sequence + slot) % len(linked_documents)].id

            existing_item = db.scalar(
                select(ChecklistItem).where(
                    ChecklistItem.project_id == project.id,
                    ChecklistItem.title == title,
                )
            )
            if existing_item:
                checklist_items.append(existing_item)
                continue

            created_at = _timestamp(90 - min(item_sequence * 2, 75), 8 + (item_sequence % 7), (item_sequence * 9) % 60)
            updated_at = _timestamp(max(0, 20 - (item_sequence // 3)), 9 + (item_sequence % 6), (item_sequence * 5) % 60)

            item = ChecklistItem(
                project_id=project.id,
                category_id=categories_by_code[category_code].id,
                title=title,
                description=(
                    f"Hạng mục tuân thủ cho {project.name.lower()}. "
                    f"Yêu cầu kiểm tra hiện trường, đính kèm biên bản và xác nhận của bộ phận phụ trách."
                ),
                required=status != ChecklistStatus.WAIVED,
                due_date=due_date,
                status=status,
                related_document_id=related_document_id,
                owner_user_id=owners[(item_sequence + slot) % len(owners)].id,
                created_at=created_at,
                updated_at=updated_at,
            )
            db.add(item)
            db.flush()
            checklist_items.append(item)
            item_sequence += 1

    return checklist_items


def _seed_notifications(
    db: Session,
    *,
    users_by_email: dict[str, User],
    documents_by_code: dict[str, Document],
) -> None:
    admin = users_by_email["admin@tracenix.com"]
    manager = users_by_email["nguyen.minh.anh@tracenix.vn"]
    approver = users_by_email["pham.thu.trang@tracenix.vn"]

    document_samples = sorted(documents_by_code.values(), key=lambda item: item.updated_at, reverse=True)[:9]
    notification_templates: list[tuple[User, str, str, NotificationType, bool, int]] = []

    for index, document in enumerate(document_samples):
        if index % 3 == 0:
            notification_templates.append(
                (
                    admin,
                    "Hồ sơ chờ phê duyệt",
                    f"{document.document_code} - {document.title} đang chờ xử lý tại hàng đợi phê duyệt.",
                    NotificationType.INFO,
                    False,
                    index,
                )
            )
        elif index % 3 == 1:
            notification_templates.append(
                (
                    manager,
                    "Checklist quá hạn",
                    f"Phát hiện hạng mục quá hạn liên quan đến hồ sơ {document.document_code}. Vui lòng cập nhật kế hoạch xử lý.",
                    NotificationType.WARNING,
                    False,
                    index,
                )
            )
        else:
            notification_templates.append(
                (
                    approver,
                    "Yêu cầu bổ sung chứng chỉ",
                    f"Cần bổ sung chứng chỉ kỹ thuật cho {document.document_code} trước khi đóng vòng review.",
                    NotificationType.ERROR,
                    True,
                    index,
                )
            )

    extra_notifications = [
        (
            admin,
            "Risk summary tuần 16",
            "Có 6 hồ sơ cần ưu tiên xử lý do thiếu biên bản nghiệm thu lắp đặt và chứng chỉ xuất xưởng.",
            NotificationType.WARNING,
            False,
            1,
        ),
        (
            admin,
            "Bàn giao hoàn công",
            "Dự án Hệ thống MEP xưởng sản xuất Hải Phòng đã chuyển sang trạng thái lưu trữ hồ sơ hoàn công.",
            NotificationType.SUCCESS,
            True,
            2,
        ),
        (
            manager,
            "Nhắc việc kiểm tra PCCC",
            "Biên bản kiểm tra PCCC nội bộ tuần này chưa có xác nhận cuối cùng từ bộ phận an toàn.",
            NotificationType.INFO,
            False,
            0,
        ),
    ]

    for recipient, title, message, notif_type, is_read, days_ago in notification_templates + extra_notifications:
        existing = db.scalar(
            select(Notification).where(
                Notification.user_id == recipient.id,
                Notification.title == title,
                Notification.message == message,
            )
        )
        if existing:
            continue

        notification = Notification(
            user_id=recipient.id,
            title=title,
            message=message,
            type=notif_type,
            is_read=is_read,
            created_at=_timestamp(days_ago, 9 + (days_ago % 6), 10 + (days_ago * 7) % 40),
        )
        db.add(notification)


def _ensure_audit_log(
    db: Session,
    *,
    actor_user_id: str | None,
    entity_type: str,
    entity_id: str,
    action: str,
    metadata_json: dict | None,
    created_at: datetime,
) -> None:
    existing = db.scalar(
        select(AuditLog).where(
            AuditLog.actor_user_id == actor_user_id,
            AuditLog.entity_type == entity_type,
            AuditLog.entity_id == entity_id,
            AuditLog.action == action,
        )
    )
    if existing:
        return

    db.add(
        AuditLog(
            actor_user_id=actor_user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            metadata_json=metadata_json,
            created_at=created_at,
        )
    )


def _seed_audit_logs(
    db: Session,
    *,
    users_by_email: dict[str, User],
    projects_by_code: dict[str, Project],
    documents_by_code: dict[str, Document],
    checklist_items: list[ChecklistItem],
) -> None:
    admin = users_by_email["admin@tracenix.com"]
    manager = users_by_email["nguyen.minh.anh@tracenix.vn"]

    for project in projects_by_code.values():
        _ensure_audit_log(
            db=db,
            actor_user_id=admin.id,
            entity_type="project",
            entity_id=project.id,
            action="project_create",
            metadata_json={"code": project.code, "name": project.name},
            created_at=project.created_at,
        )

    for document in documents_by_code.values():
        _ensure_audit_log(
            db=db,
            actor_user_id=document.created_by,
            entity_type="document",
            entity_id=document.id,
            action="document_create",
            metadata_json={"title": document.title, "document_code": document.document_code},
            created_at=document.created_at,
        )

        workflow_actions = db.scalars(
            select(WorkflowAction)
            .where(WorkflowAction.document_id == document.id)
            .order_by(WorkflowAction.created_at.asc())
        ).all()
        for workflow_action in workflow_actions:
            _ensure_audit_log(
                db=db,
                actor_user_id=workflow_action.actor_user_id,
                entity_type="document",
                entity_id=document.id,
                action=f"document_{workflow_action.action_type}",
                metadata_json={
                    "from_status": workflow_action.from_status.value,
                    "to_status": workflow_action.to_status.value,
                    "title": document.title,
                    "comment": workflow_action.comment,
                },
                created_at=workflow_action.created_at,
            )

    for checklist_item in checklist_items:
        _ensure_audit_log(
            db=db,
            actor_user_id=checklist_item.owner_user_id or manager.id,
            entity_type="checklist_item",
            entity_id=checklist_item.id,
            action="checklist_item_create",
            metadata_json={"title": checklist_item.title, "status": checklist_item.status.value},
            created_at=checklist_item.created_at,
        )
        _ensure_audit_log(
            db=db,
            actor_user_id=manager.id,
            entity_type="checklist_item",
            entity_id=checklist_item.id,
            action="checklist_item_update",
            metadata_json={"updated_fields": ["status", "related_document_id"]},
            created_at=checklist_item.updated_at,
        )


def seed_defaults(db: Session) -> None:
    settings = get_settings()
    upload_root = Path(settings.upload_root)

    users_by_email = _seed_users(db, settings)
    categories_by_code = _seed_categories(db)
    projects_by_code = _seed_projects(db)
    documents_by_code = _seed_documents(
        db,
        categories_by_code=categories_by_code,
        projects_by_code=projects_by_code,
        users_by_email=users_by_email,
        upload_root=upload_root,
    )
    checklist_items = _seed_checklist_items(
        db,
        projects_by_code=projects_by_code,
        categories_by_code=categories_by_code,
        documents_by_code=documents_by_code,
        users_by_email=users_by_email,
    )
    _seed_notifications(
        db,
        users_by_email=users_by_email,
        documents_by_code=documents_by_code,
    )
    _seed_audit_logs(
        db,
        users_by_email=users_by_email,
        projects_by_code=projects_by_code,
        documents_by_code=documents_by_code,
        checklist_items=checklist_items,
    )
    db.commit()
