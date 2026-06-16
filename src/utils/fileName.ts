const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|]/g

export function sanitizeFileName(name: string): string {
  return name.trim().replace(INVALID_FILE_NAME_CHARS, '_')
}

export function isValidCategoryName(name: string): boolean {
  const trimmed = name.trim()

  if (!trimmed) {
    return false
  }

  return !INVALID_FILE_NAME_CHARS.test(trimmed)
}

export function splitFileName(fileName: string): {
  baseName: string
  extension: string
} {
  const lastDotIndex = fileName.lastIndexOf('.')

  if (lastDotIndex <= 0) {
    return {
      baseName: fileName,
      extension: '',
    }
  }

  return {
    baseName: fileName.slice(0, lastDotIndex),
    extension: fileName.slice(lastDotIndex),
  }
}

export function buildDuplicateFileName(fileName: string, index: number): string {
  const { baseName, extension } = splitFileName(fileName)

  return `${baseName}_${index}${extension}`
}

export function hasInvalidFileNameChars(name: string): boolean {
  return INVALID_FILE_NAME_CHARS.test(name)
}

export function buildPhotoFileNameWithOriginalExtension(options: {
  inputName: string
  originalFileName: string
}): string {
  const trimmedName = options.inputName.trim()

  if (!trimmedName) {
    throw new Error('文件名不能为空')
  }

  if (hasInvalidFileNameChars(trimmedName)) {
    throw new Error('文件名不能包含以下字符：\\ / : * ? " < > |')
  }

  const originalParts = splitFileName(options.originalFileName)
  const inputParts = splitFileName(trimmedName)

  const baseName = inputParts.baseName.trim()

  if (!baseName) {
    throw new Error('文件名不能为空')
  }

  return `${baseName}${originalParts.extension}`
}