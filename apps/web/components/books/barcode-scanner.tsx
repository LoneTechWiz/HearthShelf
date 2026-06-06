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
    const reader = new BrowserMultiFormatReader()
    let controls: IScannerControls | null = null
    let cancelled = false

    reader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current!,
        (result, _err, ctrl) => {
          if (cancelled) return
          if (result) {
            // Stop the camera before reporting so the parent cannot re-trigger
            // a scan before this scanner's cleanup runs.
            ctrl.stop()
            onDetectedRef.current(result.getText())
          }
        }
      )
      .then((ctrl) => {
        controls = ctrl
        if (cancelled) ctrl.stop()
      })
      .catch(() => {
        setError("Unable to access camera. Check permissions and try again.")
      })

    return () => {
      cancelled = true
      controls?.stop()
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
