"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, Link as LinkIcon, Plus, Search } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { CHECKLIST_STATUS_LABELS, formatDateVN } from "@/lib/localization/vi";
import { ChecklistItemCreate, ChecklistStatus } from "@/types";

const STATUSES: ChecklistStatus[] = ["pending", "in_progress", "completed", "overdue", "waived"];

const INITIAL_FORM: ChecklistItemCreate = {
  project_id: "",
  category_id: "",
  title: "",
  description: "",
  required: true,
  due_date: null,
  status: "pending",
  related_document_id: null,
  owner_user_id: null,
};

export function ChecklistStatusIcon({ status }: { status: ChecklistStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-chart-5" />;
    case "overdue":
      return <AlertCircle className="w-5 h-5 text-destructive" />;
    case "in_progress":
      return <AlertTriangle className="w-5 h-5 text-chart-4" />;
    default:
      return <Circle className="w-5 h-5 text-muted-foreground" />;
  }
}

export function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  let colorClass = "bg-secondary text-secondary-foreground";
  const name = CHECKLIST_STATUS_LABELS[status] || status;

  switch (status) {
    case "completed":
      colorClass = "bg-chart-5 text-white";
      break;
    case "in_progress":
      colorClass = "bg-primary text-primary-foreground";
      break;
    case "overdue":
      colorClass = "bg-destructive text-destructive-foreground";
      break;
    case "pending":
      colorClass = "bg-muted text-muted-foreground border border-border";
      break;
    case "waived":
      colorClass = "bg-slate-200 text-slate-600";
      break;
  }

  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${colorClass}`}>{name}</span>;
}

export default function ChecklistPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ChecklistItemCreate>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const checklistQuery = useQuery({
    queryKey: ["checklist", token],
    queryFn: () => api.listChecklistItems(token!),
    enabled: Boolean(token),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", token],
    queryFn: () => api.listProjects(token!),
    enabled: Boolean(token),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", token],
    queryFn: () => api.listCategories(token!),
    enabled: Boolean(token),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents", token],
    queryFn: () => api.listDocuments(token!),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      if (!form.project_id || !form.category_id || !form.title) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      }
      return api.createChecklistItem(token, form);
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["checklist"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ checklistId, status }: { checklistId: string; status: ChecklistStatus }) => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      return api.updateChecklistItem(token, checklistId, { status });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["checklist"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
      ]);
    },
  });

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data || []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projectsQuery.data]);

  const documentMap = useMemo(() => {
    const map = new Map<string, { title: string; code: string }>();
    for (const document of documentsQuery.data || []) {
      map.set(document.id, { title: document.title, code: document.document_code });
    }
    return map;
  }, [documentsQuery.data]);

  const filteredItems = useMemo(() => {
    const source = checklistQuery.data || [];
    return source.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [checklistQuery.data, searchTerm]);

  const completed = (checklistQuery.data || []).filter((item) => item.status === "completed").length;
  const overdue = (checklistQuery.data || []).filter((item) => item.status === "overdue").length;
  const total = (checklistQuery.data || []).length;

  const isLoading =
    checklistQuery.isLoading || projectsQuery.isLoading || categoriesQuery.isLoading || documentsQuery.isLoading || usersQuery.isLoading;
  const hasError = checklistQuery.error || projectsQuery.error || categoriesQuery.error || documentsQuery.error || usersQuery.error;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Danh mục tuân thủ</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi các đầu việc tuân thủ và liên kết hồ sơ theo dự án.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo hạng mục
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo checklist item</DialogTitle>
              <DialogDescription>Hạng mục mới sẽ xuất hiện ngay trong danh mục tuân thủ và dashboard.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                createMutation.mutate();
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
                <Label>Tiêu đề hạng mục</Label>
                <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <textarea
                  className="w-full min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description || ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hạn xử lý</Label>
                  <Input
                    type="date"
                    value={form.due_date || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, due_date: event.target.value || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái ban đầu</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ChecklistStatus }))}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CHECKLIST_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hồ sơ liên kết (tùy chọn)</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.related_document_id || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, related_document_id: event.target.value || null }))}
                  >
                    <option value="">Chưa liên kết</option>
                    {(documentsQuery.data || []).map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.document_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Chủ sở hữu (tùy chọn)</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.owner_user_id || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, owner_user_id: event.target.value || null }))}
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
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.required ?? true}
                  onChange={(event) => setForm((prev) => ({ ...prev, required: event.target.checked }))}
                />
                Hạng mục bắt buộc
              </label>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo hạng mục"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tiến độ checklist toàn hệ thống</h3>
                  <p className="text-2xl font-bold font-heading mt-1">
                    {completed}/{total} hạng mục đã hoàn thành
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{total === 0 ? 0 : Math.round((completed / total) * 100)}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary rounded-full h-2.5 transition-all duration-500" style={{ width: `${total === 0 ? 0 : (completed / total) * 100}%` }} />
              </div>
            </div>

            <div className="flex gap-4 md:border-l md:border-border md:pl-6 w-full md:w-auto">
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg flex-1 md:flex-none text-center min-w-24">
                <p className="text-xs font-semibold text-destructive uppercase">Quá hạn</p>
                <p className="text-2xl font-bold text-destructive font-heading leading-tight">{overdue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-80 flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm hạng mục tuân thủ..." className="pl-9 h-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </div>
        </div>

        {isLoading && <div className="p-6 text-sm text-muted-foreground">Đang tải checklist...</div>}
        {hasError && <div className="p-6 text-sm text-destructive">Không thể tải checklist.</div>}

        {!isLoading && !hasError && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[50px] text-center">Mức</TableHead>
                  <TableHead className="min-w-[260px]">Hạng mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hạn xử lý</TableHead>
                  <TableHead>Hồ sơ liên kết</TableHead>
                  <TableHead className="text-right">Cập nhật nhanh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const linkedDoc = item.related_document_id ? documentMap.get(item.related_document_id) : null;
                  return (
                    <TableRow key={item.id} className={item.status === "overdue" ? "bg-destructive/5" : ""}>
                      <TableCell className="text-center">
                        <ChecklistStatusIcon status={item.status} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.title}</div>
                        {item.required && (
                          <Badge variant="secondary" className="mt-1 text-[10px] px-1 py-0 h-4">
                            Bắt buộc
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">{projectMap.get(item.project_id) || item.project_id}</div>
                      </TableCell>
                      <TableCell>
                        <ChecklistStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className={item.status === "overdue" ? "text-destructive font-semibold text-sm" : "text-muted-foreground text-sm"}>
                        {item.due_date ? formatDateVN(item.due_date) : "Không có"}
                        {item.status === "overdue" && (
                          <span className="ml-2 bg-destructive text-destructive-foreground text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                            Trễ hạn
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {linkedDoc ? (
                          <Link href={`/documents/${item.related_document_id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 font-mono text-xs text-primary bg-primary/5">
                              <LinkIcon className="w-3 h-3" />
                              {linkedDoc.code}
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa liên kết</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={item.status}
                          onChange={(event) => statusMutation.mutate({ checklistId: item.id, status: event.target.value as ChecklistStatus })}
                          disabled={statusMutation.isPending}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {CHECKLIST_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Không có hạng mục phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

