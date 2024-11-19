import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import html2canvas from 'html2canvas';
import { 
  RotateCw, 
  Maximize2, 
  FlipHorizontal, 
  FlipVertical, 
  Download 
} from 'lucide-react';
import { PDFDocument, PageSizes } from 'pdf-lib';

interface Position {
  x: number;
  y: number;
}

interface ImageState {
  scale: number;
  rotation: number;
  position: Position;
  flipX: boolean;
  flipY: boolean;
}

const ImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageState, setImageState] = useState<ImageState>({
    scale: 1,
    rotation: 0,
    position: { x: 0, y: 0 },
    flipX: false,
    flipY: false,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // A4 dimensions in pixels (96 DPI)
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imageState.position.x,
      y: e.clientY - imageState.position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setImageState(prev => ({
        ...prev,
        position: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (value: number[]) => {
    setImageState(prev => ({
      ...prev,
      scale: value[0]
    }));
  };

  const handleRotate = () => {
    setImageState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleFlipX = () => {
    setImageState(prev => ({
      ...prev,
      flipX: !prev.flipX
    }));
  };

  const handleFlipY = () => {
    setImageState(prev => ({
      ...prev,
      flipY: !prev.flipY
    }));
  };

  const resetTransform = () => {
    setImageState({
      scale: 1,
      rotation: 0,
      position: { x: 0, y: 0 },
      flipX: false,
      flipY: false,
    });
  };

  const exportToPDF = async () => {
    if (!containerRef.current) return;

    try {
      // Remove scale transform temporarily for capture
      const container = containerRef.current;
      const originalTransform = container.style.transform;
      container.style.transform = 'scale(1)';

      // Capture the component at full resolution
      const canvas = await html2canvas(container, {
        scale: 2, // Increase quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        width: A4_WIDTH,
        height: A4_HEIGHT,
      });

      // Restore original transform
      container.style.transform = originalTransform;

      // Create PDF with exact A4 size
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(PageSizes.A4);
      
      // Convert canvas to image bytes
      const imageData = canvas.toDataURL('image/png');
      const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
      
      // Embed image in PDF
      const pdfImage = await pdfDoc.embedPng(imageBytes);
      
      // Calculate dimensions to fill A4 page
      const { width: pdfWidth, height: pdfHeight } = page.getSize();
      
      // Draw image to fill the page
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfWidth,
        height: pdfHeight,
      });

      // Save and download PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'edited-image.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-full max-w-4xl mx-auto">
      {/* Image Upload */}
      <div className="w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* A4 Preview Container */}
    <div className="border">
    <div className=" origin-top border">
        <div
          ref={containerRef}
          className="relative bg-white shadow-lg overflow-hidden"
          style={{
            width: `${A4_WIDTH}px`,
            height: `${A4_HEIGHT}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {image && (
            <img
              ref={imageRef}
              src={image}
              alt="Uploaded image"
              className="absolute"
              style={{
                transform: `
                  translate(${imageState.position.x}px, ${imageState.position.y}px)
                  scale(${imageState.scale * (imageState.flipX ? -1 : 1)}, 
                        ${imageState.scale * (imageState.flipY ? -1 : 1)})
                  rotate(${imageState.rotation}deg)
                `,
                transformOrigin: 'center',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            />
          )}
        </div>
      </div>
    </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-center w-full max-w-xl">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm mb-2">Zoom</p>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={[imageState.scale]}
            onValueChange={handleZoom}
          />
        </div>

        <Button onClick={resetTransform} variant="outline" size="icon">
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button onClick={handleRotate} variant="outline" size="icon">
          <RotateCw className="h-4 w-4" />
        </Button>

        <Button onClick={handleFlipX} variant="outline" size="icon">
          <FlipHorizontal className="h-4 w-4" />
        </Button>

        <Button onClick={handleFlipY} variant="outline" size="icon">
          <FlipVertical className="h-4 w-4" />
        </Button>

        <Button onClick={exportToPDF} variant="default">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>
    </div>
  );
};

export default ImageEditor;