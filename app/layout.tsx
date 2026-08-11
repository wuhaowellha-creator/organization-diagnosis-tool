import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "组织脉络｜HRBP 组织诊断工作台",
  description: "从工作记录、辅助诊断、人工确认，到跟进复盘与报告输出的 HRBP 组织诊断闭环。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
