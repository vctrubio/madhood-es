import type { Metadata } from "next";
import { MadWordmark } from "@/components/brand/MadWordmark";
import "./theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAD Hood",
  description:
    "Una nueva guía de barrios de Madrid para entender dónde vivir, comprar, vender o invertir. Descubre el proyecto Madhood y explora Iberia.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <MadWordmark />
        {children}
      </body>
    </html>
  );
}
