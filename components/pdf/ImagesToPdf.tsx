'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, Trash2, Edit2, MoveUp, MoveDown } from 'lucide-react'
import { PDFDocument, PageSizes } from 'pdf-lib'

type ImageWithMeta = {
  id: string
  file: File
  preview: string
}

export default function ImageToPDFConverter() {
  const [images, setImages] = useState<ImageWithMeta[]>([])
  const [converting, setConverting] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file)
      }))
      setImages((prevImages) => [...prevImages, ...newImages])
    }
  }, [])

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prevImages) => prevImages.filter((image) => image.id !== id))
  }, [])

  const handleEditImage = useCallback((id: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
      fileInputRef.current.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
          const newFile = target.files[0]
          setImages((prevImages) =>
            prevImages.map((image) =>
              image.id === id
                ? { ...image, file: newFile, preview: URL.createObjectURL(newFile) }
                : image
            )
          )
        }
      }
    }
  }, [])

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index
    e.currentTarget.style.borderTop = '2px solid #000'
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.borderTop = ''
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.style.borderTop = ''
    e.currentTarget.style.opacity = '1'
    const draggedItemContent = images[dragItem.current!]
    const remainingItems = images.filter((_, index) => index !== dragItem.current)
    const newItems = [
      ...remainingItems.slice(0, dragOverItem.current),
      draggedItemContent,
      ...remainingItems.slice(dragOverItem.current)
    ]
    setImages(newItems)
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleMoveImage = useCallback((id: string, direction: 'up' | 'down') => {
    setImages((prevImages) => {
      const index = prevImages.findIndex((image) => image.id === id)
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prevImages.length - 1)
      ) {
        return prevImages
      }

      const newImages = [...prevImages]
      const newIndex = direction === 'up' ? index - 1 : index + 1
      const [movedImage] = newImages.splice(index, 1)
      newImages.splice(newIndex, 0, movedImage)

      return newImages
    })
  }, [])

  const handleConvertToPDF = useCallback(async () => {
    setConverting(true);
    setConversionProgress(0);
  
    try {
      const pdfDoc = await PDFDocument.create();
      const totalImages = images.length;
  
      for (let i = 0; i < totalImages; i++) {
        const image = images[i];
        const imageBytes = await fetch(image.preview).then((res) => res.arrayBuffer());
  
        let img;
        if (image.type === 'image/jpeg' || image.type === 'image/jpg') {
          img = await pdfDoc.embedJpg(imageBytes);
        } else if (image.type === 'image/png') {
          img = await pdfDoc.embedPng(imageBytes);
        } else {
          // For unsupported types, convert to PNG using an offscreen canvas
          const canvas = document.createElement('canvas');
          const imgElement = document.createElement('img');
          imgElement.src = image.preview;
  
          await new Promise((resolve) => {
            imgElement.onload = () => {
              canvas.width = imgElement.width;
              canvas.height = imgElement.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(imgElement, 0, 0);
              resolve(null);
            };
          });
  
          const pngDataUrl = canvas.toDataURL('image/png');
          const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
          img = await pdfDoc.embedPng(pngBytes);
        }
  
        const page = pdfDoc.addPage(PageSizes.A4);
        const { width, height } = page.getSize();
        const scaleFactor = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scaleFactor;
        const scaledHeight = img.height * scaleFactor;
  
        page.drawImage(img, {
          x: (width - scaledWidth) / 2,
          y: (height - scaledHeight) / 2,
          width: scaledWidth,
          height: scaledHeight,
        });
  
        setConversionProgress(((i + 1) / totalImages) * 100);
      }
  
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'converted_images.pdf';
      link.click();
  
      setConversionProgress(100);
    } catch (error) {
      console.error('Error converting images to PDF:', error);
    } finally {
      setConverting(false);
    }
  }, [images]);

  const handleClearAll = useCallback(() => {
    setImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className={`p-4 space-y-6 max-w-4xl mx-auto ${darkMode ? 'dark' : ''}`}>
                    <h1 className="text-4xl font-bold"><strong>Image to PDF Converter</strong></h1>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            {/* <div className="flex items-center space-x-2">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload your images</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleConvertToPDF} disabled={converting || images.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              {converting ? 'Converting...' : 'Convert to PDF'}
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {converting && (
            <Progress value={conversionProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {images.map((image, index) => (
          <Card
            key={image.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <CardContent className="p-4 flex items-center space-x-4">
              <img
                src={image.preview}
                alt={`Preview - ${image.file.name}`}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-grow">
                <p className="font-medium">{image.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(image.file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleMoveImage(image.id, 'up')} disabled={index === 0}>
                  <MoveUp className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => handleMoveImage(image.id, 'down')} disabled={index === images.length - 1}>
                  <MoveDown className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={() => handleEditImage(image.id)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleRemoveImage(image.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}