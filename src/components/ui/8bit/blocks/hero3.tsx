"use client";

import Link from "next/link";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
} from "@/components/ui/8bit/card";

import "@/components/ui/8bit/styles/retro.css";

interface HeroStat {
  label: string;
  value: string;
}

interface HeroAction {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive" | "ghost" | "outline" | "secondary";
}

interface Hero3Props {
  actions?: HeroAction[];
  children?: ReactNode;
  className?: string;
  description?: string;
  stats?: HeroStat[];
  subtitle?: string;
  title: ReactNode | string;
}

function BlinkingText({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={visible ? "opacity-100" : "opacity-0"}>
      {children}
    </span>
  );
}

export default function Hero3({
  title,
  subtitle,
  description,
  actions = [],
  stats = [],
  className,
  children,
}: Hero3Props) {
  const defaultStats: HeroStat[] = stats.length > 0 ? stats : [
    { label: "COMPONENTS", value: "50+" },
    { label: "GITHUB STARS", value: "1.7K" },
    { label: "CONTRIBUTORS", value: "100+" },
  ];

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden px-4 py-12 md:py-20",
        className,
      )}
    >
      {/* Scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center flex flex-col items-center">
        {/* Subtitle badge */}
        {subtitle && (
          <div className="mb-6 flex justify-center">
            <Badge className="px-3.5 py-1.5 min-h-[26px] inline-flex items-center justify-center leading-none text-xs">
              {subtitle}
            </Badge>
          </div>
        )}

        {/* Title — large game-style */}
        <h1 className="retro mb-6 font-bold text-3xl sm:text-5xl md:text-6xl tracking-tight leading-tight flex flex-col items-center justify-center gap-1.5 text-center">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground retro text-xs sm:text-sm leading-relaxed text-center">
            {description}
          </p>
        )}

        {/* Stats row */}
        <div className="mb-8 flex flex-wrap justify-center gap-3 sm:gap-4">
          {defaultStats.map((stat) => (
            <Card key={stat.label} className="min-w-[96px] sm:min-w-[110px]">
              <CardContent className="flex flex-col items-center justify-center px-4 py-3 sm:px-6 sm:py-4 text-center">
                <span className="retro font-bold text-xl md:text-2xl leading-none">
                  {stat.value}
                </span>
                <span className="retro mt-2 text-muted-foreground text-xs font-bold inline-flex items-center justify-center leading-none">
                  {stat.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        {actions.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-4">
            {actions.map((action) =>
              action.href ? (
                <Button
                  key={action.label}
                  variant={action.variant}
                  className="min-h-[44px] px-8 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center leading-none tracking-wide"
                  asChild
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ) : (
                <Button
                  key={action.label}
                  onClick={action.onClick}
                  variant={action.variant}
                  className="min-h-[44px] px-8 py-2.5 text-xs sm:text-sm inline-flex items-center justify-center leading-none tracking-wide"
                >
                  {action.label}
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="retro text-muted-foreground text-xs leading-none">
            <BlinkingText>PRESS START</BlinkingText>
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
