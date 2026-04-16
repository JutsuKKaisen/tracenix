"use client";

import React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bell, Check, FileText, MessageSquare, Settings2 } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatDateVN, formatTimeVN } from "@/lib/localization/vi";

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "info":
      return (
        <div className="bg-primary/10 p-2 rounded-full">
          <FileText className="w-5 h-5 text-primary" />
        </div>
      );
    case "warning":
      return (
        <div className="bg-destructive/10 p-2 rounded-full">
          <AlertCircle className="w-5 h-5 text-destructive" />
        </div>
      );
    case "success":
      return (
        <div className="bg-chart-5/10 p-2 rounded-full">
          <Check className="w-5 h-5 text-chart-5" />
        </div>
      );
    case "error":
      return (
        <div className="bg-destructive/10 p-2 rounded-full">
          <MessageSquare className="w-5 h-5 text-destructive" />
        </div>
      );
    default:
      return (
        <div className="bg-muted p-2 rounded-full">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      );
  }
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", token],
    queryFn: () => api.listNotifications(token!),
    enabled: Boolean(token),
  });

  const readMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!token) {
        throw new Error("Missing auth token.");
      }
      return api.markNotificationAsRead(token, notificationId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground flex items-center gap-2">
            Thông báo
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-sans">{unreadCount}</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || readMutation.isPending}
            onClick={async () => {
              const unreadIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
              for (const id of unreadIds) {
                await readMutation.mutateAsync(id);
              }
            }}
          >
            <Check className="w-4 h-4 mr-2" /> Đánh dấu đã đọc tất cả
          </Button>
          <Button variant="ghost" size="sm" className="w-9 px-0" disabled>
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {notificationsQuery.isLoading && <p className="text-sm text-muted-foreground">Đang tải thông báo...</p>}
      {notificationsQuery.error && <p className="text-sm text-destructive">Không thể tải danh sách thông báo.</p>}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`block border rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md ${
              notification.is_read ? "bg-card border-border border-opacity-50" : "bg-primary/5 border-primary/20"
            }`}
          >
            <div className="p-4 flex gap-4">
              <NotificationIcon type={notification.type} />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm ${notification.is_read ? "font-medium text-foreground/80" : "font-bold text-foreground"}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDateVN(notification.created_at)} {formatTimeVN(notification.created_at)}
                  </span>
                </div>
                <p className={`text-sm ${notification.is_read ? "text-muted-foreground" : "text-foreground/90"}`}>{notification.message}</p>
                <div className="mt-3 flex gap-2">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-primary"
                      onClick={() => readMutation.mutate(notification.id)}
                      disabled={readMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Đã đọc
                    </Button>
                  )}
                  <Link href="/activity">
                    <Button variant="outline" size="sm" className="h-8">
                      Xem nhật ký liên quan
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!notificationsQuery.isLoading && notifications.length === 0 && (
          <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">Chưa có thông báo nào.</div>
        )}
      </div>
    </div>
  );
}

