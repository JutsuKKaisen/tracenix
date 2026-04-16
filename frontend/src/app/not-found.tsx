import React from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
      <div className="max-w-md text-center">
        <EmptyState 
          title="404 - Không tìm thấy trang"
          description="Nội dung bạn đang truy cập có thể đã được di chuyển, đổi tên hoặc tạm thời không khả dụng."
          showGlobe={false}
        />
        <div className="mt-6">
          <Link href="/">
             <Button className="w-full sm:w-auto">Về trang chủ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
