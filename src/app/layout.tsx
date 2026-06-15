import type { Metadata } from "next";
import "./globals.css";
import { DemoStateProvider } from "@/lib/demo-state";

export const metadata: Metadata = {
  title: "Interro - Client Onboarding & Admin",
  description: "Interro onboarding and compliance management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <DemoStateProvider>{children}</DemoStateProvider>
      </body>
    </html>
  );
}
