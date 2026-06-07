"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const [error, setError] = useState<string | null>(null)

  // Start the camera once on mount; refs keep this effect from re-running when
  // the parent re-creates the onDetected callback.
  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current
    let stream: MediaStream | null = null
    let controls: IScannerControls | null = null
    let cancelled = false

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (cancelled) return

        video.srcObject = stream

        // Wait for the video to confirm it's playing before starting decode.
        // play() can fire an AbortError even when the video ends up playing fine,
        // so we resolve on the onplaying event instead of the play() promise.
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("timeout")), 10_000)
          video.onplaying = () => { clearTimeout(timeout); resolve() }
          video.play().catch((e: DOMException) => {
            if (e.name !== "AbortError") { clearTimeout(timeout); reject(e) }
          })
        })
        if (cancelled) return

        const reader = new BrowserMultiFormatReader()
        controls = await reader.decodeFromVideoElement(video, (result) => {
          if (cancelled || !result) return
          controls?.stop()
          stream?.getTracks().forEach((t) => t.stop())
          video.srcObject = null
          onDetectedRef.current(result.getText())
        })
        if (cancelled) controls.stop()
      } catch {
        if (!cancelled) setError("Unable to access camera. Check permissions and try again.")
      }
    }

    start()

    return () => {
      cancelled = true
      controls?.stop()
      stream?.getTracks().forEach((t) => t.stop())
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
            className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-900"
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
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="mt-4 rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-900"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  )
}
