import { Button } from '@/components/ui/button';
import React from 'react'

const FeaturesGrid = ({setFormat}: { setFormat: (format: string) => void }) => {
    const features = [
        { title: 'jpg to png', input: 'jpg', output: 'png' },
        { title: 'jpg to gif', input: 'jpg', output: 'gif' },
        { title: 'jpg to bmp', input: 'jpg', output: 'bmp' },
        { title: 'jpg to webp', input: 'jpg', output: 'webp' },
        { title: 'png to jpg', input: 'png', output: 'jpeg' },
        { title: 'png to gif', input: 'png', output: 'gif' },
        { title: 'png to bmp', input: 'png', output: 'bmp' },
        { title: 'png to webp', input: 'png', output: 'webp' },
        { title: 'gif to jpg', input: 'gif', output: 'jpeg' },
        { title: 'gif to png', input: 'gif', output: 'png' },
        { title: 'gif to bmp', input: 'gif', output: 'bmp' },
        { title: 'gif to webp', input: 'gif', output: 'webp' },
        { title: 'bmp to jpg', input: 'bmp', output: 'jpeg' },
        { title: 'bmp to png', input: 'bmp', output: 'png' },
        { title: 'bmp to gif', input: 'bmp', output: 'gif' },
        { title: 'bmp to webp', input: 'bmp', output: 'webp' },
        { title: 'webp to jpg', input: 'webp', output: 'jpeg' },
        { title: 'webp to png', input: 'webp', output: 'png' },
        { title: 'webp to gif', input: 'webp', output: 'gif' },
        { title: 'webp to bmp', input: 'webp', output: 'bmp' }
    ];
    
  return (
    <div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{features.map((feature , index)=>{
            return (
                <Button variant={'outline'} key={`a${index}`} className="p-4 h-auto" onClick={() => setFormat(feature.output)}>
                    <div  className="text-center text-gray-950 text-2xl">
                    {feature.title}
                    </div>
                </Button>
            )
        })}</div>
    </div>
  )
}

export default FeaturesGrid