import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Navbar } from "./components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoanFit — Loan readiness for small business",
  description:
    "Upload your financials. Get your loan readiness score. Fix what's broken.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="site-shell">
        <ClerkProvider>
          <Navbar />
          <div className="site-main">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
