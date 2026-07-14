import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "MeDo Radar · Reddit Intelligence",
  description: "全球 SMB 需求雷达 + 竞品迁移 + 产品机会洞察",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" data-theme="light" className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <body>
        <Providers>
          <div className="grid-texture flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 px-8 py-7">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
