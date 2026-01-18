"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AntigravityCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    active?: boolean; // If true, triggers Neon Glow
    glowColor?: "cyan" | "purple" | "pink";
}

export function AntigravityCard({
    children,
    className,
    active = false,
    glowColor = "cyan",
    ...props
}: AntigravityCardProps) {

    // Map glow colors to Tailwind shadow classes (requires arbitrary values or custom CSS)
    const glowStyles = {
        cyan: "shadow-[0_0_20px_rgba(0,240,255,0.3)] border-cyan-500/50",
        purple: "shadow-[0_0_20px_rgba(189,0,255,0.3)] border-purple-500/50",
        pink: "shadow-[0_0_20px_rgba(255,0,85,0.3)] border-pink-500/50",
    };

    return (
        <div
            className={cn(
                // Base Layout
                "relative rounded-xl p-6 transition-all duration-500",

                // Glassmorphism (Frosted Glass)
                "bg-[#050505]/60 backdrop-blur-xl border border-white/5",

                // "Floating" Animation
                "animate-float hover:animate-none", // Floats by default, stops on hover for interaction

                // Active State (Neon Glow)
                active ? glowStyles[glowColor] : "hover:border-white/10 hover:shadow-lg hover:shadow-cyan-500/5",

                className
            )}
            {...props}
        >
            {/* Background Gradient Mesh (Optional "Space" vibes) */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 rounded-xl pointer-events-none" />

            {/* Content with Z-Index to sit above backgrounds */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

// Usage Example Component
export function DemoAntigravity() {
    return (
        <div className="p-20 bg-[#050505] min-h-screen grid grid-cols-3 gap-10">
            <AntigravityCard active glowColor="cyan">
                <h3 className="text-cyan-400 font-bold mb-2 tracking-widest uppercase text-xs">Signal Detected</h3>
                <div className="text-4xl font-mono text-white font-bold">BTC/USDT</div>
                <div className="text-emerald-400 mt-2">Long Entry: $95,230</div>
            </AntigravityCard>

            <AntigravityCard glowColor="purple">
                <h3 className="text-purple-400 font-bold mb-2 tracking-widest uppercase text-xs">AI Core</h3>
                <div className="text-slate-300">Processing Tensor Stream...</div>
                <div className="h-1 w-full bg-slate-800 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-2/3 animate-pulse" />
                </div>
            </AntigravityCard>
        </div>
    )
}
