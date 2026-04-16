"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] w-full items-center justify-center p-6">
      <Card className="w-full max-w-lg border-destructive/20 shadow-lg">
        <CardContent className="pt-10 pb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-3">Đã xảy ra lỗi</h2>
          
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
            Hệ thống gặp lỗi ngoài dự kiến khi tải trang hoặc kết nối dịch vụ. Đội kỹ thuật đã nhận được thông tin để xử lý.
          </p>
          
          <div className="flex gap-4">
            <Button onClick={reset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Thử lại
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Về trang Tổng quan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
