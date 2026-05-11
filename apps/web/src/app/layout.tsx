import type { ReactNode } from "react";

export const metadata = {
  title: "Ledger Mock",
  description: "Financial movement tracker mock frontend"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 24 }}>{children}</body>
    </html>
  );
}
