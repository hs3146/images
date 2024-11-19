import Link from "next/link"

export const metadata = {
    title: 'About Our Image Converter - JPG to PDF, PDF to JPG, PNG to PDF',
    description: 'Learn about our free online image converter. We offer JPG to PDF, PDF to JPG, and PNG to PDF conversions with high quality and security.',
  }
  
  export default function About() {
    return (
      <div>
           <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Convert Images and PDFs</h1>
      <p className="text-xl mb-8">Choose a conversion option:</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/jpg-to-pdf" className="bg-blue-500 text-white p-4 rounded hover:bg-blue-600 transition">
          JPG to PDF
        </Link>
        <Link href="/pdf-to-jpg" className="bg-green-500 text-white p-4 rounded hover:bg-green-600 transition">
          PDF to JPG
        </Link>
        <Link href="/png-to-pdf" className="bg-purple-500 text-white p-4 rounded hover:bg-purple-600 transition">
          PNG to PDF
        </Link>
      </div>
    </div>
        <h1 className="text-3xl font-bold mb-4">About Our Image Converter</h1>
        <p className="mb-4">
          Our Image Converter is a free online tool that allows you to easily convert between different image and document formats. We specialize in:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>Converting JPG to PDF</li>
          <li>Converting PDF to JPG</li>
          <li>Converting PNG to PDF</li>
        </ul>
        <p className="mb-4">
          Our tool is designed to be fast, secure, and produce high-quality conversions. Whether you need to convert a single image or multiple files, we&apos;ve got you covered.
        </p>
        <h2 className="text-2xl font-bold mb-2">Why Choose Our Converter?</h2>
        <ul className="list-disc list-inside mb-4">
          <li>Free to use</li>
          <li>No registration required</li>
          <li>High-quality conversions</li>
          <li>Fast and efficient</li>
          <li>Secure file handling</li>
          <li>User-friendly interface</li>
        </ul>
        <p>
          Start converting your images and PDFs today with our easy-to-use online tool!
        </p>
      </div>
    )
  }