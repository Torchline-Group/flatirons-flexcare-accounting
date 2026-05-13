import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Flatirons FlexCare Accounting Dashboard",
  description: "Professional accounting dashboard with transaction management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
