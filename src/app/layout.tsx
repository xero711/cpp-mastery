import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "C++ Mastery", template: "%s | C++ Mastery" },
  description: "ゲームプログラマーを目指す学習者のための、日本語C++実践カリキュラム。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" data-theme="dark" data-scroll-behavior="smooth">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
