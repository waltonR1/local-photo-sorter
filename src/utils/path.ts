export function joinPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .join('/')
}

export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean)
}

export function getFileNameFromPath(path: string): string {
  const parts = splitPath(path)
  return parts[parts.length - 1] ?? ''
}

export function getDirectoryPathFromPath(path: string): string {
  const parts = splitPath(path)
  parts.pop()
  return parts.join('/')
}

export function removeFirstPathSegment(path: string): string {
  const parts = splitPath(path)
  parts.shift()
  return parts.join('/')
}
