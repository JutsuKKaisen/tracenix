import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function BrandLogo({ size = 24, className, alt = "Tracenix logo", priority = false }: BrandLogoProps) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <Image src="/logo.svg" alt={alt} fill sizes={`${size}px`} className="object-contain" priority={priority} />
    </span>
  );
}
