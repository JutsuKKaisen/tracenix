"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, Filter, RefreshCw, Search, XCircle } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { StatusBadge } from "@/app/(app)/documents/page";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingApprovalsQuery = useQuery({
    queryKey: ["approvals", token],
    queryFn: async () => {
      const [submitted, underReview] = await Promise.all([
        api.listDocuments(token!, { current_status: "submitted" }),
        api.listDocuments(token!, { current_status: "under_review" }),
      ]);
      return [...underReview, ...submitted].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    },
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", token],
    queryFn: () => api.listProjects(token!),
    enabled: Boolean(token),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ documentId, action }: { documentId: string; action: string }) => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      return api.transitionDocument(token, documentId, action, { comment: null });
    },
    onSuccess: async () => {
      setErrorMessage(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["documents"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
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

  const filteredDocuments = useMemo(() => {
    const source = pendingApprovalsQuery.data || [];
    return source.filter((doc) => {
      const lower = searchTerm.toLowerCase();
      return doc.title.toLowerCase().includes(lower) || doc.document_code.toLowerCase().includes(lower);
    });
  }, [pendingApprovalsQuery.data, searchTerm]);

  const isLoading = pendingApprovalsQuery.isLoading || usersQuery.isLoading || projectsQuery.isLoading;
  const hasError = pendingApprovalsQuery.error || usersQuery.error || projectsQuery.error;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Trung tâm phê duyệt</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Xử lý hồ sơ theo luồng: submitted {"->"} under_review {"->"} approved/rejected/revision_required.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hoặc tiêu đề hồ sơ..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0 h-9">
          <Filter className="w-4 h-4" />
          Lọc
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Đang tải danh sách phê duyệt...</p>}
      {hasError && <p className="text-sm text-destructive">Không thể tải danh sách phê duyệt.</p>}
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <div className="space-y-4">
        {filteredDocuments.map((doc) => (
          <Card key={doc.id} className="border-primary/20 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="bg-primary/5 w-2 flex-shrink-0 hidden md:block" />
            <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-border/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono bg-muted/50 text-xs">
                    {doc.document_code}
                  </Badge>
                  <StatusBadge status={doc.current_status} />
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Cập nhật: {new Date(doc.updated_at).toLocaleDateString("vi-VN")}
                </div>
              </div>

              <Link href={`/documents/${doc.id}`}>
                <h3 className="text-lg font-semibold hover:text-primary transition-colors mt-2 mb-1">{doc.title}</h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Dự án:</span>
                  <span className="text-foreground">{projectMap.get(doc.project_id) || doc.project_id}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium">Người gửi:</span>
                  <span className="text-foreground font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                    {userMap.get(doc.created_by) || doc.created_by}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-muted/10 w-full md:w-64 flex flex-col justify-center gap-3">
              {doc.current_status === "submitted" ? (
                <Button
                  className="w-full gap-2 justify-start font-medium"
                  onClick={() => transitionMutation.mutate({ documentId: doc.id, action: "review" })}
                  disabled={transitionMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4" />
                  Nhận xem xét
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full bg-chart-5 hover:bg-chart-5/90 text-white gap-2 justify-start font-medium"
                    onClick={() => transitionMutation.mutate({ documentId: doc.id, action: "approve" })}
                    disabled={transitionMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Phê duyệt
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 justify-start font-medium text-chart-4 hover:text-chart-4 border-chart-4/30 bg-chart-4/5 hover:bg-chart-4/10"
                    onClick={() => transitionMutation.mutate({ documentId: doc.id, action: "request-revision" })}
                    disabled={transitionMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Yêu cầu chỉnh sửa
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full gap-2 justify-start font-medium"
                    onClick={() => transitionMutation.mutate({ documentId: doc.id, action: "reject" })}
                    disabled={transitionMutation.isPending}
                  >
                    <XCircle className="w-4 h-4" />
                    Từ chối
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}

        {!isLoading && filteredDocuments.length === 0 && (
          <div className="py-20 text-center border border-dashed rounded-xl border-border bg-card">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Không còn mục chờ duyệt</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">Hiện chưa có hồ sơ nào cần phê duyệt.</p>
          </div>
        )}
      </div>
    </div>
  );
}
