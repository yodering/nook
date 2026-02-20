import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="nook-landing">
      <div className="nook-shell">
        <section className="nook-about-wrap">
          <p className="nook-eyebrow">about nook</p>
          <h1 className="nook-title">made with love by david.</h1>

          <p className="nook-subtitle">
            Nook is an open-source Google Calendar reskin. Calendar events stay in
            Google, and extra per-user data like todo lists and simple preferences
            are stored on Railway.
          </p>

          <div className="nook-action-row">
            <a
              href="https://github.com/yodering/nook"
              target="_blank"
              rel="noreferrer"
              className="nook-cta-main"
            >
              github repo
            </a>
            <a
              href="https://yoder.ing"
              target="_blank"
              rel="noreferrer"
              className="nook-cta-secondary"
            >
              yoder.ing
            </a>
            <Link href="/" className="nook-cta-secondary">
              back home
            </Link>
          </div>

          <section className="nook-screenshot-block" aria-label="Screenshots coming soon">
            <h2 className="nook-screenshot-title">screenshots (coming soon)</h2>
            <div className="nook-screenshot-grid">
              <div className="nook-screenshot-placeholder">
                <p>calendar week view placeholder</p>
              </div>
              <div className="nook-screenshot-placeholder">
                <p>tasks + list preferences placeholder</p>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
