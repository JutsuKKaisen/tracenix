"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { ROUTE_LABELS } from "@/lib/localization/vi";

export function TopHeader() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Basic path parsing for breadcrumbs MVP
  const segments = pathname.split("/").filter(Boolean);

  const getSegmentLabel = (segment: string, index: number) => {
    if (ROUTE_LABELS[segment]) return ROUTE_LABELS[segment];
    if (index > 0 && (segments[index - 1] === "documents" || segments[index - 1] === "projects")) {
      return "Chi tiết";
    }
    return segment;
  };

  const initials = (user?.full_name || "Tracenix User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Mở hoặc thu gọn thanh điều hướng</span>
        </Button>
        
        <div className="hidden sm:block">
          <Breadcrumb>
            <BreadcrumbList>
              {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const title = getSegmentLabel(segment, index);
                const path = "/" + segments.slice(0, index + 1).join("/");
                
                return (
                  <React.Fragment key={path}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-semibold">{title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={path}>{title}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Tìm hồ sơ..." 
            className="w-64 pl-9 bg-muted/50 border-input font-sans text-sm h-9"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border">
                <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Người dùng" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          } />
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.full_name || "Người dùng"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "unknown@tracenix.local"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>Cài đặt hồ sơ</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
