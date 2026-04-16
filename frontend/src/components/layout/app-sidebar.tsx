"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  CheckSquare, 
  ShieldCheck, 
  Activity, 
  Bell, 
  Users, 
  Settings 
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/brand/brand-logo";

const NAV_ITEMS = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboard },
  { title: "Dự án", url: "/projects", icon: FolderOpen },
  { title: "Hồ sơ", url: "/documents", icon: FileText },
  { title: "Phê duyệt", url: "/approvals", icon: ShieldCheck },
  { title: "Danh mục tuân thủ", url: "/checklist", icon: CheckSquare },
  { title: "Nhật ký thao tác", url: "/activity", icon: Activity },
  { title: "Thông báo", url: "/notifications", icon: Bell },
  { title: "Người dùng", url: "/users", icon: Users },
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props} className="bg-sidebar border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border h-14 flex flex-row items-center px-4">
        <BrandLogo size={24} />
        {state !== "collapsed" && (
          <span className="font-heading font-bold text-lg ml-3 tracking-tight text-sidebar-foreground">
            Tracenix
          </span>
        )}
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  isActive={isActive} 
                  tooltip={item.title}
                  className="font-medium h-auto min-h-10 [&>span:last-child]:whitespace-normal [&>span:last-child]:leading-snug"
                  render={<Link href={item.url} />}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border text-xs text-muted-foreground flex items-center justify-center">
        {state !== "collapsed" ? "Tracenix 1.0" : "v1"}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
