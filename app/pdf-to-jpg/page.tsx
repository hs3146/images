import ConversionForm from "@/components/ConversionForm"

export const metadata = {
  title: 'Convert PDF to JPG - Free Online PDF to JPG Converter',
  description: 'Convert PDF files to JPG images quickly and easily with our free online tool. High-quality PDF to JPG conversion.',
}

export default function PdfToJpg() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Convert PDF to JPG</h1>
      <ConversionForm conversionType="pdf-to-jpg" />
    </div>
  )
}