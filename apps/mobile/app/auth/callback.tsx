import { Redirect } from "expo-router"
import { Screen, StatusText } from "../../components/screen"
import { useAuth } from "../../lib/auth"

export default function AuthCallbackScreen() {
  const auth = useAuth()

  if (auth.user) return <Redirect href="/" />

  return (
    <Screen title="Signing in">
      <StatusText>Completing sign in and returning to your shelf.</StatusText>
    </Screen>
  )
}
