import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Investment Advisor - Smart Investment Analysis",
  description: "Compare gold, stocks, crypto, and other investment instruments with real-time data and professional charts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider>
            <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
