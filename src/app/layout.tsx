import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Aquí llamamos a nuestro guardia usando el atajo mágico
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestión de Proyectos",
  description: "Sistema de gestión de proyectos y tareas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}