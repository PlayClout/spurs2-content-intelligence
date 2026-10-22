import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spursx2 AI",
  description:
    "The AI finds the moment, understands the opportunity, recommends the strategy, and produces the content. The producer makes the decision.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="app-wash min-h-screen antialiased">{children}</body>
    </html>
  );
}
