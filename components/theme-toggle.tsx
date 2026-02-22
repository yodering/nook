"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-8 w-[100px] animate-pulse rounded-full bg-[var(--muted)]" />
    }

    return (
        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] p-1 shadow-sm h-8">
            <button
                onClick={() => setTheme("light")}
                className={`flex h-6 w-8 items-center justify-center rounded-full transition-colors ${theme === "light"
                        ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                aria-label="Light theme"
            >
                <Sun className="h-[14px] w-[14px]" />
            </button>

            <button
                onClick={() => setTheme("system")}
                className={`flex h-6 w-8 items-center justify-center rounded-full transition-colors ${theme === "system"
                        ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                aria-label="System theme"
            >
                <Monitor className="h-[14px] w-[14px]" />
            </button>

            <button
                onClick={() => setTheme("dark")}
                className={`flex h-6 w-8 items-center justify-center rounded-full transition-colors ${theme === "dark"
                        ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                aria-label="Dark theme"
            >
                <Moon className="h-[14px] w-[14px]" />
            </button>
        </div>
    )
}
