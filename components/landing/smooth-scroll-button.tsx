"use client";

import { ReactNode } from "react";

export function SmoothScrollButton({
    targetId,
    className,
    children
}: {
    targetId: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <button
            onClick={() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={className}
        >
            {children}
        </button>
    );
}
