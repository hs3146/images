'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Leaf, Sun, Cloud, Droplet, Sprout, TreesIcon as Tree, Wind } from 'lucide-react'
import Tesseract from 'tesseract.js'

const languages = [
  { code: 'eng', name: 'English' },
  { code: 'pan', name: 'Punjabi' },
  { code: 'hin', name: 'Hindi' },
  { code: 'ben', name: 'Bengali' },
  { code: 'tam', name: 'Tamil' },
  { code: 'tel', name: 'Telugu' },
  { code: 'mar', name: 'Marathi' },
  { code: 'urd', name: 'Urdu' },
  { code: 'guj', name: 'Gujarati' },
  { code: 'kan', name: 'Kannada' },
  { code: 'mal', name: 'Malayalam' },
  { code: 'ori', name: 'Odia' },
  { code: 'pun', name: 'Punjabi' },
  { code: 'asm', name: 'Assamese' },
  { code: 'spa', name: 'Spanish' },
  { code: 'fra', name: 'French' },
  { code: 'deu', name: 'German' },
  { code: 'ita', name: 'Italian' },
  { code: 'por', name: 'Portuguese' },
  { code: 'rus', name: 'Russian' },
  { code: 'ara', name: 'Arabic' },
]

export default function Component() {
  const [image, setImage] = useState<File | null>(null)
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<number>(0)
  const [progress, setProgress] = useState<number>(0)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('eng')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [leafAnimation, setLeafAnimation] = useState<boolean>(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setText('')
      setError(null)
      setActiveSection(1)
    }
  }

  const handleProcessImage = async () => {
    if (!image) return
    setLoading(true)
    setError(null)
    setText('')
    setActiveSection(2)

    try {
      const { data } = await Tesseract.recognize(image, selectedLanguage, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress * 100)
          }
        },
      })
      setText(data.text)
      setActiveSection(3)
    } catch (err) {
      setError('Failed to process the image. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLeafAnimation((prev) => !prev)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const sections = [
    {
      title: 'Upload',
      icon: <Leaf className={`w-8 h-8 ${leafAnimation ? 'animate-bounce' : ''}`} />,
      content: (
        <div className="flex flex-col items-center space-y-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-3 flex items-center space-x-2"
          >
            <Sprout className="w-5 h-5" />
            <span>Choose Image</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      title: 'Preview',
      icon: <Sun className="w-8 h-8 text-yellow-500 animate-spin-slow" />,
      content: image && (
        <div className="relative w-64 h-64 mx-auto">
          <img
            src={URL.createObjectURL(image)}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/50 to-transparent rounded-lg" />
        </div>
      ),
    },
    {
      title: 'Process',
      icon: <Cloud className="w-8 h-8 text-blue-300 animate-pulse" />,
      content: (
        <div className="space-y-4">
          <Progress value={progress} className="w-full h-2 bg-green-200" />
          <p className="text-center text-green-700">Extracting text from your image...</p>
        </div>
      ),
    },
    {
      title: 'Result',
      icon: <Droplet className="w-8 h-8 text-blue-500 animate-bounce" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800">Extracted Text:</h3>
          <div className="relative">
            <textarea
              value={text}
              readOnly
              rows={6}
              className="w-full p-4 bg-green-50 text-green-800 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Tree className="absolute right-2 bottom-2 w-6 h-6 text-green-500 opacity-50" />
          </div>
        </div>
      ),
    },
    {
      title: 'Edit',
      icon: <Wind className="w-8 h-8 text-gray-400 animate-wiggle" />,
      content: (
        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full p-4 bg-green-50 text-green-800 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Edit your text here..."
          />
          <Button
            onClick={() => setActiveSection(5)}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            Proceed to Download
          </Button>
        </div>
      ),
    },
    {
      title: 'Download',
      icon: <Sprout className="w-8 h-8 text-green-600 animate-grow" />,
      content: (
        <div className="space-y-4">
          <p className="text-center text-green-700">Your text is ready for download!</p>
          <Button
            onClick={() => {
              const blob = new Blob([text], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `extracted_text_${selectedLanguage}.txt`
              a.click()
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center space-x-2"
          >
            <Leaf className="w-5 h-5" />
            <span>Download Text</span>
          </Button>
        </div>
      ),
    },
    {
      title: 'Feedback',
      icon: <Tree className="w-8 h-8 text-green-700" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-800 text-center">How was your experience?</h3>
          <div className="flex justify-center space-x-4">
            {['😃', '😐', '😞'].map((emoji, index) => (
              <button
                key={index}
                onClick={() => alert(`Thank you for your ${emoji} feedback!`)}
                className="text-4xl hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setActiveSection(0)}
            className="w-full bg-green-500 hover:bg-green-600 text-white mt-4"
          >
            Start Over
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">🌿 Multilingual Leaf Reader 🌿</h1>
        <div className="flex justify-between mb-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`flex flex-col items-center cursor-pointer ${
                activeSection === index ? 'text-green-600' : 'text-gray-400'
              }`}
              onClick={() => setActiveSection(index)}
            >
              {section.icon}
              <span className="text-xs mt-1">{section.title}</span>
            </div>
          ))}
        </div>
        <div className="bg-green-50 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
          {sections[activeSection].content}
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
        {activeSection === 1 && (
          <div className="mt-4 flex justify-center">
            <Button onClick={handleProcessImage} className="bg-green-500 hover:bg-green-600 text-white">
              {loading ? 'Processing...' : 'Extract Text'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}