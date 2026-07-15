import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera"
import { useRouter } from "expo-router"
import { AuthGate } from "../../components/auth-gate"
import { Button, Card, Screen, StatusText } from "../../components/screen"
import { colors, radii, shadows, spacing } from "../../lib/theme"

export default function IsbnScannerScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  function onBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return
    const isbn = result.data.replace(/[^0-9Xx]/g, "")
    if (!isbn) return
    setScanned(true)
    router.replace({ pathname: "/item/new", params: { type: "book", isbn } })
  }

  function cancelScan() {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace({ pathname: "/item/new", params: { type: "book" } })
  }

  return (
    <AuthGate>
      <Screen
        title="Scan ISBN"
        subtitle="Point the camera at a book barcode."
        action={{ label: "Cancel", onPress: cancelScan }}
      >
        {!permission?.granted ? (
          <Card>
            <StatusText>Camera permission is required to scan an ISBN barcode.</StatusText>
            <Button label="Allow Camera" onPress={() => void requestPermission()} fullWidth />
          </Card>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
              onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
            />
            <View pointerEvents="none" style={styles.scanFrame} />
            <View style={styles.captionBar}>
              <Text style={styles.caption}>{scanned ? "Barcode found." : "Scanning..."}</Text>
            </View>
          </View>
        )}
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  cameraWrap: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    minHeight: 420,
    overflow: "hidden",
    ...shadows.card,
  },
  camera: {
    flex: 1,
    minHeight: 420,
    width: "100%",
  },
  scanFrame: {
    borderColor: colors.accentContrast,
    borderRadius: radii.lg,
    borderWidth: 2,
    bottom: 120,
    left: spacing.xl,
    opacity: 0.85,
    position: "absolute",
    right: spacing.xl,
    top: 120,
  },
  captionBar: {
    backgroundColor: "rgba(43, 33, 27, 0.82)",
    bottom: 0,
    left: 0,
    padding: spacing.md,
    position: "absolute",
    right: 0,
  },
  caption: {
    color: colors.primaryInk,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
})
