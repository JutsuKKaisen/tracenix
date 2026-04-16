"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { TracenixGlobe } from "@/components/ui/tracenix-globe";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showGlobe?: boolean;
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  showGlobe = true
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card/50">
      {showGlobe && (
        <div className="w-32 h-32 mb-6 opacity-60">
          <Canvas camera={{ position: [0, 0, 3] }}>
            <ambientLight intensity={0.5} />
            <TracenixGlobe radius={1.2} particlesCount={40} color="#3b82f6" speed={0.2} />
          </Canvas>
        </div>
      )}
      
      {!showGlobe && (
        <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-muted-foreground/30 border-t-muted-foreground/80 animate-spin" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold font-heading text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
