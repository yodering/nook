"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/calendar" })}
      className="nook-cta-main w-full border-0 px-4 py-3 text-sm"
      type="button"
    >
      Continue with Google
    </button>
  );
}
