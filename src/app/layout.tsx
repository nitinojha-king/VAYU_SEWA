import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Vayu Sewa — Predictive Maintenance & Fleet Availability",
  description:
    "AI/ML-based predictive maintenance and fleet availability platform for military aircraft. Live airframe health monitoring, fault prediction, digital twin, work orders and spares logistics.",
  keywords: [
    "Vayu Sewa",
    "predictive maintenance",
    "fleet availability",
    "aircraft health monitoring",
    "digital twin",
    "defence",
    "aircraft",
  ],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231B2B4B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white text-slate-900">{children}
        <Toaster />
      </body>
    </html>
  );
}
