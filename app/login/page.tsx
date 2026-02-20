import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session) {
    redirect("/calendar");
  }

  return (
    <main className="nook-landing nook-auth-wrap px-4">
      <section className="nook-auth-card">
        <p className="nook-eyebrow">nook.boo</p>
        <h1 className="nook-auth-title">welcome back to your nook.</h1>
        <p className="nook-auth-copy">
          Sign in with Google to keep your weekly view synced with the calendar
          you already use.
        </p>

        <div className="mt-6">
          <GoogleSignInButton />
        </div>

        <Link href="/" className="nook-auth-link">
          back to landing page
        </Link>
      </section>
    </main>
  );
}
