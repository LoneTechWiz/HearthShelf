"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

type NativeBarcode = { rawValue?: string }
type NativeBarcodeDetector = {
  detect: (source: HTMLCanvasElement | HTMLVideoElement) => Promise<NativeBarcode[]>
}
type NativeBarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): NativeBarcodeDetector
  getSupportedFormats?: () => Promise<string[]>
}
type ScannerVideoConstraints = MediaTrackConstraints & {
  focusMode?: ConstrainDOMString
}

const barcodeFormats = [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A]
const nativeBarcodeFormats = ["ean_13", "upc_a"]

function createZxingReader() {
  const hints = new Map<DecodeHintType, unknown>()
  hints.set(DecodeHintType.POSSIBLE_FORMATS, barcodeFormats)
  hints.set(DecodeHintType.TRY_HARDER, true)

  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 150,
    tryPlayVideoTimeout: 10_000,
  })
}

function getRearCameraConstraints(): MediaStreamConstraints {
  const video: ScannerVideoConstraints = {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    focusMode: { ideal: "continuous" },
  }

  return {
    video,
    audio: false,
  }
}

function getFallbackCameraConstraints(): MediaStreamConstraints {
  return {
    video: {
      facingMode: "environment",
    },
    audio: false,
  }
}

async function openRearCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia(getRearCameraConstraints())
  } catch {
    return navigator.mediaDevices.getUserMedia(getFallbackCameraConstraints())
  }
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop())
}

async function createNativeBarcodeDetector() {
  const detector = (window as typeof window & {
    BarcodeDetector?: NativeBarcodeDetectorConstructor
  }).BarcodeDetector
  if (!detector) return null

  try {
    const supportedFormats = detector.getSupportedFormats
      ? await detector.getSupportedFormats()
      : nativeBarcodeFormats
    const formats = nativeBarcodeFormats.filter((format) => supportedFormats.includes(format))
    if (formats.length === 0) {
      return null
    }
    return new detector({ formats })
  } catch {
    return null
  }
}

function drawVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const width = video.videoWidth
  const height = video.videoHeight
  if (width === 0 || height === 0) return false

  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return false

  context.drawImage(video, 0, 0, width, height)
  return true
}

function drawRotatedFrame(source: HTMLCanvasElement, target: HTMLCanvasElement) {
  if (target.width !== source.height) target.width = source.height
  if (target.height !== source.width) target.height = source.width

  const context = target.getContext("2d", { willReadFrequently: true })
  if (!context) return false

  context.save()
  context.clearRect(0, 0, target.width, target.height)
  context.translate(target.width, 0)
  context.rotate(Math.PI / 2)
  context.drawImage(source, 0, 0)
  context.restore()
  return true
}

async function detectWithNative(
  detector: NativeBarcodeDetector | null,
  canvas: HTMLCanvasElement
) {
  if (!detector) return null

  try {
    const [barcode] = await detector.detect(canvas)
    return barcode?.rawValue ?? null
  } catch {
    return null
  }
}

function decodeWithZxing(reader: BrowserMultiFormatReader, canvas: HTMLCanvasElement) {
  try {
    return reader.decodeFromCanvas(canvas).getText()
  } catch {
    return null
  }
}

function startFrameBarcodeScan(
  reader: BrowserMultiFormatReader,
  detector: NativeBarcodeDetector | null,
  video: HTMLVideoElement,
  onDetected: (code: string) => void
) {
  let stopped = false
  let inFlight = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  const frameCanvas = document.createElement("canvas")
  const rotatedCanvas = document.createElement("canvas")

  async function scan() {
    if (stopped) return

    if (!inFlight && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      inFlight = true
      try {
        const didDraw = drawVideoFrame(video, frameCanvas)
        const code = didDraw
          ? await detectWithNative(detector, frameCanvas)
            ?? decodeWithZxing(reader, frameCanvas)
            ?? (drawRotatedFrame(frameCanvas, rotatedCanvas)
              ? await detectWithNative(detector, rotatedCanvas)
                ?? decodeWithZxing(reader, rotatedCanvas)
              : null)
          : null

        if (code) {
          onDetected(code)
          return
        }
      } catch {
        // Some Android camera frames are briefly unreadable while autofocus settles.
      } finally {
        inFlight = false
      }
    }

    timeoutId = setTimeout(scan, 250)
  }

  scan()

  return () => {
    stopped = true
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  })

  const [error, setError] = useState<string | null>(null)

  // Start the camera once on mount; refs keep this effect from re-running when
  // the parent re-creates the onDetected callback.
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    let stopNativeScan: (() => void) | null = null
    let cancelled = false
    let detected = false

    function handleDetected(code: string) {
      if (cancelled || detected) return
      detected = true
      stopNativeScan?.()
      const stream = video.srcObject instanceof MediaStream ? video.srcObject : null
      if (stream) stopStream(stream)
      video.srcObject = null
      onDetectedRef.current(code)
    }

    async function start() {
      let stream: MediaStream | null = null
      try {
        const reader = createZxingReader()
        stream = await openRearCamera()
        if (cancelled) {
          stopStream(stream)
          return
        }

        video.srcObject = stream
        await video.play()

        const nativeDetector = await createNativeBarcodeDetector()
        if (cancelled) return

        stopNativeScan = startFrameBarcodeScan(reader, nativeDetector, video, handleDetected)
      } catch {
        if (stream) stopStream(stream)
        if (!cancelled) setError("Unable to access camera. Check permissions and try again.")
      }
    }

    start()

    return () => {
      cancelled = true
      stopNativeScan?.()
      const stream = video.srcObject instanceof MediaStream ? video.srcObject : null
      if (stream) stopStream(stream)
      video.srcObject = null
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scanner"
      className="fixed inset-0 z-[60] bg-black text-white"
    >
      {error ? (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-white">{error}</p>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-ink shadow-lg"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="relative min-h-full overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_42%,rgba(0,0,0,0.35)_78%)]" />

          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/65">
                ISBN Scanner
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold">
                Align the barcode in the guide
              </h2>
            </div>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/70"
            >
              Cancel
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-[18%] flex flex-col items-center px-5">
            <div className="relative aspect-[3/1] w-full max-w-sm rounded-2xl border border-white/40 bg-black/10 shadow-[0_0_0_999px_rgba(0,0,0,0.34)] backdrop-blur-[1px]">
              <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-emerald-300" />
              <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-emerald-300" />
              <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-emerald-300" />
              <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-emerald-300" />
              <div className="absolute left-5 right-5 top-1/2 h-px -translate-y-1/2 bg-emerald-300/90 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
              <div className="absolute inset-x-8 top-1/2 flex -translate-y-1/2 items-center justify-between opacity-55">
                {Array.from({ length: 13 }).map((_, index) => (
                  <span
                    key={index}
                    className="h-12 w-px rounded-full bg-white"
                    style={{ opacity: index % 3 === 0 ? 0.9 : 0.45 }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 rounded-full bg-black/60 px-4 py-2 text-center text-sm font-medium text-white shadow-lg ring-1 ring-white/15 backdrop-blur">
              Place the ISBN barcode here, near the bottom of the camera view
            </p>
            <p className="mt-2 max-w-xs text-center text-xs text-white/75">
              Hold steady and fill the guide with the printed bars.
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
            <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs text-white/75 ring-1 ring-white/10 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
              Scanning continuously
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
