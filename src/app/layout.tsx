import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnestheQuest — Plataforma de Preparação para Concursos de Anestesiologia",
  description:
    "Ferramentas de aprendizagem personalizáveis para te ajudar a dominar o conteúdo mais difícil de Anestesiologia. Questões, simulados e muito mais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
