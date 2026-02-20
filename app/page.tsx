import Link from "next/link";
import { auth } from "@/lib/auth";
import { SmoothScrollButton } from "@/components/landing/smooth-scroll-button";

export default async function Page() {
  const session = await auth();
  const primaryHref = session ? "/calendar" : "/login";
  const primaryLabel = session ? "open calendar" : "continue with google";

  return (
    <main className="min-h-screen w-full bg-[#FCFAF6] text-[#3D3530] flex flex-col relative overflow-hidden selection:bg-[#7F9F95]/30 scroll-smooth">

      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden fixed">
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF6] via-[#F4EFE6] to-[#EAE3D6] opacity-70" />

        {/* Floating Ambient Orbs (Static for performance) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#E5D4C0] opacity-40 blur-[80px]" />
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#D5E1D0] opacity-40 blur-[80px]" />
        <div className="absolute bottom-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#D2CEBE] opacity-40 blur-[80px]" />

        {/* Subtle noise texture for a premium analog feel */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 w-full max-w-4xl pt-8 pb-16 mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFFFF]/40 border border-[#A08C78]/20 backdrop-blur-md mb-8 shadow-sm transition-all hover:bg-[#FFFFFF]/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7F9F95]"></span>
          <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#6B5D54]">open source</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-serif tracking-tight leading-[1.05] text-[#2D2520] mb-6 drop-shadow-sm">
          google calendar,<br className="hidden md:block" />
          <span className="font-light italic text-[#81746B] pl-2 md:pl-0">reskinned.</span>
        </h1>

        <p className="text-lg md:text-xl text-[#6B5D54] font-light max-w-2xl leading-relaxed mb-12">
          i just dont like google calendar.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-16">
          <Link
            href={primaryHref}
            className="group relative px-8 py-3.5 bg-[#2D2520] text-[#FCFAF6] rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-[0_12px_40px_rgba(45,37,32,0.3)] flex items-center gap-2"
          >
            <span className="relative z-10 font-medium text-sm tracking-wide">{primaryLabel}</span>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </Link>

          <div className="flex items-center gap-5 sm:pl-2">
            <Link
              href="/login"
              className="group text-sm font-medium text-[#81746B] hover:text-[#2D2520] transition-colors relative py-1"
            >
              log in
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2520] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
            <span className="text-[#A08C78]/30 text-sm">•</span>
            <SmoothScrollButton
              targetId="about"
              className="group text-sm font-medium text-[#81746B] hover:text-[#2D2520] transition-colors relative py-1"
            >
              about
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#2D2520] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </SmoothScrollButton>
          </div>
        </div>

        {/* Scroll Indicator */}
        <SmoothScrollButton
          targetId="about"
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[#A08C78]/60 flex flex-col items-center gap-3 transition-opacity hover:opacity-100 hover:text-[#2D2520]"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">scroll to explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-current to-transparent" />
        </SmoothScrollButton>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 w-full max-w-3xl mx-auto py-24">
        <div className="w-full flex flex-col items-center sm:items-start text-center sm:text-left bg-[#FFFFFF]/40 border border-[#A08C78]/10 backdrop-blur-xl p-10 md:p-14 rounded-[2rem] shadow-sm">
          <p className="text-[#A08C78] text-[11px] font-medium tracking-[0.2em] uppercase mb-4">why?</p>
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight leading-[1.1] text-[#2D2520] mb-8">
            made with intent <span className="italic text-[#81746B] font-light">by David.</span>
          </h2>

          <p className="text-lg text-[#6B5D54] font-light leading-relaxed mb-10">
            nook is an open-source google calendar reskin. calendar events stay in
            google, and extra per-user data like todo lists and user preferences
            are stored on a railway instance.
            <br /><br />
            the idea behind the project was simple: i wanted to combine my to-do lists alongside a calendar app... i got tired of trying different apps that just didn't work for me or required a subscription.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-8 pt-6 border-t border-[#A08C78]/20 w-full">
            <a
              href="https://github.com/yodering/nook"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 text-sm font-medium text-[#2D2520] hover:text-[#7F9F95] transition-colors"
            >
              <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
              </svg>
              github repo
            </a>
            <a
              href="https://yoder.ing"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 text-sm font-medium text-[#81746B] hover:text-[#2D2520] transition-colors"
            >
              <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              yoder.ing
            </a>
          </div>
        </div>

        {/* Footer brand */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#A08C78]/40 flex flex-col items-center gap-2 pointer-events-none mix-blend-multiply">
          <span className="text-[10px] uppercase tracking-[0.3em]">nook.boo</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#A08C78]/40 to-transparent" />
        </div>
      </section>
    </main>
  );
}
