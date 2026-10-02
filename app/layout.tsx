import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Madhood — España, ciudad a ciudad",
  description:
    "Explora las ciudades de España y las autovías que las conectan en un mapa de la península ibérica.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
