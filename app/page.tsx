import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  const primaryHref = session ? "/calendar" : "/login";
  const primaryLabel = session ? "open calendar" : "continue with google";

  return (
    <main className="nook-landing">
      <div className="nook-shell">
        <section className="relative z-10 mx-auto max-w-2xl py-10 sm:py-16">
          <p className="nook-eyebrow">nook.boo • open source</p>
          <h1 className="nook-title">google calendar, reskinned.</h1>

          <p className="nook-subtitle">
            A personal open-source project with a calmer UI on top of Google
            Calendar.
          </p>

          <div className="nook-action-row">
            <Link href={primaryHref} className="nook-cta-main">
              {primaryLabel}
            </Link>
            <Link href="/login" className="nook-cta-secondary">
              log in
            </Link>
            <Link href="/about" className="nook-cta-secondary">
              about
            </Link>
          </div>
        </section>

        <div className="nook-landing-art" aria-hidden="true">
          <svg
            className="nook-sprig"
            viewBox="0 0 100 150"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g className="sprig-sway">
              <path
                d="M50,140 Q45,70 60,10"
                stroke="#526A4A"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M53,100 Q30,95 40,75 Q55,80 53,100"
                fill="#526A4A"
                opacity="0.85"
              />
              <path
                d="M56,65 Q80,55 70,35 Q55,45 56,65"
                fill="#526A4A"
                opacity="0.65"
              />
              <path
                d="M59,30 Q35,25 45,5 Q60,10 59,30"
                fill="#526A4A"
                opacity="0.9"
              />
            </g>
          </svg>

          <svg
            className="nook-bookshelf"
            viewBox="0 0 150 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="10"
              y1="90"
              x2="140"
              y2="90"
              stroke="#D7D4C9"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <rect x="30" y="35" width="16" height="55" rx="4" fill="#526A4A" />
            <rect
              x="50"
              y="45"
              width="14"
              height="45"
              rx="4"
              fill="none"
              stroke="#526A4A"
              strokeWidth="1.5"
            />
            <rect
              x="68"
              y="25"
              width="18"
              height="65"
              rx="5"
              fill="#F4F1EA"
              stroke="#D7D4C9"
              strokeWidth="1.5"
            />

            <g className="book-lean">
              <rect x="110" y="35" width="14" height="55" rx="4" fill="#526A4A" opacity="0.75" />
            </g>
          </svg>
        </div>
      </div>
    </main>
  );
}
