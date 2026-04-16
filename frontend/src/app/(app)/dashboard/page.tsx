"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, CheckCircle2, Clock, FileText } from "lucide-react";
import { Canvas } from "@react-three/fiber";

import { useAuth } from "@/components/providers/auth-provider";
import { TracenixGlobe } from "@/components/ui/tracenix-globe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api/client";
import { AUDIT_ACTION_LABELS, formatDateVN, formatNumberVN, formatTimeVN } from "@/lib/localization/vi";

export default function DashboardPage() {
  const { token } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", token],
    queryFn: () => api.dashboardSummary(token!),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const pendingApprovalsQuery = useQuery({
    queryKey: ["dashboard-pending-approvals", token],
    queryFn: async () => {
      const [submitted, underReview] = await Promise.all([
        api.listDocuments(token!, { current_status: "submitted" }),
        api.listDocuments(token!, { current_status: "under_review" }),
      ]);
      return [...underReview, ...submitted].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)).slice(0, 6);
    },
    enabled: Boolean(token),
  });

  const activityQuery = useQuery({
    queryKey: ["audit-logs", token],
    queryFn: async () => {
      try {
        return await api.listAuditLogs(token!, 20);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: Boolean(token),
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data || []) {
      map.set(user.id, user.full_name);
    }
    return map;
  }, [usersQuery.data]);

  const isLoading = summaryQuery.isLoading || pendingApprovalsQuery.isLoading || activityQuery.isLoading;
  const error = summaryQuery.error || pendingApprovalsQuery.error || activityQuery.error;

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Đang tải dữ liệu điều hành...</div>;
  }

  if (error || !summaryQuery.data) {
    const message = error instanceof ApiError ? error.message : "Không thể tải dữ liệu dashboard.";
    return <div className="p-8 text-sm text-destructive">{message}</div>;
  }

  const summary = summaryQuery.data;
  const pendingApprovals = pendingApprovalsQuery.data || [];
  const recentActivity = activityQuery.data || [];

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="relative overflow-hidden rounded-xl bg-brand-navy p-8 border border-border">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] -mt-[100px] -mr-[100px] opacity-30 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 4] }}>
            <ambientLight intensity={0.5} />
            <TracenixGlobe radius={2} particlesCount={80} color="#3b82f6" speed={0.3} />
          </Canvas>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-transparent z-0 pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2 font-heading tracking-tight">Trung tâm điều hành Tracenix</h1>
          <p className="text-muted-foreground max-w-lg text-sm text-slate-300">
            Hiện có {formatNumberVN(summary.pending_review_count)} hồ sơ đang chờ xử lý và{" "}
            {formatNumberVN(summary.overdue_checklist_count)} hạng mục tuân thủ quá hạn.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Tổng số hồ sơ" value={formatNumberVN(summary.total_documents)} icon={<FileText className="w-4 h-4 text-primary" />} />
        <MetricCard
          title="Chờ xem xét"
          value={formatNumberVN(summary.pending_review_count)}
          icon={<Clock className="w-4 h-4 text-chart-4" />}
          trend="Cần xử lý"
          trendUp={false}
        />
        <MetricCard
          title="Đã phê duyệt"
          value={formatNumberVN(summary.approved_documents_count)}
          icon={<CheckCircle2 className="w-4 h-4 text-chart-5" />}
        />
        <MetricCard
          title="Checklist quá hạn"
          value={formatNumberVN(summary.overdue_checklist_count)}
          icon={<AlertCircle className="w-4 h-4 text-destructive" />}
          trend="Ưu tiên cao"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Hồ sơ chờ phê duyệt</CardTitle>
                <CardDescription>Dữ liệu thời gian thực từ backend workflow.</CardDescription>
              </div>
              <Link href="/approvals">
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {pendingApprovals.length === 0 && <p className="text-sm text-muted-foreground">Không có hồ sơ chờ duyệt.</p>}
                {pendingApprovals.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{doc.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mã hồ sơ: {doc.document_code} • Cập nhật: {formatDateVN(doc.updated_at)}
                      </p>
                    </div>
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="secondary" className="gap-1">
                        Xem duyệt <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Nhật ký gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Chưa có quyền xem audit logs hoặc chưa có dữ liệu.
                  </p>
                )}
                {recentActivity.map((log) => {
                  const actorName = log.actor_user_id ? userMap.get(log.actor_user_id) || log.actor_user_id : "Hệ thống";
                  const title = typeof log.metadata_json?.title === "string" ? log.metadata_json.title : log.entity_id;
                  return (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="mt-0.5 mt-1 bg-primary/10 rounded-full p-1 h-5 w-5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground">
                          <span className="font-medium">{actorName}</span> {AUDIT_ACTION_LABELS[log.action] || log.action}{" "}
                          <span className="font-medium">{title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateVN(log.created_at)} {formatTimeVN(log.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="border-border shadow-sm shadow-black/5">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-heading">{value}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">{icon}</div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs">
            <span className={trendUp === false ? "text-destructive font-medium" : "text-chart-5 font-medium"}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

