"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import Grainient from "@/components/reactbits/grainient";

/**
 * Brand-teal stops for Grainient.
 * Mid/bright teals keep the warp readable under a light text veil.
 */
const BRAND_COLORS = {
  light: {
    color1: "#5aa89a",
    color2: "#0e4c4d",
    color3: "#2f8a9a",
  },
  dark: {
    color1: "#8ac4c4",
    color2: "#0e4c4d",
    color3: "#2c7e8b",
  },
} as const;

/**
 * Full-bleed Grainient background tuned to brand teals for the marketing home page.
 * Stays at z-0 (not negative) so it sits above the global body::before wash.
 */
export const HomeGrainientBackground = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = isDark ? BRAND_COLORS.dark : BRAND_COLORS.light;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Grainient
        className="h-full w-full"
        color1={colors.color1}
        color2={colors.color2}
        color3={colors.color3}
        lightMode={false}
        timeSpeed={0.25}
        contrast={1.45}
        saturation={1.2}
        grainAmount={0.14}
        warpStrength={1.1}
        warpFrequency={5}
        zoom={0.85}
      />
      <div
        className={
          isDark
            ? "absolute inset-0 bg-linear-to-r from-background/55 via-background/20 to-transparent"
            : "absolute inset-0 bg-linear-to-r from-background/65 via-background/25 to-transparent"
        }
      />
    </div>
  );
};
