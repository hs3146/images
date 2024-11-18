import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Image Converter - JPG to PDF, PDF to JPG, PNG to PDF',
  description: 'Convert JPG to PDF, PDF to JPG, and PNG to PDF easily with our free online tool. Fast, secure, and high-quality image and PDF conversion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4">
          <nav className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">Image Converter</Link>
            <ul className="flex space-x-4">
              <li><Link href="/jpg-to-pdf">JPG to PDF</Link></li>
              <li><Link href="/pdf-to-jpg">PDF to JPG</Link></li>
              <li><Link href="/png-to-pdf">PNG to PDF</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          </nav>
        </header>
        <main className="container mx-auto mt-8 px-4">
          {children}
        </main>
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            &copy; 2023 Image Converter. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}