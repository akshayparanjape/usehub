import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UseHub — AI Case Studies",
  description:
    "Share and discover AI case studies. See real prompts, iterations, and outcomes from the community.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen overflow-x-hidden antialiased bg-background text-foreground`}>
        <AuthProvider>
          <Header />
          <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
