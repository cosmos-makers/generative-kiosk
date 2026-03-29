import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDonald Barrier-Free Kiosk",
  description: "Hackathon-ready kiosk demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
