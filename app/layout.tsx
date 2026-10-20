import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storeroom 3D: a digital twin of a real storeroom",
  description:
    "A to-scale 3D model of a real storeroom, built from one photo and a spreadsheet: find where everything is, see who has it, and keep the stocktake up to date.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
