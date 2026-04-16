"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Calendar, FolderGit2, MapPin, MoreVertical, Plus, Search, Users } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { formatDateVN, PROJECT_STATUS_LABELS } from "@/lib/localization/vi";
import { ProjectCreate, ProjectStatus } from "@/types";

const INITIAL_PROJECT_FORM: ProjectCreate = {
  code: "",
  name: "",
  description: "",
  status: "active",
  start_date: null,
  end_date: null,
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "active":
      return <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-chart-5/10 text-chart-5 border border-chart-5/20">{PROJECT_STATUS_LABELS[status]}</span>;
    case "on_hold":
      return <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-primary/10 text-primary border border-primary/20">{PROJECT_STATUS_LABELS[status]}</span>;
    case "completed":
      return <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-muted text-muted-foreground border border-border">{PROJECT_STATUS_LABELS[status]}</span>;
    default:
      return <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-secondary text-secondary-foreground">{status}</span>;
  }
}

export default function ProjectsListPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ProjectCreate>(INITIAL_PROJECT_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects", token],
    queryFn: () => api.listProjects(token!),
    enabled: Boolean(token),
  });

  const documentsQuery = useQuery({
    queryKey: ["documents", token],
    queryFn: () => api.listDocuments(token!),
    enabled: Boolean(token),
  });

  const checklistQuery = useQuery({
    queryKey: ["checklist", token],
    queryFn: () => api.listChecklistItems(token!),
    enabled: Boolean(token),
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      if (!form.code || !form.name) {
        throw new Error("Mã dự án và tên dự án là bắt buộc.");
      }
      return api.createProject(token, form);
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setForm(INITIAL_PROJECT_FORM);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const documentsByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const document of documentsQuery.data || []) {
      map.set(document.project_id, (map.get(document.project_id) || 0) + 1);
    }
    return map;
  }, [documentsQuery.data]);

  const checklistByProject = useMemo(() => {
    const totalMap = new Map<string, number>();
    const completedMap = new Map<string, number>();
    for (const item of checklistQuery.data || []) {
      totalMap.set(item.project_id, (totalMap.get(item.project_id) || 0) + 1);
      if (item.status === "completed") {
        completedMap.set(item.project_id, (completedMap.get(item.project_id) || 0) + 1);
      }
    }
    return { totalMap, completedMap };
  }, [checklistQuery.data]);

  const filteredProjects = useMemo(() => {
    const source = projectsQuery.data || [];
    return source.filter((project) => project.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projectsQuery.data, searchTerm]);

  const isLoading = projectsQuery.isLoading || documentsQuery.isLoading || checklistQuery.isLoading;
  const hasError = projectsQuery.error || documentsQuery.error || checklistQuery.error;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Dự án</h1>
          <p className="text-sm text-muted-foreground mt-1">Theo dõi toàn bộ dự án đang triển khai và trạng thái hồ sơ tuân thủ.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Tạo dự án
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo dự án mới</DialogTitle>
              <DialogDescription>Thông tin này được dùng xuyên suốt các luồng hồ sơ và checklist.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                createProjectMutation.mutate();
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Mã dự án</Label>
                  <Input
                    value={form.code}
                    onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.status}
                    onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}
                  >
                    <option value="active">Đang triển khai</option>
                    <option value="on_hold">Tạm dừng</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tên dự án</Label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
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
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={form.start_date || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, start_date: event.target.value || null }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Ngày kết thúc</Label>
                  <Input
                    type="date"
                    value={form.end_date || ""}
                    onChange={(event) => setForm((prev) => ({ ...prev, end_date: event.target.value || null }))}
                  />
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <DialogFooter>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card border border-border p-3 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm dự án theo tên..." className="pl-9 bg-background" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải danh sách dự án...</p>}
      {hasError && <p className="text-sm text-destructive">Không thể tải dữ liệu dự án.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const totalChecklist = checklistByProject.totalMap.get(project.id) || 0;
          const completedChecklist = checklistByProject.completedMap.get(project.id) || 0;
          const completion = totalChecklist === 0 ? 0 : Math.round((completedChecklist / totalChecklist) * 100);
          return (
            <Card key={project.id} className="group hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-border bg-card overflow-hidden flex flex-col">
              <CardHeader className="pb-3 relative">
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Chỉnh sửa thông tin</DropdownMenuItem>
                      <DropdownMenuItem>Quản lý truy cập</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <CardTitle className="text-lg line-clamp-1">
                  <Link href={`/projects/${project.id}`} className="hover:text-primary transition-colors">
                    {project.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{project.description}</p>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">Mã dự án: {project.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Khởi công: {project.start_date ? formatDateVN(project.start_date) : "Chưa xác định"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Kết thúc: {project.end_date ? formatDateVN(project.end_date) : "Chưa xác định"}</span>
                  </div>
                </div>
              </CardContent>

              <div className="mt-auto">
                <div className="px-6 py-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground font-medium">Checklist hoàn thành</span>
                    <span className="text-foreground font-bold">{completion}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${project.status === "completed" ? "bg-muted-foreground" : "bg-primary"}`} style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <CardFooter className="pt-2 border-t border-border/50 bg-muted/10 gap-2 flex justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>{documentsByProject.get(project.id) || 0} hồ sơ</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{totalChecklist} checklist</span>
                  </div>
                </CardFooter>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

