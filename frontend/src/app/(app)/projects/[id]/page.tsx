"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Building2, CheckSquare, FileText, MapPin, Plus, Settings2, Users } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { ProjectStatusBadge } from "../page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api/client";
import { CHECKLIST_STATUS_LABELS, DOCUMENT_STATUS_LABELS, formatDateVN } from "@/lib/localization/vi";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { token } = useAuth();

  const projectQuery = useQuery({
    queryKey: ["project", token, projectId],
    queryFn: () => api.getProject(token!, projectId),
    enabled: Boolean(token && projectId),
  });

  const documentsQuery = useQuery({
    queryKey: ["project-documents", token, projectId],
    queryFn: () => api.listDocuments(token!, { project_id: projectId }),
    enabled: Boolean(token && projectId),
  });

  const checklistQuery = useQuery({
    queryKey: ["project-checklist", token, projectId],
    queryFn: () => api.listChecklistItems(token!, { project_id: projectId }),
    enabled: Boolean(token && projectId),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const isLoading = projectQuery.isLoading || documentsQuery.isLoading || checklistQuery.isLoading || usersQuery.isLoading;
  const hasError = projectQuery.error || documentsQuery.error || checklistQuery.error || usersQuery.error;

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data || []) {
      map.set(user.id, user.full_name);
    }
    return map;
  }, [usersQuery.data]);

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Đang tải dữ liệu dự án...</div>;
  }

  if (hasError || !projectQuery.data) {
    return <div className="p-8 text-sm text-destructive">Không thể tải chi tiết dự án.</div>;
  }

  const project = projectQuery.data;
  const documents = documentsQuery.data || [];
  const checklist = checklistQuery.data || [];
  const completedChecklist = checklist.filter((item) => item.status === "completed").length;
  const checklistCompletion = checklist.length ? Math.round((completedChecklist / checklist.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách dự án
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-xl hidden sm:block">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-heading">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-muted-foreground max-w-2xl">{project.description || "Không có mô tả."}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Mã dự án: {project.code}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {documents.length} hồ sơ, {checklist.length} checklist
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" className="gap-2 shrink-0">
          <Settings2 className="w-4 h-4" />
          Quản lý dự án
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Tiến độ thời gian</p>
            <p className="font-medium">
              {project.start_date ? formatDateVN(project.start_date) : "--"} - {project.end_date ? formatDateVN(project.end_date) : "--"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Tổng hồ sơ</p>
            <p className="font-medium">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Checklist hoàn thành</p>
            <p className="font-medium text-chart-5">
              {completedChecklist}/{checklist.length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Tiến độ checklist</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-primary rounded-full h-2" style={{ width: `${checklistCompletion}%` }} />
              </div>
              <span className="text-sm font-semibold">{checklistCompletion}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents" className="w-full mt-8">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto rounded-none border-b border-border h-auto p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 py-3 gap-2 min-w-max">
            <Activity className="w-4 h-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 py-3 gap-2 min-w-max">
            <FileText className="w-4 h-4" /> Hồ sơ ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-6 py-3 gap-2 min-w-max">
            <CheckSquare className="w-4 h-4" /> Tuân thủ ({completedChecklist}/{checklist.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground pb-6">
              <p>Dự án này hiện có {documents.length} hồ sơ và {checklist.length} hạng mục tuân thủ.</p>
              <p className="mt-2">
                Trạng thái checklist quá hạn: {checklist.filter((item) => item.status === "overdue").length}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Hồ sơ dự án</CardTitle>
                <CardDescription>Danh sách hồ sơ liên kết trực tiếp với dự án này.</CardDescription>
              </div>
              <Link href="/documents">
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Tải hồ sơ lên
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {documents.length === 0 && <p className="text-sm text-muted-foreground">Chưa có hồ sơ cho dự án này.</p>}
              {documents.map((doc) => (
                <div key={doc.id} className="border border-border rounded-lg p-3">
                  <Link href={`/documents/${doc.id}`} className="font-medium text-foreground hover:text-primary">
                    {doc.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.document_code} - {DOCUMENT_STATUS_LABELS[doc.current_status]}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Checklist tuân thủ</CardTitle>
              <CardDescription>Danh sách hạng mục theo dõi tuân thủ của dự án.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.length === 0 && <p className="text-sm text-muted-foreground">Chưa có checklist cho dự án này.</p>}
              {checklist.map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-3">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {CHECKLIST_STATUS_LABELS[item.status]} - Hạn: {item.due_date ? formatDateVN(item.due_date) : "Không có"}
                  </p>
                  {item.owner_user_id && (
                    <p className="text-xs text-muted-foreground mt-1">Phụ trách: {userMap.get(item.owner_user_id) || item.owner_user_id}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

