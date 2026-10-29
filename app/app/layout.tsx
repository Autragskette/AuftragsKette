import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AuftragsKette – Das Unternehmernetzwerk, aus dem Aufträge entstehen",
    template: "%s | AuftragsKette",
  },
  description:
    "AuftragsKette ist ein geschlossenes Unternehmernetzwerk mit Online-Meetings, Branchentreffen und gegenseitigen Empfehlungen, aus denen neue Aufträge entstehen.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
