"use client"
import Image from "next/image";
import {cn} from "@/lib/utils";
import {useTheme} from "next-themes";
import {useEffect, useState} from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
    size?: LogoSize;
    className?: string;
    priority?: boolean;
}

const sizeMap: Record<LogoSize, number> = {
    sm: 32,
    md: 64,
    lg: 128,
    xl: 256,
};

/**
 * Logo component optimized with Next.js Image.
 *
 * Automatically handles:
 * - Image optimization and format conversion (WebP/AVIF)
 * - Responsive sizing for high-DPI displays
 * - Lazy loading (unless priority is set)
 * - Theme-aware logo switching (prevents hydration mismatches)
 *
 * Sizes:
 * - sm: 32px
 * - md: 64px (default)
 * - lg: 128px
 * - xl: 256px
 */
export function Logo({size = "md", className, priority = false}: LogoProps) {
    const pixelSize = sizeMap[size];
    const {resolvedTheme} = useTheme()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch by only rendering theme-dependent content after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted && resolvedTheme === "dark"

    return (
        <Image
            src={isDark ? "/er1p-logo-light.png" : "/er1p-logo-dark.png"}
            alt="ER1P Logo"
            width={pixelSize}
            height={pixelSize}
            priority={priority}
            className={cn("inline-block", className)}
            sizes={`${pixelSize}px`}
        />
    );
}
