const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')

  if (lastDotIndex === -1) {
    return ''
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase()
}

export function isSupportedImageFile(fileName: string): boolean {
  const extension = getFileExtension(fileName)
  return SUPPORTED_IMAGE_EXTENSIONS.includes(extension)
}
