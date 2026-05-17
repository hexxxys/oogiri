import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "大喜利ゲーム",
  description: "みんなで遊ぶ大喜利アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
