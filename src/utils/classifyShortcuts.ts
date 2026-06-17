import type { ClassifyShortcutBinding, AppSettings } from '@/types/settings'

const RESERVED_SHORTCUT_KEYS = new Set(['enter', 'space', 'delete', 'n', 'r', 'escape', 'esc'])

function isUsableShortcutKey(key: string): boolean {
  const normalizedKey = key.trim().toLowerCase()

  return Boolean(normalizedKey) && !RESERVED_SHORTCUT_KEYS.has(normalizedKey)
}

function getFallbackShortcutKey(
  index: number,
  fallbackKeys: string[],
  usedKeys: Set<string>,
): string {
  const candidates = [
    fallbackKeys[index],
    ...fallbackKeys,
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
  ].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase()

    if (!usedKeys.has(normalizedCandidate) && isUsableShortcutKey(candidate)) {
      return candidate
    }
  }

  return ''
}

export function buildClassifyShortcutBindings(
  categoryNames: string[],
  settings: AppSettings,
): ClassifyShortcutBinding[] {
  const validCategoryNames = new Set(categoryNames)
  const usedCategoryNames = new Set<string>()
  const usedKeys = new Set<string>()
  const bindings: ClassifyShortcutBinding[] = []

  function addBinding(binding: ClassifyShortcutBinding) {
    const categoryName = binding.categoryName
    const key = binding.key.trim()
    const normalizedKey = key.toLowerCase()

    if (
      bindings.length >= 10 ||
      !validCategoryNames.has(categoryName) ||
      usedCategoryNames.has(categoryName) ||
      usedKeys.has(normalizedKey) ||
      !isUsableShortcutKey(key)
    ) {
      return
    }

    bindings.push({
      key,
      categoryName,
    })
    usedCategoryNames.add(categoryName)
    usedKeys.add(normalizedKey)
  }

  for (const binding of settings.classifyShortcutBindings) {
    addBinding(binding)
  }

  for (const [categoryName, key] of Object.entries(settings.classifyCategoryShortcutMap)) {
    addBinding({
      key,
      categoryName,
    })
  }

  for (const categoryName of categoryNames) {
    if (bindings.length >= 10 || usedCategoryNames.has(categoryName)) {
      continue
    }

    const key = getFallbackShortcutKey(bindings.length, settings.classifyShortcutKeys, usedKeys)

    if (!key) {
      continue
    }

    addBinding({
      key,
      categoryName,
    })
  }

  return bindings
}

export function isReservedClassifyShortcutKey(key: string): boolean {
  return RESERVED_SHORTCUT_KEYS.has(key.trim().toLowerCase())
}
