"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { useAuth } from "@/components/providers/auth-provider";
import { ApiError } from "@/lib/api/client";
import { TracenixGlobe } from "@/components/ui/tracenix-globe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const [email, setEmail] = useState("admin@tracenix.com");
  const [password, setPassword] = useState("admin12345");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Sign in failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-brand-navy flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <TracenixGlobe radius={2.5} particlesCount={150} color="#3b82f6" speed={0.4} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/20 p-3 rounded-xl mb-4 backdrop-blur-md border border-primary/30">
            <BrandLogo size={32} priority />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight">Tracenix</h1>
          <p className="text-slate-400 mt-2 text-center text-sm">Nền tảng điều phối hồ sơ và tuân thủ doanh nghiệp</p>
        </div>

        <Card className="bg-brand-slate border-border/20 backdrop-blur-md text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Login</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in để truy cập không gian vận hành
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="bg-brand-navy/50 border-border/30 text-white placeholder:text-slate-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="bg-brand-navy/50 border-border/30 text-white placeholder:text-slate-500"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <button type="button" className="hover:text-white transition-colors">
                  Forgot password?
                </button>
                <button type="button" className="hover:text-white transition-colors">
                  Reset password
                </button>
              </div>
              {errorMessage && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{errorMessage}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-slate-500 text-xs mt-8">© 2026 Tracenix Việt Nam. Bảo lưu mọi quyền.</p>
      </div>
    </div>
  );
}
