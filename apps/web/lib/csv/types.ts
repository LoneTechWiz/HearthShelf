export type ImportSkip = { line: number; reason: string }

export type ImportResult =
  | { error: string }
  | {
      created: number
      updated: number
      skipped: ImportSkip[]
      importedIds?: string[]
    }
