import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera"
import { useRouter } from "expo-router"
import { AuthGate } from "../../components/auth-gate"
import { Button, Screen, StatusText } from "../../components/screen"
import { colors, spacing } from "../../lib/theme"

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

  return (
    <AuthGate>
      <Screen title="Scan ISBN" subtitle="Point the camera at a book barcode.">
        {!permission?.granted ? (
          <View style={styles.card}>
            <StatusText>Camera permission is required to scan an ISBN barcode.</StatusText>
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
              onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
            />
            <Text style={styles.caption}>{scanned ? "Barcode found." : "Scanning..."}</Text>
          </View>
        )}
      </Screen>
    </AuthGate>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  cameraWrap: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    overflow: "hidden",
  },
  camera: {
    aspectRatio: 3 / 4,
    width: "100%",
  },
  caption: {
    color: colors.primaryInk,
    padding: spacing.md,
    textAlign: "center",
  },
})
