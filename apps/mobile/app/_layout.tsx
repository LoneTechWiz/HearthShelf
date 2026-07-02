import { Component } from "react"
import type { ErrorInfo, PropsWithChildren } from "react"
import { Slot } from "expo-router"
import { StyleSheet, Text, View } from "react-native"
import { AuthProvider } from "../lib/auth"
import { colors } from "../lib/theme"
import { Button, Card, Screen, StatusText } from "../components/screen"

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </RootErrorBoundary>
  )
}

type ErrorBoundaryState = {
  error: Error | null
}

class RootErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Root mobile render error", error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <Screen title="HearthShelf" subtitle="The mobile app could not finish starting.">
        <Card>
          <Text style={styles.errorTitle}>Startup error</Text>
          <StatusText>{this.state.error.message}</StatusText>
          <Button label="Try again" onPress={() => this.setState({ error: null })} />
        </Card>
      </Screen>
    )
  }
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.routeError}>
      <Card>
        <Text style={styles.errorTitle}>Route error</Text>
        <StatusText>{error.message}</StatusText>
        <Button label="Try again" onPress={retry} />
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "700",
  },
  routeError: {
    backgroundColor: colors.background,
    flex: 1,
    padding: 16,
  },
})
