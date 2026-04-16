"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  History,
  MessagesSquare,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api/client";
import { DOCUMENT_STATUS_LABELS, formatDateTimeVN } from "@/lib/localization/vi";
import { DocumentStatus } from "@/types";

import { StatusBadge } from "../page";

type TransitionAction = "submit" | "review" | "approve" | "reject" | "request-revision" | "archive";

const WORKFLOW_ACTIONS: Record<DocumentStatus, TransitionAction[]> = {
  draft: ["submit"],
  submitted: ["review"],
  under_review: ["approve", "request-revision", "reject"],
  revision_required: ["submit"],
  approved: ["archive"],
  rejected: [],
  archived: [],
};

const ACTION_LABELS: Record<TransitionAction, string> = {
  submit: "Gửi duyệt",
  review: "Nhận xem xét",
  approve: "Phê duyệt",
  reject: "Từ chối",
  "request-revision": "Yêu cầu chỉnh sửa",
  archive: "Lưu trữ",
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const [actionComment, setActionComment] = useState("");
  const [versionNote, setVersionNote] = useState("");
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const documentQuery = useQuery({
    queryKey: ["document", token, documentId],
    queryFn: () => api.getDocument(token!, documentId),
    enabled: Boolean(token && documentId),
  });

  const versionsQuery = useQuery({
    queryKey: ["document-versions", token, documentId],
    queryFn: () => api.listDocumentVersions(token!, documentId),
    enabled: Boolean(token && documentId),
  });

  const workflowQuery = useQuery({
    queryKey: ["document-workflow", token, documentId],
    queryFn: () => api.listWorkflowActions(token!, documentId),
    enabled: Boolean(token && documentId),
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

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const transitionMutation = useMutation({
    mutationFn: async (action: TransitionAction) => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      return api.transitionDocument(token, documentId, action, { comment: actionComment || null });
    },
    onSuccess: async () => {
      setActionError(null);
      setActionComment("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["document", token, documentId] }),
        queryClient.invalidateQueries({ queryKey: ["document-workflow", token, documentId] }),
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error: Error) => {
      setActionError(error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!token || !versionFile) {
        throw new Error("Vui lòng chọn tệp để tải lên.");
      }
      return api.uploadDocumentVersion(token, documentId, versionFile, versionNote || undefined);
    },
    onSuccess: async () => {
      setUploadError(null);
      setVersionFile(null);
      setVersionNote("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["document", token, documentId] }),
        queryClient.invalidateQueries({ queryKey: ["document-versions", token, documentId] }),
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
      ]);
    },
    onError: (error: Error) => {
      setUploadError(error.message);
    },
  });

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projectsQuery.data || []) {
      map.set(project.id, project.name);
    }
    return map;
  }, [projectsQuery.data]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categoriesQuery.data || []) {
      map.set(category.id, `${category.code} - ${category.name}`);
    }
    return map;
  }, [categoriesQuery.data]);

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data || []) {
      map.set(user.id, user.full_name);
    }
    return map;
  }, [usersQuery.data]);

  const document = documentQuery.data;
  const versions = versionsQuery.data || [];
  const workflow = workflowQuery.data || [];

  const allowedActions = document ? WORKFLOW_ACTIONS[document.current_status] : [];
  const isLoading =
    documentQuery.isLoading ||
    versionsQuery.isLoading ||
    workflowQuery.isLoading ||
    projectsQuery.isLoading ||
    categoriesQuery.isLoading ||
    usersQuery.isLoading;
  const error =
    documentQuery.error || versionsQuery.error || workflowQuery.error || projectsQuery.error || categoriesQuery.error || usersQuery.error;

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Đang tải chi tiết hồ sơ...</div>;
  }

  if (error || !document) {
    const message = error instanceof ApiError ? error.message : "Không thể tải chi tiết hồ sơ.";
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-1" onClick={() => router.push("/documents")}>
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách hồ sơ
        </Button>
        <p className="text-sm text-destructive">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/documents">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground -ml-3">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách hồ sơ
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-heading">{document.title}</h1>
            <StatusBadge status={document.current_status} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{document.document_code}</span>
            <span>{versions.length > 0 ? `Phiên bản ${versions[0].version_number}` : "Chưa có phiên bản"}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Cập nhật {formatDateTimeVN(document.updated_at)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tải phiên bản mới</CardTitle>
              <CardDescription>Mỗi lần tải lên sẽ tự động đánh dấu phiên bản mới nhất là hiện hành.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tệp hồ sơ</Label>
                <Input type="file" onChange={(event) => setVersionFile(event.target.files?.[0] || null)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ghi chú thay đổi</Label>
                <Input value={versionNote} onChange={(event) => setVersionNote(event.target.value)} />
              </div>
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
              <Button
                className="gap-2"
                onClick={() => {
                  setUploadError(null);
                  uploadMutation.mutate();
                }}
                disabled={uploadMutation.isPending}
              >
                <Upload className="w-4 h-4" />
                {uploadMutation.isPending ? "Đang tải lên..." : "Tải phiên bản mới"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hành động workflow</CardTitle>
              <CardDescription>Trạng thái hiện tại: {DOCUMENT_STATUS_LABELS[document.current_status]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Ghi chú hành động (tùy chọn)"
                value={actionComment}
                onChange={(event) => setActionComment(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {allowedActions.length === 0 && (
                  <span className="text-sm text-muted-foreground">Không có hành động workflow hợp lệ tại trạng thái này.</span>
                )}
                {allowedActions.map((action) => (
                  <Button
                    key={action}
                    variant={
                      action === "approve" ? "default" : action === "reject" ? "destructive" : action === "request-revision" ? "secondary" : "outline"
                    }
                    className="gap-2"
                    onClick={() => transitionMutation.mutate(action)}
                    disabled={transitionMutation.isPending}
                  >
                    {action === "approve" && <CheckCircle className="w-4 h-4" />}
                    {action === "reject" && <XCircle className="w-4 h-4" />}
                    {action === "request-revision" && <RefreshCw className="w-4 h-4" />}
                    {action === "submit" && <Upload className="w-4 h-4" />}
                    {action === "review" && <MessagesSquare className="w-4 h-4" />}
                    {action === "archive" && <History className="w-4 h-4" />}
                    {ACTION_LABELS[action]}
                  </Button>
                ))}
              </div>
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
            </CardContent>
          </Card>

          <Tabs defaultValue="versions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="versions" className="gap-2">
                <History className="w-4 h-4" /> Phiên bản
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-2">
                <MessagesSquare className="w-4 h-4" /> Luồng xử lý
              </TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="mt-0">
              <Card className="border-border shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  {versions.length === 0 && <p className="text-sm text-muted-foreground">Chưa có phiên bản nào.</p>}
                  {versions.map((version) => (
                    <div key={version.id} className="flex border rounded-lg p-4 bg-muted/10 border-border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">Phiên bản {version.version_number}</span>
                          {version.is_current && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded uppercase font-medium tracking-wider">
                              Hiện hành
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{version.change_note || "Không có ghi chú thay đổi."}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Tải lên bởi {userMap.get(version.uploaded_by) || version.uploaded_by} lúc{" "}
                          {formatDateTimeVN(version.uploaded_at)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {version.file_name} - {(version.file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div>
                        <a href={api.getVersionDownloadUrl(document.id, version.id)} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="mt-0">
              <Card className="border-border shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  {workflow.length === 0 && <p className="text-sm text-muted-foreground">Chưa có lịch sử workflow.</p>}
                  {workflow.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground">
                        {DOCUMENT_STATUS_LABELS[item.from_status]} {"->"} {DOCUMENT_STATUS_LABELS[item.to_status]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {userMap.get(item.actor_user_id) || item.actor_user_id} - {formatDateTimeVN(item.created_at)}
                      </p>
                      {item.comment && <p className="text-xs text-muted-foreground mt-1">Ghi chú: {item.comment}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Thông tin hồ sơ</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Dự án</p>
                <p className="font-medium">{projectMap.get(document.project_id) || document.project_id}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Danh mục</p>
                <p className="font-medium">{categoryMap.get(document.category_id) || document.category_id}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Phụ trách</p>
                <p className="font-medium">{document.assignee_user_id ? userMap.get(document.assignee_user_id) || document.assignee_user_id : "Chưa phân công"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Người tạo</p>
                <p className="font-medium text-foreground">{userMap.get(document.created_by) || document.created_by}</p>
              </div>
              {document.current_version && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Phiên bản hiện hành</p>
                    <a
                      href={api.getVersionDownloadUrl(document.id, document.current_version.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {document.current_version.file_name}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
