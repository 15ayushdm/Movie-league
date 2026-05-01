import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Movie Fantasy League",
  description: "8-team movie fantasy auction league",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/draft", label: "Draft" },
  { href: "/scoring", label: "Scoring" },
  { href: "/admin", label: "Admin" },
  { href: "/rules", label: "Rules" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[#292524]">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="film-title text-xl text-amber no-underline">
              <span style={{ color: "#D97706" }}>Movie</span>{" "}
              <span style={{ color: "#f5f5f4" }}>Fantasy League</span>
            </Link>
            <nav className="flex gap-5 text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="no-underline" style={{ color: "#a8a29e" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        <footer className="max-w-6xl mx-auto px-6 py-8 text-xs" style={{ color: "#57534e" }}>
          Inaugural 2026 season — single-admin private league
        </footer>
      </body>
    </html>
  );
}
