import "./globals.css";

export const metadata = {
  title: "Daymark | Your tasks, in view",
  description: "A private, simple place to keep track of what needs doing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}