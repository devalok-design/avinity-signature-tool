import { useState, useCallback, useRef, useEffect } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { removeBackground } from '@imgly/background-removal'
import {
  IconUpload,
  IconDownload,
  IconRefresh,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-react'

type Stage = 'idle' | 'cropping' | 'processing' | 'ready'

const TARGET_W = 180
const TARGET_H = 186
const ASPECT = TARGET_W / TARGET_H
const BOTTOM_LEFT_RADIUS = 69 // px — matches the signature's portrait curve

export function App() {
  const [stage, setStage] = useState<Stage>('idle')
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      if (cutoutUrl) URL.revokeObjectURL(cutoutUrl)
    }
  }, [sourceUrl, cutoutUrl])

  function reset() {
    setStage('idle')
    setSourceUrl(null)
    setCutoutUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
    setError(null)
    setProgress('')
  }

  function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Image is too large (max 50MB).')
      return
    }
    const url = URL.createObjectURL(file)
    setSourceUrl(url)
    setStage('cropping')
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels)
  }, [])

  async function handleProcess() {
    if (!sourceUrl || !croppedArea) return
    setStage('processing')
    setProgress('Cropping…')
    try {
      const cropped = await cropImage(sourceUrl, croppedArea)
      setProgress('Loading background-removal model (first time only — about 10MB)…')
      const cutoutBlob = await removeBackground(cropped, {
        progress: (key, current, total) => {
          if (key.startsWith('fetch')) {
            const pct = Math.round((current / total) * 100)
            setProgress(`Downloading model… ${pct}%`)
          } else if (key.startsWith('compute')) {
            setProgress('Removing background…')
          }
        },
      })
      setProgress('Rounding bottom-left corner…')
      const roundedBlob = await applyBottomLeftRadius(cutoutBlob, BOTTOM_LEFT_RADIUS)
      const url = URL.createObjectURL(roundedBlob)
      setCutoutUrl(url)
      setStage('ready')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStage('cropping')
    }
  }

  function download() {
    if (!cutoutUrl) return
    const a = document.createElement('a')
    a.href = cutoutUrl
    a.download = 'avinity-signature-portrait.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen w-full">
      <header className="border-avinity-blue/60 bg-white border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
          <img src="/logo.png" alt="" className="h-9 w-9" />
          <div className="text-avinity-dark text-lg font-bold tracking-tight">
            Avinity Signature Photo Maker
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-avinity-dark mb-3 text-3xl font-bold tracking-tight">
            Prep your portrait for the email signature
          </h1>
          <p className="text-avinity-ink/70 max-w-2xl">
            Upload a photo of yourself, crop it to fit, and we'll remove the background.
            Download the transparent PNG and upload it as your profile picture in
            Signature Hound. Photos are processed on your device — nothing is uploaded.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stage === 'idle' && <UploadStep onFile={handleFile} inputRef={fileInputRef} />}

        {stage === 'cropping' && sourceUrl && (
          <CropStep
            sourceUrl={sourceUrl}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            onNext={handleProcess}
            onReset={reset}
          />
        )}

        {stage === 'processing' && <ProcessingStep progress={progress} />}

        {stage === 'ready' && cutoutUrl && (
          <ReadyStep cutoutUrl={cutoutUrl} onDownload={download} onReset={reset} />
        )}
      </main>

      <footer className="border-avinity-blue/60 mt-12 border-t bg-white">
        <div className="text-avinity-ink/60 mx-auto flex max-w-5xl items-center justify-between px-6 py-4 text-xs">
          <div>Built by Devalok for Avinity Health</div>
          <div>Your photo never leaves your browser.</div>
        </div>
      </footer>
    </div>
  )
}

function UploadStep({
  onFile,
  inputRef,
}: {
  onFile: (file: File) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragOver, setDragOver] = useState(false)
  return (
    <div
      className={`border-avinity-blue rounded-2xl border-2 border-dashed bg-white transition ${
        dragOver ? 'bg-avinity-blue/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
    >
      <div className="flex flex-col items-center justify-center px-6 py-20">
        <div className="bg-avinity-blue/40 text-avinity-dark mb-5 rounded-full p-4">
          <IconUpload size={32} strokeWidth={1.75} />
        </div>
        <div className="text-avinity-dark mb-2 text-lg font-semibold">
          Drop your photo here
        </div>
        <div className="text-avinity-ink/60 mb-6 text-sm">
          or pick one from your computer · JPG, PNG, WebP · up to 50MB
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="bg-avinity-dark hover:bg-avinity-dark/90 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          Choose a photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
          }}
        />
      </div>
    </div>
  )
}

function CropStep({
  sourceUrl,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onNext,
  onReset,
}: {
  sourceUrl: string
  crop: { x: number; y: number }
  zoom: number
  onCropChange: (c: { x: number; y: number }) => void
  onZoomChange: (z: number) => void
  onCropComplete: (a: Area, p: Area) => void
  onNext: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="border-avinity-blue/60 overflow-hidden rounded-2xl border bg-white">
        <div className="bg-avinity-bg relative" style={{ height: 480 }}>
          <Cropper
            image={sourceUrl}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            objectFit="contain"
            classes={{ cropAreaClassName: 'crop-guide' }}
            showGrid={false}
          />
        </div>
        <div className="border-avinity-blue/60 flex items-center gap-4 border-t px-6 py-4">
          <span className="text-avinity-ink/70 text-xs font-medium">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="accent-avinity-dark flex-1"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="border-avinity-dark/30 text-avinity-dark hover:bg-avinity-blue/30 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition"
        >
          <IconRefresh size={16} />
          Pick a different photo
        </button>
        <button
          onClick={onNext}
          className="bg-avinity-dark hover:bg-avinity-dark/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          Remove background
          <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

function ProcessingStep({ progress }: { progress: string }) {
  return (
    <div className="border-avinity-blue/60 flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-24">
      <div className="bg-avinity-blue/40 text-avinity-dark mb-5 rounded-full p-4">
        <IconSparkles size={32} strokeWidth={1.75} className="animate-pulse" />
      </div>
      <div className="text-avinity-dark mb-2 text-lg font-semibold">
        Working on it…
      </div>
      <div className="text-avinity-ink/60 text-sm">{progress || 'Removing background'}</div>
    </div>
  )
}

function ReadyStep({
  cutoutUrl,
  onDownload,
  onReset,
}: {
  cutoutUrl: string
  onDownload: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border-avinity-blue/60 overflow-hidden rounded-2xl border bg-white">
          <div className="border-avinity-blue/60 border-b px-5 py-3 text-xs font-semibold tracking-wide text-avinity-dark uppercase">
            Your transparent portrait
          </div>
          <div
            className="flex items-center justify-center p-6"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #eef4f5 25%, transparent 25%), linear-gradient(-45deg, #eef4f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef4f5 75%), linear-gradient(-45deg, transparent 75%, #eef4f5 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, 8px 0',
            }}
          >
            <img src={cutoutUrl} alt="" className="max-h-72" />
          </div>
        </div>

        <div className="border-avinity-blue/60 overflow-hidden rounded-2xl border bg-white">
          <div className="border-avinity-blue/60 border-b px-5 py-3 text-xs font-semibold tracking-wide text-avinity-dark uppercase">
            How it'll look in the signature
          </div>
          <div className="bg-white p-6">
            <SignaturePreview cutoutUrl={cutoutUrl} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="border-avinity-dark/30 text-avinity-dark hover:bg-avinity-blue/30 inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition"
        >
          <IconRefresh size={16} />
          Start over
        </button>
        <button
          onClick={onDownload}
          className="bg-avinity-dark hover:bg-avinity-dark/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition"
        >
          <IconDownload size={16} />
          Download PNG
        </button>
      </div>

      <div className="border-avinity-blue/60 rounded-xl border bg-avinity-blue/20 px-5 py-4 text-sm text-avinity-ink/80">
        <strong className="text-avinity-dark">Next step:</strong> open Signature Hound
        and upload this PNG as your profile picture in the Avinity signature template.
      </div>
    </div>
  )
}

function SignaturePreview({ cutoutUrl }: { cutoutUrl: string }) {
  return (
    <div className="origin-top-left scale-90" style={{ width: 600 }}>
      <div
        style={{
          position: 'relative',
          width: 600,
          height: 185,
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#015A66',
        }}
      >
        <img
          src="/signature-bg.png"
          alt=""
          style={{ position: 'absolute', zIndex: 1, top: 0, left: 0, height: 185 }}
        />
        <img
          src={cutoutUrl}
          alt=""
          style={{ position: 'absolute', zIndex: 2, top: 0, left: 0, height: 185 }}
        />
        <div
          style={{ position: 'absolute', zIndex: 3, top: 8, left: 190, width: 410 }}
        >
          <div style={{ paddingLeft: 15, paddingTop: 10 }}>
            <div
              style={{
                fontSize: 34,
                fontWeight: 'bold',
                lineHeight: 1,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: '#015A66',
              }}
            >
              Your Name
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 14,
                fontWeight: 'bold',
                color: '#015A66',
              }}
            >
              Your title
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Crops an image given a pixel area, returns a Blob ready for bg removal.
async function cropImage(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = TARGET_W
  canvas.height = TARGET_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context failed')
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    TARGET_W,
    TARGET_H,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
  })
}

// Carves a rounded corner out of the bottom-left of the cutout PNG and
// re-exports as transparent PNG. Mirrors the curve baked into the signature
// design so the portrait flows into the logo behind it instead of cutting
// off as a hard rectangle.
async function applyBottomLeftRadius(blob: Blob, radius: number): Promise<Blob> {
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const w = img.naturalWidth
    const h = img.naturalHeight
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context failed')
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(w, 0)
    ctx.lineTo(w, h)
    ctx.lineTo(radius, h)
    ctx.quadraticCurveTo(0, h, 0, h - radius)
    ctx.lineTo(0, 0)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(img, 0, 0)
    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('toBlob failed'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
