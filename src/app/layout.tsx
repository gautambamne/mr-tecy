import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/providers/ToastProvider";
import { MobileGuard } from "@/components/MobileGuard";
import "@/lib/suppress-errors";

export const metadata: Metadata = {
  title: "Mr Tecy - On-site Intelligence Assistance",
  description: "Intelligent on-site assistance to book trusted technicians for vehicle, electrical, and mobile repairs at your doorstep.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mr Tecy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            <MobileGuard>
              {children}
            </MobileGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
