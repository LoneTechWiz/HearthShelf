"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

type NativeBarcode = { rawValue?: string }
type NativeBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<NativeBarcode[]>
}
type NativeBarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): NativeBarcodeDetector
  getSupportedFormats?: () => Promise<string[]>
}
type ScannerVideoConstraints = MediaTrackConstraints & {
  focusMode?: ConstrainDOMString
}

const barcodeFormats = [BarcodeFormat.EAN_13]
const nativeBarcodeFormats = ["ean_13"]

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
    if (!nativeBarcodeFormats.every((format) => supportedFormats.includes(format))) {
      return null
    }
    return new detector({ formats: nativeBarcodeFormats })
  } catch {
    return null
  }
}

function startNativeBarcodeScan(
  detector: NativeBarcodeDetector,
  video: HTMLVideoElement,
  onDetected: (code: string) => void
) {
  let stopped = false
  let inFlight = false
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  async function scan() {
    if (stopped) return

    if (!inFlight && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      inFlight = true
      try {
        const [barcode] = await detector.detect(video)
        const code = barcode?.rawValue
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
    let controls: IScannerControls | null = null
    let stopNativeScan: (() => void) | null = null
    let cancelled = false
    let detected = false

    function handleDetected(code: string) {
      if (cancelled || detected) return
      detected = true
      stopNativeScan?.()
      controls?.stop()
      video.srcObject = null
      onDetectedRef.current(code)
    }

    async function start() {
      let stream: MediaStream | null = null
      try {
        stream = await openRearCamera()
        if (cancelled) {
          stopStream(stream)
          return
        }

        const reader = createZxingReader()
        controls = await reader.decodeFromStream(stream, video, (result) => {
          if (!result) return
          handleDetected(result.getText())
        })
        if (cancelled) {
          controls.stop()
          return
        }

        const nativeDetector = await createNativeBarcodeDetector()
        if (cancelled || !nativeDetector) return

        stopNativeScan = startNativeBarcodeScan(nativeDetector, video, handleDetected)
      } catch {
        if (!controls && stream) stopStream(stream)
        if (!cancelled) setError("Unable to access camera. Check permissions and try again.")
      }
    }

    start()

    return () => {
      cancelled = true
      stopNativeScan?.()
      controls?.stop()
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
