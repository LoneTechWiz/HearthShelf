import { StyleSheet, Text, TextInput, View } from "react-native"
import { colors, radii, spacing, typography } from "../lib/theme"

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad"
  multiline?: boolean
  autoCapitalize?: "none" | "sentences" | "words"
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        selectionColor={colors.accent}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.ink, ...typography.label },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.edge,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
})
