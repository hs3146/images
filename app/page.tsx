"use client"
import EnhancedMultiFileConversionForm from '@/components/ConversionForm'
import FeaturesGrid from '@/components/Grid/FeaturesGrid/FeaturesGrid'
import React, {  useState } from 'react'

const Home = () => {
  const [format , setFormat] = useState('gif');

 
  return (
    <div>
   <EnhancedMultiFileConversionForm  format={format}/>
   <FeaturesGrid setFormat={setFormat}/>

    </div>
  )
}

export default Home