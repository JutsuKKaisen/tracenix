"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Search, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { formatDateVN, USER_ROLE_LABELS } from "@/lib/localization/vi";
import { UserCreate, UserRole } from "@/types";

const INITIAL_FORM: UserCreate = {
  full_name: "",
  email: "",
  password: "",
  role: "viewer",
  is_active: true,
};

function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case "system_admin":
      return (
        <Badge variant="default" className="bg-destructive hover:bg-destructive text-white">
          <ShieldAlert className="w-3 h-3 mr-1" /> {USER_ROLE_LABELS[role]}
        </Badge>
      );
    case "project_manager":
      return (
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
          <ShieldCheck className="w-3 h-3 mr-1" /> {USER_ROLE_LABELS[role]}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-foreground">
          {USER_ROLE_LABELS[role]}
        </Badge>
      );
  }
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { token, user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<UserCreate>(INITIAL_FORM);
  const [formError, setFormError] = useState<string | null>(null);

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
      if (!form.full_name || !form.email || !form.password) {
        throw new Error("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      }
      return api.createUser(token, form);
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setForm(INITIAL_FORM);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
      ]);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const filteredUsers = useMemo(() => {
    const source = usersQuery.data || [];
    const lower = searchTerm.toLowerCase();
    return source.filter((user) => user.full_name.toLowerCase().includes(lower) || user.email.toLowerCase().includes(lower));
  }, [usersQuery.data, searchTerm]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Người dùng</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý tài khoản và vai trò truy cập hệ thống.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Mời người dùng
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo người dùng</DialogTitle>
              <DialogDescription>Chức năng dành cho vai trò `system_admin`.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                setFormError(null);
                createMutation.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label>Họ tên</Label>
                <Input value={form.full_name} onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Mật khẩu</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Vai trò</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.role}
                    onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                  >
                    <option value="system_admin">Quản trị hệ thống</option>
                    <option value="project_manager">Quản lý dự án</option>
                    <option value="document_controller">Điều phối hồ sơ</option>
                    <option value="site_engineer">Kỹ sư hiện trường</option>
                    <option value="approver">Phê duyệt</option>
                    <option value="viewer">Theo dõi</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.value === "active" }))}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm khóa</option>
                  </select>
                </div>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo người dùng"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo tên hoặc email..." className="pl-9 h-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </div>
        </div>

        {usersQuery.isLoading && <div className="p-6 text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>}
        {usersQuery.error && <div className="p-6 text-sm text-destructive">Không thể tải danh sách người dùng.</div>}

        {!usersQuery.isLoading && !usersQuery.error && (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Người dùng / Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.is_active ? "" : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {user.full_name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {user.full_name}
                          {currentUser?.id === user.id && <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Bạn</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-chart-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-chart-5" />
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        Tạm khóa
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateVN(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

