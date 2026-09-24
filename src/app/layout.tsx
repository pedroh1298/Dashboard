import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VortexAI | Operação de marketplace",
  description: "Painel operacional de vendas, pedidos e catálogo integrado ao Bling ERP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
