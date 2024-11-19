'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Download, Upload, RefreshCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

type FileWithMeta = {
  file: File
  id: string
  previewUrl: string | null
  numPages: number
  currentPage: number
}

export default function PDFToolkit() {
  const [files, setFiles] = useState<FileWithMeta[]>([])
  const [processing, setProcessing] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [processProgress, setProcessProgress] = useState(0)
  const [selectedOperation, setSelectedOperation] = useState<string>('merge')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
  }, [darkMode])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        id: crypto.randomUUID(),
        previewUrl: null,
        numPages: 0,
        currentPage: 1
      }))
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
      newFiles.forEach(loadPDFPreview)
    }
  }, [])

  const loadPDFPreview = async (fileWithMeta: FileWithMeta) => {
    const url = URL.createObjectURL(fileWithMeta.file)
    const loadingTask = pdfjsLib.getDocument(url)
    const pdf = await loadingTask.promise

    const page = await pdf.getPage(1)
    const scale = 1.5
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    if (context) {
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      await page.render(renderContext).promise
    }

    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === fileWithMeta.id
          ? { ...f, previewUrl: canvas.toDataURL(), numPages: pdf.numPages }
          : f
      )
    )
  }

  const handleProcessPDFs = useCallback(async () => {
    setProcessing(true)
    setProcessProgress(0)

    try {
      let result: Uint8Array | undefined

      switch (selectedOperation) {
        case 'merge':
          result = await mergePDFs(files)
          break
        case 'split':
          await splitPDF(files[0])
          break
        case 'compress':
          result = await compressPDF(files[0])
          break
        default:
          throw new Error('Unsupported operation')
      }

      if (result) {
        const blob = new Blob([result], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `processed_${selectedOperation}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('PDF processing failed:', error)
    } finally {
      setProcessing(false)
      setProcessProgress(100)
    }
  }, [files, selectedOperation])

  const mergePDFs = async (pdfFiles: FileWithMeta[]): Promise<Uint8Array> => {
    const mergedPdf = await PDFDocument.create()
    
    for (let i = 0; i < pdfFiles.length; i++) {
      const pdfBytes = await pdfFiles[i].file.arrayBuffer()
      const pdf = await PDFDocument.load(pdfBytes)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
      setProcessProgress((i + 1) / pdfFiles.length * 100)
    }

    return mergedPdf.save()
  }

  const splitPDF = async (pdfFile: FileWithMeta) => {
    const pdfBytes = await pdfFile.file.arrayBuffer()
    const pdf = await PDFDocument.load(pdfBytes)
    const pageCount = pdf.getPageCount()

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create()
      const [copiedPage] = await newPdf.copyPages(pdf, [i])
      newPdf.addPage(copiedPage)

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `page_${i + 1}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProcessProgress((i + 1) / pageCount * 100)
    }
  }

  const compressPDF = async (pdfFile: FileWithMeta): Promise<Uint8Array> => {
    const pdfBytes = await pdfFile.file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(pdfBytes)

    // This is a simple compression. For more advanced compression,
    // you might want to use a dedicated PDF compression library.
    return pdfDoc.save({ useObjectStreams: false })
  }

  const handleDeleteFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter(f => f.id !== id))
  }, [])

  const handleClearAll = useCallback(() => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handlePageChange = useCallback((id: string, newPage: number) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) =>
        f.id === id ? { ...f, currentPage: newPage } : f
      )
    )
  }, [])

  return (
    <div className={`p-4 space-y-6 max-w-4xl mx-auto ${darkMode ? 'dark' : ''}`}>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">PDF Toolkit</h2>
            <div className="flex items-center space-x-2">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload your PDF files</Label>
            <Input
              id="file-upload"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operation">Select Operation</Label>
            <Select onValueChange={setSelectedOperation} value={selectedOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merge">Merge PDFs</SelectItem>
                <SelectItem value="split">Split PDF</SelectItem>
                <SelectItem value="compress">Compress PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleProcessPDFs} disabled={processing || files.length === 0}>
              <Upload className="w-4 h-4 mr-2" />
              {processing ? 'Processing...' : 'Process PDFs'}
            </Button>
            <Button onClick={handleClearAll} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {processing && (
            <Progress value={processProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.map(({ id, file, previewUrl, numPages, currentPage }) => (
          <Card key={id}>
            <CardContent className="p-4 space-y-4">
              <div>
                <h3 className="font-medium">{file.name}</h3>
                <p className="text-sm text-muted-foreground">Pages: {numPages}</p>
              </div>
              {previewUrl && (
                <div className="relative overflow-hidden" style={{ height: '200px' }}>
                  <img
                    src={previewUrl}
                    alt={`Preview - ${file.name}`}
                    className="w-full h-full object-contain"
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
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handlePageChange(id, Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span>{currentPage} / {numPages}</span>
                <Button
                  size="sm"
                  onClick={() => handlePageChange(id, Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                >
                  Next
                </Button>
              </div>
              <Button variant="destructive" onClick={() => handleDeleteFile(id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}