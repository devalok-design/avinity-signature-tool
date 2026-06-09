import { useState, useCallback, useRef, useEffect } from 'react'
import confetti from 'canvas-confetti'
import Cropper, { type Area } from 'react-easy-crop'
import { removeBackground } from '@imgly/background-removal'
import { Stepper, Step, StepperContent } from '@devalok/shilp-sutra/ui/stepper'
import { Button } from '@devalok/shilp-sutra/ui/button'
import { Card, CardContent } from '@devalok/shilp-sutra/ui/card'
import { Alert } from '@devalok/shilp-sutra/ui/alert'
import {
  IconUpload,
  IconDownload,
  IconRefresh,
  IconArrowRight,
  IconArrowLeft,
  IconSparkles,
  IconCheck,
  IconExternalLink,
  IconMail,
  IconDeviceDesktop,
} from '@tabler/icons-react'

const SH_TEMPLATE_URL = 'https://signaturehound.com/signature/lkc2glmpv2p3kf'
const DEVALOK_WORDMARK_URL =
  'https://devalok-public-assets.s3.ap-south-1.amazonaws.com/brand/devalok/logos/wordmark-brand.svg'
const AVINITY_COLORS = ['#015A66', '#1FA9B3', '#CFE6F7', '#ffffff']

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'photo-tips', label: 'Photo Tips' },
  { id: 'photo-prep', label: 'Prep Photo' },
  { id: 'signature-hound', label: 'Signature Hound' },
  { id: 'install', label: 'Install' },
  { id: 'done', label: 'Done' },
] as const

type StepId = (typeof STEPS)[number]['id']

function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function App() {
  const isMobile = useMobile()
  const [stepIdx, setStepIdx] = useState(0)
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const step = STEPS[stepIdx].id

  function next() {
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function back() {
    setStepIdx((i) => Math.max(0, i - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function jumpTo(id: StepId) {
    const idx = STEPS.findIndex((s) => s.id === id)
    if (idx >= 0) setStepIdx(idx)
  }

  if (isMobile) {
    return (
      <div className="bg-surface-base flex min-h-screen flex-col items-center justify-center px-ds-06 text-center">
        <div className="bg-accent-3 text-accent-9 mx-auto mb-ds-06 flex h-16 w-16 items-center justify-center rounded-full">
          <IconDeviceDesktop size={32} />
        </div>
        <h1 className="text-surface-fg mb-ds-03 text-ds-2xl font-bold tracking-tight">
          Open this on your laptop or desktop
        </h1>
        <p className="text-surface-fg-muted max-w-xs text-ds-base leading-relaxed">
          Setting up your email signature involves uploading a photo and filling in a form — it works best on a computer.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-base flex min-h-screen flex-col">
      <Header />

      <div className="border-surface-border-subtle bg-surface-overlay border-b">
        <div className="mx-auto max-w-6xl px-ds-06 py-ds-04">
          <Stepper activeStep={stepIdx}>
            {STEPS.map((s) => (
              <Step key={s.id} label={s.label} />
            ))}
          </Stepper>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-ds-06 py-ds-08">
        <StepperContent activeStep={stepIdx}>
          {stepIdx === 0 && <WelcomeStep onNext={next} />}
          {stepIdx === 1 && <PhotoTipsStep onNext={next} onBack={back} />}
          {stepIdx === 2 && (
            <PhotoPrepStep
              cutoutUrl={cutoutUrl}
              hasDownloaded={hasDownloaded}
              onCutout={(url) => {
                setCutoutUrl(url)
                if (!url) setHasDownloaded(false)
              }}
              onDownloaded={() => setHasDownloaded(true)}
              onNext={next}
              onBack={back}
            />
          )}
          {stepIdx === 3 && <SignatureHoundStep onNext={next} onBack={back} />}
          {stepIdx === 4 && <InstallStep onNext={next} onBack={back} />}
          {stepIdx === 5 && <DoneStep onRestart={() => {
            setCutoutUrl(null)
            setHasDownloaded(false)
            jumpTo('welcome')
          }} />}
        </StepperContent>
      </main>

      <Footer />
    </div>
  )
}

// ============================================================================
// Header / Footer
// ============================================================================

function Header() {
  return (
    <header className="bg-surface-overlay border-surface-border-subtle border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-ds-06 py-ds-04">
        <a
          href="https://devalok.in"
          className="flex items-center gap-ds-03"
          target="_blank"
          rel="noreferrer"
        >
          <img src={DEVALOK_WORDMARK_URL} alt="Devalok" className="h-12" />
        </a>
        <div className="bg-surface-border-subtle h-6 w-px" />
        <img
          src="/avinity-lockup.svg"
          alt="Avinity Health"
          className="h-9"
          style={{
            filter:
              'brightness(0) saturate(100%) invert(20%) sepia(54%) saturate(917%) hue-rotate(151deg) brightness(95%) contrast(101%)',
          }}
        />
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-surface-border-subtle bg-surface-overlay mt-ds-10 border-t">
      <div className="text-surface-fg-muted mx-auto flex max-w-6xl items-center justify-between px-ds-06 py-ds-04 text-ds-xs">
        <div>
          Built by{' '}
          <a
            href="https://devalok.in"
            target="_blank"
            rel="noreferrer"
            className="text-accent-9 hover:underline font-semibold"
          >
            Devalok
          </a>{' '}
          for Avinity Health
        </div>
        <div>Your photo never leaves your browser.</div>
      </div>
    </footer>
  )
}

function NavBar({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideBack = false,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
}) {
  return (
    <div className="mt-ds-10 flex items-center justify-between">
      {!hideBack && onBack ? (
        <Button variant="ghost" onClick={onBack} startIcon={<IconArrowLeft size={18} />}>
          Back
        </Button>
      ) : (
        <span />
      )}
      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled} endIcon={<IconArrowRight size={18} />}>
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

function StepLabel({ children }: { children: string }) {
  return (
    <div className="text-accent-9 mb-ds-04 text-ds-xs font-bold tracking-widest uppercase">
      {children}
    </div>
  )
}

function StepHeading({ children }: { children: string }) {
  return (
    <h1 className="text-surface-fg mb-ds-05 text-ds-4xl font-bold tracking-tight">
      {children}
    </h1>
  )
}

function StepIntro({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-surface-fg-muted mb-ds-08 max-w-2xl text-ds-lg leading-relaxed">
      {children}
    </p>
  )
}

// ============================================================================
// Step 1 — Welcome
// ============================================================================

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepLabel>Step 1 — Welcome</StepLabel>
      <StepHeading>Your Avinity email signature</StepHeading>

      <div className="flex flex-col gap-ds-06 lg:flex-row lg:items-start mb-ds-07">
        {/* Email preview mock */}
        <div className="lg:flex-1 min-w-0">
          <p className="text-surface-fg-muted mb-ds-03 text-ds-sm font-medium">
            What you'll have at the end
          </p>
          <div className="bg-surface-overlay border-surface-border rounded-xl overflow-hidden shadow-md">
            {/* Mock email chrome */}
            <div className="border-surface-border-subtle bg-surface-base flex items-center gap-ds-02 border-b px-ds-05 py-ds-03">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <span className="h-3 w-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="text-surface-fg-subtle bg-surface-overlay mx-auto rounded-md px-ds-05 py-1 text-ds-xs">
                Gmail — New Message
              </div>
            </div>
            {/* Email body */}
            <div className="px-ds-06 pt-ds-05 pb-ds-05">
              <div className="text-surface-fg-muted mb-ds-04 space-y-1 border-b border-dashed pb-ds-04 text-ds-sm">
                <div><span className="font-semibold">To:</span> sarah.miller@gmail.com</div>
                <div><span className="font-semibold">Subject:</span> Your care plan + next steps</div>
              </div>
              <p className="text-surface-fg-muted mb-ds-05 text-ds-sm leading-relaxed">
                Hi Sarah, it was great meeting you today. I've outlined your care plan below — please review and reach out with any questions before our next session.
              </p>
              <div className="border-surface-border-subtle border-t pt-ds-04">
                <img
                  src="/example-signature.png"
                  alt="Example Avinity Health email signature"
                  className="max-w-[480px] w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="lg:w-80 shrink-0">
          <p className="text-surface-fg-muted mb-ds-03 text-ds-sm font-medium">How it works</p>
          <div className="space-y-ds-03">
            {[
              { n: 1, title: 'Pick a photo', desc: "We'll guide you on what works" },
              { n: 2, title: 'Prep your portrait', desc: 'Auto-crop and remove background' },
              { n: 3, title: 'Fill in your details', desc: 'Name, title, contact in Signature Hound' },
              { n: 4, title: 'Install in your email', desc: 'Gmail, Outlook, Apple Mail' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-surface-overlay border-surface-border flex gap-ds-04 rounded-xl border p-ds-05">
                <span className="bg-accent-3 text-accent-9 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ds-sm font-bold">
                  {n}
                </span>
                <div>
                  <div className="text-surface-fg text-ds-base font-semibold">{title}</div>
                  <div className="text-surface-fg-muted text-ds-sm leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NavBar onNext={onNext} nextLabel="Let's go" hideBack />

      <div className="mt-ds-04 text-center">
        <a
          href={SH_TEMPLATE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-surface-fg-muted hover:text-accent-9 text-ds-sm hover:underline"
        >
          Already have your photo ready? Skip to Signature Hound →
        </a>
        <p className="text-surface-fg-subtle mt-1 text-ds-xs">
          You'll need to upload your portrait PNG manually in the Profile Picture field.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// Step 2 — Photo Tips
// ============================================================================

function PhotoTipsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <StepLabel>Step 2 — Photo tips</StepLabel>
      <StepHeading>Pick the right portrait</StepHeading>
      <StepIntro>
        A clean photo gives better results. Takes 10 seconds to check.
      </StepIntro>

      <div className="gap-ds-05 grid sm:grid-cols-2">
        <TipCard
          title="Do this"
          tone="good"
          items={[
            'Plain or solid background',
            'Face the camera',
            'Even lighting',
            'Head and shoulders in frame',
            'Sharp, no blur',
          ]}
        />
        <TipCard
          title="Avoid this"
          tone="bad"
          items={[
            'Group photos',
            'Heavy shadows',
            'Backlit (window behind you)',
            'Sunglasses or hats',
            'Low-resolution images',
          ]}
        />
      </div>

      <div className="mt-ds-05">
        <Alert color="info" title="Phone selfie works fine">
          Good light is all you need. No professional headshot required.
        </Alert>
      </div>

      <NavBar onBack={onBack} onNext={onNext} nextLabel="Got it" />
    </div>
  )
}

function TipCard({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'good' | 'bad'
}) {
  const isGood = tone === 'good'
  return (
    <Card color={isGood ? 'success' : 'error'}>
      <CardContent className="pt-ds-06">
        <div className="text-surface-fg mb-ds-04 text-ds-base font-bold">{title}</div>
        <ul className="space-y-ds-02">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-ds-02 text-ds-base">
              <span
                className={`mt-0.5 font-bold ${isGood ? 'text-success-9' : 'text-error-9'}`}
              >
                {isGood ? '✓' : '✕'}
              </span>
              <span className="text-surface-fg-muted">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Step 3 — Photo Prep
// ============================================================================

const TARGET_W = 180
const TARGET_H = 186
const ASPECT = TARGET_W / TARGET_H
const BOTTOM_LEFT_RADIUS = 69

type PrepStage = 'idle' | 'cropping' | 'processing' | 'ready'

function PhotoPrepStep({
  cutoutUrl,
  hasDownloaded,
  onCutout,
  onDownloaded,
  onNext,
  onBack,
}: {
  cutoutUrl: string | null
  hasDownloaded: boolean
  onCutout: (url: string | null) => void
  onDownloaded: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [stage, setStage] = useState<PrepStage>(cutoutUrl ? 'ready' : 'idle')
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  function reset() {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl)
    if (cutoutUrl) URL.revokeObjectURL(cutoutUrl)
    setStage('idle')
    setSourceUrl(null)
    onCutout(null)
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
      setProgress('Loading background-removal model (one-time, ~24MB)…')
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
      setProgress('Rounding the bottom-left corner…')
      const rounded = await applyBottomLeftRadius(cutoutBlob, BOTTOM_LEFT_RADIUS)
      const url = URL.createObjectURL(rounded)
      onCutout(url)
      setStage('ready')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setProgress('')
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
    onDownloaded()
  }

  return (
    <div>
      <StepLabel>Step 3 — Prep your photo</StepLabel>
      <StepHeading>Prep your portrait</StepHeading>
      <StepIntro>
        Upload, crop, remove background. Runs in your browser — photo never leaves your device.
      </StepIntro>

      {error && (
        <div className="mb-ds-05">
          <Alert color="error" title="Hmm">{error}</Alert>
        </div>
      )}

      {stage === 'idle' && <UploadZone onFile={handleFile} inputRef={fileInputRef} />}
      {stage === 'cropping' && sourceUrl && (
        <CropPanel
          sourceUrl={sourceUrl}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          onProcess={handleProcess}
          onReset={reset}
        />
      )}
      {stage === 'processing' && <ProcessingPanel progress={progress} />}
      {stage === 'ready' && cutoutUrl && (
        <ReadyPanel
          cutoutUrl={cutoutUrl}
          hasDownloaded={hasDownloaded}
          onDownload={download}
          onReset={reset}
        />
      )}

      <NavBar
        onBack={onBack}
        onNext={onNext}
        nextDisabled={stage !== 'ready' || !hasDownloaded}
        nextLabel={
          stage !== 'ready'
            ? 'Complete prep first'
            : !hasDownloaded
              ? 'Download first'
              : 'Continue'
        }
      />
    </div>
  )
}

function UploadZone({
  onFile,
  inputRef,
}: {
  onFile: (file: File) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragOver, setDragOver] = useState(false)
  return (
    <div
      className={`bg-surface-overlay rounded-control-inner border-2 border-dashed transition ${
        dragOver ? 'border-accent-9 bg-accent-3/30' : 'border-surface-border-subtle'
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
      <div className="flex flex-col items-center justify-center px-ds-06 py-ds-12">
        <div className="bg-accent-3 text-accent-9 mb-ds-05 rounded-full p-ds-04">
          <IconUpload size={32} strokeWidth={1.75} />
        </div>
        <div className="text-surface-fg mb-ds-02 text-ds-lg font-semibold">
          Drop your photo here
        </div>
        <div className="text-surface-fg-muted mb-ds-05 text-ds-base">
          JPG, PNG, WebP · max 50 MB
        </div>
        <Button onClick={() => inputRef.current?.click()}>Choose a photo</Button>
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

function CropPanel({
  sourceUrl,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onProcess,
  onReset,
}: {
  sourceUrl: string
  crop: { x: number; y: number }
  zoom: number
  onCropChange: (c: { x: number; y: number }) => void
  onZoomChange: (z: number) => void
  onCropComplete: (a: Area, p: Area) => void
  onProcess: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-ds-04">
      <Card className="overflow-hidden">
        <div className="bg-surface-inverted relative" style={{ height: 480 }}>
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
        <div className="border-surface-border-subtle flex items-center gap-ds-04 border-t px-ds-06 py-ds-04">
          <span className="text-surface-fg-muted text-ds-xs font-medium">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="accent-accent-9 flex-1"
          />
        </div>
      </Card>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset} startIcon={<IconRefresh size={18} />}>
          Pick a different photo
        </Button>
        <Button
          onClick={onProcess}
          startIcon={<IconSparkles size={18} />}
          style={{ background: 'var(--avinity-dark)', color: '#fff' }}
        >
          Remove background
        </Button>
      </div>
    </div>
  )
}

function ProcessingPanel({ progress }: { progress: string }) {
  const downloadMatch = progress.match(/Downloading model[^\d]*(\d+)%/)
  const downloadPct = downloadMatch ? parseInt(downloadMatch[1]) : null
  const isDownloading = progress.includes('Downloading') || progress.includes('Loading background')
  const isProcessing = progress.includes('Removing') || progress.includes('Rounding') || progress.includes('Cropping')

  const stage = isDownloading
    ? { label: 'Downloading model', hint: 'First time only · ~24 MB · usually 10–30s', pct: downloadPct }
    : isProcessing
      ? { label: 'Removing background', hint: 'Usually 5–15s', pct: null }
      : { label: 'Preparing…', hint: null, pct: null }

  return (
    <Card>
      <CardContent className="pt-ds-06">
        <div className="flex flex-col items-center justify-center px-ds-06 py-ds-10">
          <div className="bg-accent-3 text-accent-9 mb-ds-05 rounded-full p-ds-04">
            <IconSparkles size={32} strokeWidth={1.75} className="animate-pulse" />
          </div>
          <div className="text-surface-fg mb-ds-01 text-ds-lg font-semibold">
            {stage.label}
          </div>
          {stage.hint && (
            <div className="text-surface-fg-subtle mb-ds-05 text-ds-sm">
              {stage.hint}
            </div>
          )}
          {stage.pct !== null ? (
            <div className="w-full max-w-xs">
              <div className="bg-surface-border-subtle mb-ds-02 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${stage.pct}%`, background: 'var(--avinity-dark)' }}
                />
              </div>
              <div className="text-surface-fg-subtle text-center text-ds-xs">{stage.pct}%</div>
            </div>
          ) : isProcessing ? (
            <div className="w-full max-w-xs">
              <div className="bg-surface-border-subtle h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full w-full animate-pulse rounded-full"
                  style={{ background: 'var(--avinity-dark)', opacity: 0.6 }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function ReadyPanel({
  cutoutUrl,
  hasDownloaded,
  onDownload,
  onReset,
}: {
  cutoutUrl: string
  hasDownloaded: boolean
  onDownload: () => void
  onReset: () => void
}) {
  return (
    <div className="space-y-ds-05">
      <div className="gap-ds-05 grid md:grid-cols-2">
        <Card>
          <div className="border-surface-border-subtle text-surface-fg-muted border-b px-ds-05 py-ds-03 text-ds-xs font-bold tracking-wide uppercase">
            Transparent portrait
          </div>
          <div
            className="flex items-center justify-center p-ds-06"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #f0e9e7 25%, transparent 25%), linear-gradient(-45deg, #f0e9e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0e9e7 75%), linear-gradient(-45deg, transparent 75%, #f0e9e7 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, 8px 0',
            }}
          >
            <img src={cutoutUrl} alt="" aria-hidden="true" className="max-h-72" />
          </div>
        </Card>

        <Card>
          <div className="border-surface-border-subtle text-surface-fg-muted border-b px-ds-05 py-ds-03 text-ds-xs font-bold tracking-wide uppercase">
            How it'll look
          </div>
          <div className="bg-white p-ds-06">
            <SignaturePreview cutoutUrl={cutoutUrl} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col items-stretch gap-ds-03 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onReset} startIcon={<IconRefresh size={18} />}>
          Start over with a different photo
        </Button>
        <Button
          onClick={onDownload}
          startIcon={<IconDownload size={18} />}
          style={{ background: 'var(--avinity-dark)', color: '#fff' }}
        >
          {hasDownloaded ? 'Download again' : 'Download PNG'}
        </Button>
      </div>

      {hasDownloaded ? (
        <Alert color="success" title="Saved">
          Keep it handy — upload it as your profile picture in Signature Hound.
        </Alert>
      ) : (
        <Alert color="warning" title="Download to continue">
          Download the PNG to use in Signature Hound.
        </Alert>
      )}
    </div>
  )
}

function SignaturePreview({ cutoutUrl }: { cutoutUrl: string }) {
  return (
    <div className="overflow-x-auto">
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
    </div>
  )
}

// ============================================================================
// Step 4 — Signature Hound
// ============================================================================

function SignatureHoundStep({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  function openAndAdvance() {
    window.open(SH_TEMPLATE_URL, '_blank', 'noopener,noreferrer')
    onNext()
  }

  return (
    <div>
      <StepLabel>Step 4 — Signature Hound</StepLabel>
      <StepHeading>Fill in your details</StepHeading>
      <StepIntro>
        Clicking the button below opens the Avinity template in a new tab. Fill in each of these fields there, then install.
      </StepIntro>

      <Card className="mb-ds-06">
        <CardContent className="pt-ds-06">
          <div className="text-surface-fg mb-ds-04 text-ds-base font-semibold">
            Fields to fill in Signature Hound
          </div>
          <div className="space-y-ds-03">
            {[
              { label: 'Name', hint: 'e.g. Emily Dawson' },
              { label: 'Job title', hint: 'e.g. Founder & Clinical Director | Avinity Health' },
              { label: 'Email', hint: 'e.g. emily@avinityhealth.com' },
              { label: 'Phone', hint: 'Work phone' },
              { label: 'Mobile', hint: 'Shows next to phone' },
              { label: 'Scheduling link', hint: 'Calendly or booking page URL' },
            ].map(({ label, hint }) => (
              <div key={label} className="flex items-baseline gap-ds-03">
                <span className="text-accent-9 shrink-0 font-bold">→</span>
                <span className="text-surface-fg text-ds-base font-semibold">{label}</span>
                <span className="text-surface-fg-muted text-ds-sm">{hint}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert color="warning" title="Don't forget your portrait">
        In the Profile Picture field, upload the transparent PNG you downloaded in Step 3.
      </Alert>

      <div className="mt-ds-04">
        <Alert color="info" title="The preview in Signature Hound may look off — that's normal">
          The signature is designed for email clients, not the Signature Hound editor. Once installed in Gmail, Outlook, or Apple Mail it will render correctly.
        </Alert>
      </div>

      <NavBar
        onBack={onBack}
        onNext={openAndAdvance}
        nextLabel="Open Signature Hound"
      />
    </div>
  )
}


// ============================================================================
// Step 5 — Install
// ============================================================================

function InstallStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <StepLabel>Step 5 — Install</StepLabel>
      <StepHeading>Install your signature</StepHeading>
      <StepIntro>
        If you haven't finished filling in your details in the Signature Hound tab, do that first — then hit <strong>Install</strong>.
      </StepIntro>

      <div className="mb-ds-06">
        <Button
          asChild
          startIcon={<IconExternalLink size={18} />}
          style={{ background: 'var(--avinity-dark)', color: '#fff' }}
        >
          <a href={SH_TEMPLATE_URL} target="_blank" rel="noreferrer">
            Open Signature Hound
          </a>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-ds-06">
          <Instructions
            steps={[
              'In Signature Hound, click Install.',
              'Choose your mail client.',
              'Follow the steps — Gmail is one-click, others walk you through copy-paste.',
              'Send yourself a test email.',
            ]}
          />
          <DocsLink href="https://signaturehound.com/help" />
        </CardContent>
      </Card>

      <NavBar onBack={onBack} onNext={onNext} nextLabel="Done" />
    </div>
  )
}

function Instructions({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-ds-04 mb-ds-05">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-ds-04">
          <span className="bg-accent-9 text-accent-fg flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ds-xs font-bold">
            {i + 1}
          </span>
          <span className="text-surface-fg-muted pt-0.5 text-ds-base leading-relaxed">
            {step}
          </span>
        </li>
      ))}
    </ol>
  )
}

function DocsLink({ href }: { href: string }) {
  return (
    <div className="mt-ds-04 text-ds-sm">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-accent-9 hover:underline"
      >
        Full walkthrough at signaturehound.com/help →
      </a>
    </div>
  )
}

// ============================================================================
// Step 6 — Done
// ============================================================================

function DoneStep({ onRestart }: { onRestart: () => void }) {
  useEffect(() => {
    const fire = (opts: confetti.Options) =>
      confetti({ zIndex: 999, disableForReducedMotion: true, ...opts })

    fire({ particleCount: 60, spread: 70, origin: { y: 0.6 }, colors: AVINITY_COLORS })
    const t1 = setTimeout(() => fire({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 }, colors: AVINITY_COLORS }), 250)
    const t2 = setTimeout(() => fire({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 }, colors: AVINITY_COLORS }), 400)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="text-center">
      <div className="bg-accent-3 text-accent-9 mx-auto mb-ds-05 flex h-16 w-16 items-center justify-center rounded-full">
        <IconCheck size={32} strokeWidth={3} />
      </div>
      <h1 className="text-surface-fg mb-ds-04 text-ds-4xl font-bold tracking-tight">
        You're set.
      </h1>
      <p className="text-surface-fg-muted mx-auto mb-ds-08 max-w-xl text-ds-lg leading-relaxed">
        Send yourself a test email to confirm everything looks right.
      </p>

      <Card className="mx-auto mb-ds-08 max-w-xl text-left">
        <CardContent className="pt-ds-06">
          <ul className="space-y-ds-02 text-ds-base">
            {[
              'Desktop — does the signature look right?',
              'Mobile — still looking sharp?',
              'Send a test, open in the client your contacts use.',
              '"Book a call" link works.',
            ].map((c, i) => (
              <li key={i} className="flex items-start gap-ds-02">
                <span style={{ color: 'var(--avinity-dark)' }}>✓</span>
                <span className="text-surface-fg-muted">{c}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-center gap-ds-03 sm:flex-row">
        <Button
          asChild
          startIcon={<IconMail size={18} />}
          style={{ background: 'var(--avinity-dark)', color: '#fff' }}
        >
          <a href="mailto:?subject=Testing my new Avinity signature&body=Just a test.">
            Send test email
          </a>
        </Button>
        <Button variant="ghost" onClick={onRestart} startIcon={<IconRefresh size={18} />}>
          Start over
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Image helpers
// ============================================================================

async function cropImage(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = TARGET_W
  canvas.height = TARGET_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context failed')
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, TARGET_W, TARGET_H)
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
  })
}

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
