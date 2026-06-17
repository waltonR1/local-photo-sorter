export interface ThumbnailRecord {
  id: string
  photoId: string
  relativePath: string
  fileSize: number
  lastModified: number
  blob: Blob
  width: number
  height: number
  createdAt: number
  updatedAt: number
}
