"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  className?: string;
  label?: string;
  callbackUrl?: string;
};

export function GoogleSignInButton({
  className,
  label = "Continue with Google",
  callbackUrl = "/calendar",
}: GoogleSignInButtonProps = {}) {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className={cn("nook-cta-main w-full border-0 px-4 py-3 text-sm", className)}
      type="button"
    >
      {label}
    </button>
  );
}
