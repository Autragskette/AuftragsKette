import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  applicationName: "AuftragsKette",
  appleWebApp: {
    capable: true,
    title: "AuftragsKette",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
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
      className={`${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
