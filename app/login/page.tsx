import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-[#FCFAF6] text-[#3D3530] flex flex-col relative overflow-hidden selection:bg-[#7F9F95]/30">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden fixed">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF6] via-[#F4EFE6] to-[#EAE3D6] opacity-70" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E5D4C0] opacity-40 blur-[80px]" />
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D5E1D0] opacity-40 blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#D2CEBE] opacity-40 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-[#A08C78]/15 bg-[#FFFFFF]/45 p-8 md:p-10 shadow-[0_22px_60px_rgba(45,37,32,0.12)] backdrop-blur-xl">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#6B5D54]">nook.boo</p>
          <h1 className="mt-4 text-[clamp(2rem,4.5vw,2.7rem)] leading-[1.02] tracking-tight font-serif text-[#2D2520]">
            welcome back to your <span className="italic font-light text-[#81746B]">nook.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B5D54]">
            Sign in with Google to keep your weekly view synced with the calendar you already use.
          </p>

          <div className="mt-8">
            <GoogleSignInButton
              label="continue with google"
              className="group relative border-0 px-8 py-3.5 bg-[#2D2520] text-[#FCFAF6] rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[0_12px_40px_rgba(45,37,32,0.3)] flex items-center justify-center gap-2"
            />
          </div>

          <div className="mt-6 flex items-center gap-3 text-[12px] text-[#81746B]">
            <span className="h-px flex-1 bg-[#A08C78]/25" />
            <span>events stay in Google Calendar</span>
            <span className="h-px flex-1 bg-[#A08C78]/25" />
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#81746B] hover:text-[#2D2520] transition-colors relative py-1"
          >
            <span aria-hidden>←</span>
            back to landing page
          </Link>
        </div>
      </section>
    </main>
  );
}
