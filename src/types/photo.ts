export type PhotoParentType = 'unsorted' | 'category' | 'discarded'

export type PhotoViewKey = 'all' | 'unsorted' | 'discarded' | `category:${string}`

export interface PhotoItem {
  id: string
  name: string
  extension: string
  relativePath: string
  parentType: PhotoParentType
  categoryName?: string
  size: number
  lastModified: number
  objectUrl: string
  thumbnailUrl?: string
  thumbnailLoading?: boolean
  thumbnailError?: boolean
  fileHandle: FileSystemFileHandle
  parentDirHandle: FileSystemDirectoryHandle
}
