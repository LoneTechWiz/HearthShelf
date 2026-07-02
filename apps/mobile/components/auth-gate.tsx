import type { PropsWithChildren } from "react"
import { Text } from "react-native"
import { useAuth } from "../lib/auth"
import { Button, Card, LoadingState, Screen, SecondaryButton, StatusText } from "./screen"

export function AuthGate({ children }: PropsWithChildren) {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <Screen title="HearthShelf" subtitle="Connecting to your shelf.">
        <LoadingState />
        <StatusText>Checking your mobile session...</StatusText>
      </Screen>
    )
  }

  if (auth.user) return <>{children}</>

  return (
    <Screen title="HearthShelf" subtitle="Your books, movies, and games in one native shelf.">
      <Card>
        <Text>Sign in with the existing HearthShelf web account.</Text>
        <StatusText>
          The first mobile bridge is API-ready. Until token minting is enabled on the
          web callback, sign-in opens the web app and this screen can refresh the current
          server session.
        </StatusText>
        {auth.error ? <StatusText>{auth.error}</StatusText> : null}
        <Button label="Open sign in" onPress={() => void auth.openSignIn()} />
        <SecondaryButton label="Refresh session" onPress={() => void auth.refresh()} />
      </Card>
    </Screen>
  )
}
