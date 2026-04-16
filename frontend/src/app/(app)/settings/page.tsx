"use client";

import React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { 
  UserCircle, 
  Building2, 
  BellRing, 
  Shield, 
  KeyRound
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">Cài đặt</h1>
        <p className="text-sm text-muted-foreground mt-1">Quản lý thông tin tài khoản và tùy chọn vận hành của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Settings Navigation */}
        <div className="md:col-span-3 space-y-1">
          <Button variant="secondary" className="w-full justify-start mt-0 mb-1 font-medium bg-muted">
            <UserCircle className="w-4 h-4 mr-2" /> Hồ sơ
          </Button>
          <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">
            <Building2 className="w-4 h-4 mr-2" /> Doanh nghiệp
          </Button>
          <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">
             <BellRing className="w-4 h-4 mr-2" /> Thông báo
          </Button>
          <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground border-t border-border mt-2 pt-3 rounded-none">
             <KeyRound className="w-4 h-4 mr-2" /> Bảo mật
          </Button>
          <Button variant="ghost" className="w-full justify-start font-normal text-muted-foreground">
             <Shield className="w-4 h-4 mr-2" /> Mã API
          </Button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-9 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin hồ sơ</CardTitle>
              <CardDescription>Cập nhật thông tin cá nhân và địa chỉ email làm việc.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold border-2 border-primary/20">
                  AJ
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">Đổi ảnh đại diện</Button>
                  <p className="text-xs text-muted-foreground">Hỗ trợ JPG, GIF hoặc PNG. Tối đa 1MB.</p>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" defaultValue={user?.full_name || ""} className="max-w-md" />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email công việc</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} className="max-w-md" disabled />
                <p className="text-xs text-muted-foreground">Để thay đổi email, vui lòng liên hệ bộ phận CNTT.</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Vai trò hệ thống</Label>
                <Input id="role" defaultValue={user?.role || ""} className="max-w-md bg-muted text-muted-foreground pointer-events-none" readOnly />
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4 justify-end">
              <Button>Lưu thay đổi</Button>
            </CardFooter>
          </Card>

          <Card className="border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Vùng thao tác nhạy cảm</CardTitle>
              <CardDescription>Những hành động không thể hoàn tác.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                <div>
                  <h4 className="font-medium text-sm">Xóa tài khoản</h4>
                  <p className="text-xs text-muted-foreground mt-1">Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan.</p>
                </div>
                <Button variant="destructive" size="sm">Xóa tài khoản</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
