import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Poppins-Regular.ttf",
});

export const metadata = {
  title: "MASI",
  description: "um sistema de uso interno",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={geistSans.className}>{children}</body>
    </html>
  );
}
