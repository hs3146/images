// 'use client';

// import { useState } from 'react';

// export default function ConversionForm({ conversionType }: { conversionType: string }) {
//   const [file, setFile] = useState<File | null>(null);
//   const [converting, setConverting] = useState(false);
//   const [convertedFile, setConvertedFile] = useState<File | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setFile(e.target.files[0]);
//     }
//   };

//   const convertImage = async (file: File, conversionType: string) => {
//     const img = new Image();
//     img.src = URL.createObjectURL(file);

//     await img.decode();

//     const canvas = document.createElement('canvas');
//     const ctx = canvas.getContext('2d');
//     if (!ctx) throw new Error('Canvas context not available');

//     canvas.width = img.width;
//     canvas.height = img.height;
//     ctx.drawImage(img, 0, 0);

//     // Apply conversion based on the type
//     switch (conversionType) {
//       case 'jpeg-to-png':
//         return await canvasToBlob(canvas, 'image/png');
//       case 'png-to-jpeg':
//         return await canvasToBlob(canvas, 'image/jpeg', 0.9);
//       case 'image-to-webp':
//         return await canvasToBlob(canvas, 'image/webp', 0.8);
//       case 'resize-50':
//         const resizeCanvas = document.createElement('canvas');
//         resizeCanvas.width = canvas.width / 2;
//         resizeCanvas.height = canvas.height / 2;
//         const resizeCtx = resizeCanvas.getContext('2d');
//         resizeCtx?.drawImage(canvas, 0, 0, resizeCanvas.width, resizeCanvas.height);
//         return await canvasToBlob(resizeCanvas, 'image/png');
//       case 'grayscale':
//         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//         const data = imageData.data;
//         for (let i = 0; i < data.length; i += 4) {
//           const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
//           data[i] = avg; // Red
//           data[i + 1] = avg; // Green
//           data[i + 2] = avg; // Blue
//         }
//         ctx.putImageData(imageData, 0, 0);
//         return await canvasToBlob(canvas, 'image/png');
//       default:
//         throw new Error('Unsupported conversion type');
//     }
//   };

//   const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality = 1.0): Promise<File> => {
//     return new Promise((resolve, reject) => {
//       canvas.toBlob(
//         (blob) => {
//           if (!blob) {
//             reject(new Error('Blob generation failed'));
//           } else {
//             const fileType = type.split('/')[1];
//             resolve(new File([blob], `converted.${fileType}`, { type }));
//           }
//         },
//         type,
//         quality
//       );
//     });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!file) return;

//     setConverting(true);

//     try {
//       const converted = await convertImage(file, conversionType);
//       setConvertedFile(converted);
//       alert('Conversion complete!');
//     } catch (error) {
//       console.error('Conversion failed:', error);
//       alert('Conversion failed!');
//     } finally {
//       setConverting(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
//           Upload your file
//         </label>
//         <input
//           id="file-upload"
//           name="file-upload"
//           type="file"
//           accept="image/jpeg,image/png,image/webp"
//           onChange={handleFileChange}
//           className="mt-1 block w-full text-sm text-gray-500
//             file:mr-4 file:py-2 file:px-4
//             file:rounded-full file:border-0
//             file:text-sm file:font-semibold
//             file:bg-blue-50 file:text-blue-700
//             hover:file:bg-blue-100"
//         />
//       </div>
//       <button
//         type="submit"
//         disabled={!file || converting}
//         className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//       >
//         {converting ? 'Converting...' : 'Convert'}
//       </button>
//       {convertedFile && (
//         <a
//           href={URL.createObjectURL(convertedFile)}
//           download={convertedFile.name}
//           className="block mt-4 text-blue-500 hover:underline"
//         >
//           Download Converted File
//         </a>
//       )}
//     </form>
//   );
// }
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, RefreshCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import JSZip from 'jszip';
import { useParams } from 'next/navigation';

type FileWithMeta = {
  file: File;
  outputFormat: string;
  quality: number;
  convertedFile: File | null;
  actualSize: number | null;
  id: string;
  previewUrl: string | null;
};

const workerCode = `
  self.onmessage = async function(e) {
    const { file, outputFormat, quality } = e.data;
    const img = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const blob = await canvas.convertToBlob({ type: outputFormat, quality: quality / 100 });
    const convertedFile = new File([blob], file.name.split('.')[0] + '.' + outputFormat.split('/')[1], { type: outputFormat });
    self.postMessage({ id: e.data.id, convertedFile, actualSize: convertedFile.size });
  };
`;

const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);

export default function EnhancedMultiFileConversionForm() {
  const [files, setFiles] = useState<FileWithMeta[]>([]);
  const params = useParams();
  //Globeconst format = params.format;
  
  const [converting, setConverting] = useState(false);
  const [globalFormat, setGlobalFormat] = useState<string>('image/png');
  const [globalQuality, setGlobalQuality] = useState<number>(100);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);



 
  useEffect(() => {
    
    // Check for image types in params and set corresponding format
    if (params['convert-to-jpg'] === 'true' || params['convert-to-jpeg'] === 'true') {
      setGlobalFormat('image/jpeg');
    } else if (params['convert-to-png'] === 'true') {
      setGlobalFormat('image/png');
    } else if (params['convert-to-gif'] === 'true') {
      setGlobalFormat('image/gif');
    } else if (params['convert-to-webp'] === 'true') {
      setGlobalFormat('image/webp');
    } else if (params['convert-to-bmp'] === 'true') {
      setGlobalFormat('image/bmp');
    } else if (params['convert-to-tiff'] === 'true') {
      setGlobalFormat('image/tiff');
    } else {
      // Default to PNG if no valid image type is found
      setGlobalFormat('image/png');
    }
  }, [params]);

  useEffect(() => {
    const workerCount = navigator.hardwareConcurrency || 4;
    const newWorkers = Array.from({ length: workerCount }, () => new Worker(workerUrl));
    setWorkers(newWorkers);

    return () => {
      newWorkers.forEach(worker => worker.terminate());
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        outputFormat: globalFormat,
        quality: globalQuality,
        convertedFile: null,
        actualSize: null,
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
      }));
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  }, [globalFormat, globalQuality]);

  const handleGlobalFormatChange = useCallback((value: string) => {
    setGlobalFormat(value);
    setFiles((prevFiles) =>
      prevFiles.map((f) => ({ ...f, outputFormat: value }))
    );
  }, []);

  const handleGlobalQualityChange = useCallback((value: number[]) => {
    const newQuality = value[0];
    setGlobalQuality(newQuality);
    setFiles((prevFiles) =>
      prevFiles.map((f) => ({ ...f, quality: newQuality }))
    );
  }, []);

  const handleFormatChange = useCallback((id: string, format: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === id ? { ...f, outputFormat: format } : f
      )
    );
  }, []);

  const handleQualityChange = useCallback((id: string, quality: number[]) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === id ? { ...f, quality: quality[0] } : f
      )
    );
  }, []);

  const convertImage = useCallback((file: FileWithMeta, worker: Worker): Promise<{ convertedFile: File, actualSize: number }> => {
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.id === file.id) {
          resolve({ convertedFile: e.data.convertedFile, actualSize: e.data.actualSize });
        }
      };
      worker.onerror = reject;
      worker.postMessage({
        id: file.id,
        file: file.file,
        outputFormat: file.outputFormat,
        quality: file.quality,
      });
    });
  }, []);

  const handleConvertAll = useCallback(async () => {
    setConverting(true);
    setConversionProgress(0);
    try {
      const totalFiles = files.length;
      const convertedFiles = await Promise.all(
        files.map(async (f, index) => {
          const worker = workers[index % workers.length];
          const { convertedFile, actualSize } = await convertImage(f, worker);
          setConversionProgress((prevProgress) => prevProgress + (100 / totalFiles));
          return { ...f, convertedFile, actualSize, previewUrl: URL.createObjectURL(convertedFile) };
        })
      );
      setFiles(convertedFiles);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setConverting(false);
      setConversionProgress(100);
    }
  }, [files, workers, convertImage]);

  const handleConvertSingle = useCallback(async (id: string) => {
    setConverting(true);
    try {
      const fileToConvert = files.find((f) => f.id === id);
      if (!fileToConvert) throw new Error('File not found');

      const worker = workers[0];
      const { convertedFile, actualSize } = await convertImage(fileToConvert, worker);

      setFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === id ? { ...f, convertedFile, actualSize, previewUrl: URL.createObjectURL(convertedFile) } : f
        )
      );
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setConverting(false);
    }
  }, [files, workers, convertImage]);

  const handleDownload = useCallback((file: FileWithMeta) => {
    if (file.convertedFile) {
      const url = URL.createObjectURL(file.convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.convertedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip();
    const convertedFiles = files.filter(f => f.convertedFile);
    
    convertedFiles.forEach(file => {
      if (file.convertedFile) {
        zip.file(file.convertedFile.name, file.convertedFile);
      }
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "converted_images.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const handleDeleteFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter(f => f.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const toggleBatchProcessing = useCallback(() => {
    setBatchProcessing(prev => !prev);
  }, []);

  return (
    <div className={`p-4 space-y-6 max-w-4xl mx-auto ${darkMode ? 'dark' : ''}`}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Image Converter</h2>
            <div className="flex items-center space-x-2">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload your files</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-format">Set Conversion Type for All</Label>
            <Select onValueChange={handleGlobalFormatChange} value={globalFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image/png">PNG</SelectItem>
                <SelectItem value="image/jpeg">JPEG</SelectItem>
                <SelectItem value="image/webp">WebP</SelectItem>
                <SelectItem value="image/bmp">BMP</SelectItem>
                <SelectItem value="image/gif">GIF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="global-quality">Set Compression Quality for All</Label>
            <Slider
              id="global-quality"
              min={1}
              max={100}
              step={1}
              value={[globalQuality]}
              onValueChange={handleGlobalQualityChange}
            />
            <p className="text-sm text-muted-foreground">Quality: {globalQuality}%</p>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="batch-processing">Batch Processing</Label>
            <Switch id="batch-processing" checked={batchProcessing} onCheckedChange={toggleBatchProcessing} />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleConvertAll} disabled={converting || files.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              {converting ? 'Converting...' : 'Convert All'}
            </Button>
            <Button onClick={handleDownloadAll} disabled={files.filter(f => f.convertedFile).length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download All
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map(({ id, file, outputFormat, quality, convertedFile, actualSize, previewUrl }) => (
          <Card key={id}>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-medium">{file.name}</h3>
                <p className="text-sm text-muted-foreground">Original Size: {(file.size / 1024).toFixed(2)} KB</p>
                {actualSize !== null && (
                  <p className="text-sm text-muted-foreground">
                    Converted Size: {(actualSize / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
              {previewUrl && (
                <div className="relative overflow-hidden" style={{ height: '200px' }}>
                  <img
                    src={previewUrl}
                    alt={`Preview - ${file.name}`}
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <Button size="sm" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.1))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {!batchProcessing && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`output-format-${id}`}>Output Format</Label>
                    <Select onValueChange={(value) => handleFormatChange(id, value)} value={outputFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image/png">PNG</SelectItem>
                        <SelectItem value="image/jpeg">JPEG</SelectItem>
                        <SelectItem value="image/webp">WebP</SelectItem>
                        <SelectItem value="image/bmp">BMP</SelectItem>
                        <SelectItem value="image/gif">GIF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`quality-${id}`}>Compression Quality</Label>
                    <Slider
                      id={`quality-${id}`}
                      min={1}
                      max={100}
                      step={1}
                      value={[quality]}
                      onValueChange={(value) => handleQualityChange(id, value)}
                    />
                    <p className="text-sm text-muted-foreground">Quality: {quality}%</p>
                  </div>
                </>
              )}
              <div className="flex space-x-2">
                {!batchProcessing && (
                  <Button onClick={() => handleConvertSingle(id)} disabled={converting}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Convert
                  </Button>
                )}
                {convertedFile && (
                  <Button onClick={() => handleDownload({ id, file, outputFormat, quality, convertedFile, actualSize, previewUrl })}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button variant="destructive" onClick={() => handleDeleteFile(id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}