import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SellerCrew - Your AI Product Listing Team",
  description: "AI-powered Amazon listing platform with a team of specialized AI agents to create, optimize, and analyze your product listings.",
  keywords: ["Amazon", "Listing", "AI", "SEO", "E-commerce", "Product Listing", "SellerCrew"],
  icons: {
    icon: "/agents/ali.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased bg-background text-foreground font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
