import "./globals.css";

export const metadata = {
  title: "My Chess dApp",
  description: "A dApp example",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
