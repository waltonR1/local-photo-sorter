interface UseClassifyShortcutsOptions {
  isDisabled: () => boolean
  getCategoryByShortcutKey: (key: string) => string | null
  classifyToCategory: (categoryName: string) => Promise<void> | void
  classifyToCurrentCategory: () => Promise<void> | void
  skip: () => Promise<void> | void
  discard: () => Promise<void> | void
  createCategory: () => void
  rename: () => void
  undo: () => Promise<void> | void
  goBack: () => Promise<void> | void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()

  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

export function useClassifyShortcuts(options: UseClassifyShortcutsOptions) {
  async function handleKeydown(event: KeyboardEvent) {
    if (isTypingTarget(event.target) || options.isDisabled()) {
      return
    }

    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      await options.undo()
      return
    }

    const shortcutCategory = options.getCategoryByShortcutKey(event.key)

    if (shortcutCategory) {
      event.preventDefault()
      await options.classifyToCategory(shortcutCategory)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      await options.classifyToCurrentCategory()
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      await options.skip()
      return
    }

    if (event.key === 'Delete') {
      event.preventDefault()
      await options.discard()
      return
    }

    if (event.key.toLowerCase() === 'n') {
      event.preventDefault()
      options.createCategory()
      return
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault()
      options.rename()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      await options.goBack()
    }
  }

  return {
    handleKeydown,
  }
}
