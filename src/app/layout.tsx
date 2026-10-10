import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "Aster Health | Care Operations",
    template: "%s | Aster Health",
  },
  description: "Hospital care operations workspace",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ToastProvider>
          <AuthProvider>{props.children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
