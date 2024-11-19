"use client"
import EnhancedMultiFileConversionForm from '@/components/ConversionForm'
import FeaturesGrid from '@/components/Grid/FeaturesGrid/FeaturesGrid'
import ImageEditor from '@/components/pdf/Image'
import ImageToPDFConverter from '@/components/pdf/ImagesToPdf'
import PDFToolkit from '@/components/pdf/PdfToolkit'
import React, {  useState } from 'react'

const Home = () => {
  const [format , setFormat] = useState('gif');

 
  return (
    <div>
      <ImageEditor/>
         <ImageToPDFConverter/>
   <EnhancedMultiFileConversionForm  format={format}/>
   <FeaturesGrid setFormat={setFormat}/>
   <PDFToolkit/>


    </div>
  )
}

export default Home