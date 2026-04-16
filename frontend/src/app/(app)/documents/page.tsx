"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Filter, Plus, Search } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError } from "@/lib/api/client";
import { DOCUMENT_STATUS_LABELS, formatDateVN } from "@/lib/localization/vi";
import { DocumentCreate, DocumentStatus } from "@/types";

export function StatusBadge({ status }: { status: DocumentStatus }) {
  let colorClass = "bg-secondary text-secondary-foreground";
  const name = DOCUMENT_STATUS_LABELS[status] || status;

  switch (status) {
    case "approved":
      colorClass = "bg-chart-5 text-white";
      break;
    case "under_review":
      colorClass = "bg-chart-3 text-white";
      break;
    case "submitted":
      colorClass = "bg-primary text-primary-foreground";
      break;
    case "revision_required":
      colorClass = "bg-chart-4 text-white";
      break;
    case "rejected":
      colorClass = "bg-destructive text-destructive-foreground";
      break;
    case "draft":
      colorClass = "bg-muted text-muted-foreground border border-border";
      break;
    case "archived":
      colorClass = "bg-slate-200 text-slate-700";
      break;
  }

  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass}`}>{name}</span>;
}

interface CreateDocumentForm extends DocumentCreate {
  initialFile: File | null;
  changeNote: string;
}

const INITIAL_FORM: CreateDocumentForm = {
  project_id: "",
  category_id: "",
  title: "",
  document_code: "",
  description: "",
  assignee_user_id: "",
  initialFile: null,
  changeNote: "",
};

export default function DocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateDocumentForm>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["documents", token],
    queryFn: () => api.listDocuments(token!),
    enabled: Boolean(token),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", token],
    queryFn: () => api.listProjects(token!),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", token],
    queryFn: () => api.listCategories(token!),
    enabled: Boolean(token),
  });

  const createDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing auth token.");
      }

      if (!form.project_id || !form.category_id || !form.title || !form.document_code) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      }

      const payload: DocumentCreate = {
        project_id: form.project_id,
        category_id: form.category_id,
        title: form.title,
        document_code: form.document_code,
        description: form.description || null,
        assignee_user_id: form.assignee_user_id || null,
      };

      const document = await api.createDocument(token, payload);
      if (form.initialFile) {
        await api.uploadDocumentVersion(token, document.id, form.initialFile, form.changeNote || undefined);
      }
      return document;
    },
    onSuccess: async (document) => {
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      router.push(`/documents/${document.id}`);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data || []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projectsQuery.data]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data || []) {
      map.set(user.id, user.full_name);
    }
    return map;
  }, [usersQuery.data]);

  const filteredDocs = useMemo(() => {
    const source = documentsQuery.data || [];
    return source.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.current_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documentsQuery.data, searchTerm, statusFilter]);

  const isLoading =
    documentsQuery.isLoading || projectsQuery.isLoading || usersQuery.isLoading || categoriesQuery.isLoading;
  const error =
    documentsQuery.error || projectsQuery.error || usersQuery.error || categoriesQuery.error || createDocumentMutation.error;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Hồ sơ</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý hồ sơ dự án, phiên bản và trạng thái phê duyệt theo thời gian thực.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Tải hồ sơ lên
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo hồ sơ mới</DialogTitle>
              <DialogDescription>Tạo metadata hồ sơ và tải phiên bản đầu tiên (khuyến nghị).</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                createDocumentMutation.mutate();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Dự án</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.project_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, project_id: event.target.value }))}
                    required
                  >
                    <option value="">Chọn dự án</option>
                    {(projectsQuery.data || []).map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Danh mục</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.category_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {(categoriesQuery.data || []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.code} - {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tiêu đề hồ sơ</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Mã hồ sơ</Label>
                  <Input
                    value={form.document_code}
                    onChange={(event) => setForm((prev) => ({ ...prev, document_code: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phụ trách</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.assignee_user_id || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, assignee_user_id: event.target.value }))}
                  >
                    <option value="">Chưa phân công</option>
                    {(usersQuery.data || []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <textarea
                  className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tệp phiên bản đầu tiên (tùy chọn)</Label>
                <Input
                  type="file"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, initialFile: event.target.files?.[0] || null }))
                  }
                />
              </div>
              {form.initialFile && (
                <div className="space-y-1.5">
                  <Label>Ghi chú phiên bản</Label>
                  <Input
                    value={form.changeNote}
                    onChange={(event) => setForm((prev) => ({ ...prev, changeNote: event.target.value }))}
                    placeholder="Ví dụ: Phiên bản nộp đầu tiên"
                  />
                </div>
              )}
              {formError && (
                <p className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={createDocumentMutation.isPending}>
                  {createDocumentMutation.isPending ? "Đang tạo..." : "Tạo hồ sơ"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề hoặc mã hồ sơ..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <Filter className="w-4 h-4" />
                  Trạng thái
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>Tất cả trạng thái</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>Đã gửi duyệt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("under_review")}>Đang xem xét</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Đã phê duyệt</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>Bản nháp</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-muted-foreground">Đang tải dữ liệu hồ sơ...</div>
        ) : error ? (
          <div className="p-8 text-sm text-destructive">
            {(error as ApiError).message || "Không thể tải dữ liệu hồ sơ."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[320px]">Hồ sơ</TableHead>
                    <TableHead className="w-[120px]">Mã hồ sơ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="min-w-[180px]">Dự án</TableHead>
                    <TableHead className="min-w-[160px]">Phụ trách</TableHead>
                    <TableHead className="text-right min-w-[140px]">Ngày cập nhật</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Không tìm thấy hồ sơ phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/documents/${doc.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="font-medium text-foreground">{doc.title}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[250px]">{doc.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.document_code}</TableCell>
                        <TableCell>
                          <StatusBadge status={doc.current_status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {projectMap.get(doc.project_id) || doc.project_id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.assignee_user_id ? (
                            userMap.get(doc.assignee_user_id) || doc.assignee_user_id
                          ) : (
                            <span className="text-muted-foreground italic">Chưa phân công</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{formatDateVN(doc.updated_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden divide-y divide-border">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 space-y-3 cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="font-medium text-foreground">{doc.title}</div>
                    <StatusBadge status={doc.current_status} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{doc.document_code}</span>
                    <span>{formatDateVN(doc.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-card">
              <div>Hiển thị {filteredDocs.length} hồ sơ</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

