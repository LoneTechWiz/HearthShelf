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
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4"
    >
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-white">{error}</p>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-ink"
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="max-h-[70vh] w-full max-w-md rounded-lg object-cover"
            muted
            playsInline
          />
          <p className="mt-4 text-sm text-white">
            Point the camera at the book&apos;s barcode
          </p>
          <p className="mt-1 max-w-md text-center text-xs text-white/75">
            If it does not scan, move closer until the barcode fills the frame and try landscape.
          </p>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="mt-4 rounded-lg bg-white px-5 py-2 text-sm font-medium text-ink"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  )
}
