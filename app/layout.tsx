import { ReactNode } from "react";

export const metadata = {
  title: "My App",
  description: "An awesome app!",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
