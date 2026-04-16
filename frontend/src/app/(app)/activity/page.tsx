"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, FileText, Filter, History, RefreshCw, Search, Settings, XCircle } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { AUDIT_ACTION_LABELS, formatDateVN, formatTimeVN } from "@/lib/localization/vi";

function AuditIcon({ action }: { action: string }) {
  if (action.includes("approve")) {
    return (
      <div className="bg-chart-5/10 p-2 rounded-full">
        <CheckCircle className="w-4 h-4 text-chart-5" />
      </div>
    );
  }
  if (action.includes("reject")) {
    return (
      <div className="bg-destructive/10 p-2 rounded-full">
        <XCircle className="w-4 h-4 text-destructive" />
      </div>
    );
  }
  if (action.includes("revision") || action.includes("update")) {
    return (
      <div className="bg-chart-4/10 p-2 rounded-full">
        <RefreshCw className="w-4 h-4 text-chart-4" />
      </div>
    );
  }
  if (action.includes("document") || action.includes("submit")) {
    return (
      <div className="bg-primary/10 p-2 rounded-full">
        <FileText className="w-4 h-4 text-primary" />
      </div>
    );
  }
  return (
    <div className="bg-muted p-2 rounded-full">
      <Settings className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

export default function ActivityPage() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const logsQuery = useQuery({
    queryKey: ["audit-logs", token],
    queryFn: () => api.listAuditLogs(token!, 300),
    enabled: Boolean(token),
  });

  const usersQuery = useQuery({
    queryKey: ["users", token],
    queryFn: () => api.listUsers(token!),
    enabled: Boolean(token),
  });

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of usersQuery.data || []) {
      map.set(user.id, user.full_name);
    }
    return map;
  }, [usersQuery.data]);

  const filteredLogs = useMemo(() => {
    const source = logsQuery.data || [];
    const lower = searchTerm.toLowerCase();
    return source.filter((log) => {
      const title = typeof log.metadata_json?.title === "string" ? log.metadata_json.title : "";
      return log.action.toLowerCase().includes(lower) || title.toLowerCase().includes(lower) || log.entity_type.toLowerCase().includes(lower);
    });
  }, [logsQuery.data, searchTerm]);

  const error = logsQuery.error;
  const isForbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Nhật ký thao tác</h1>
          <p className="text-sm text-muted-foreground mt-1">Dữ liệu audit trail theo thời gian thực từ backend.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo thao tác, entity hoặc tiêu đề..."
            className="pl-9 bg-card border-border shadow-sm h-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 h-10 bg-card" disabled>
          <Filter className="w-4 h-4" />
          Lọc nhật ký
        </Button>
      </div>

      {logsQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải nhật ký...</p>}
      {isForbidden && <p className="text-sm text-muted-foreground">Vai trò hiện tại không có quyền xem audit logs.</p>}
      {logsQuery.error && !isForbidden && <p className="text-sm text-destructive">Không thể tải nhật ký thao tác.</p>}

      <Card className="border-border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filteredLogs.map((log) => {
              const title = typeof log.metadata_json?.title === "string" ? log.metadata_json.title : log.entity_id;
              const actorName = log.actor_user_id ? userMap.get(log.actor_user_id) || log.actor_user_id : "Hệ thống";
              return (
                <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors flex gap-4">
                  <AuditIcon action={log.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {actorName} {AUDIT_ACTION_LABELS[log.action] || log.action.replaceAll("_", " ")}
                      <span className="font-medium text-foreground ml-1">{title}</span>
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span>
                        {formatDateVN(log.created_at)} lúc {formatTimeVN(log.created_at)}
                      </span>
                      <span className="font-mono bg-muted px-1 rounded text-[10px]">
                        {log.entity_type}:{log.entity_id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {!logsQuery.isLoading && filteredLogs.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Không có bản ghi nào khớp điều kiện tìm kiếm.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

