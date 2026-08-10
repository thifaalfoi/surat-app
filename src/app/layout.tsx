import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMSurat — Manajemen Surat Masuk & Keluar",
  description: "Aplikasi pengelolaan surat masuk dan surat keluar instansi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-(--background) text-(--foreground)">
        {children}
      </body>
    </html>
  );
}
